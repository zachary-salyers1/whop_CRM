import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whopSdk } from "@/lib/whop-sdk";

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Get company from database
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Use Whop SDK to fetch memberships
    // The SDK uses the API key from env variables
    const sdk = whopSdk.withCompany(company.whopCompanyId);

    let totalSynced = 0;

    try {
      // Use the v5 members endpoint to list ALL members (paid + free) for this company
      console.log(`Fetching members for company: ${company.whopCompanyId}`);
      const membersUrl = `https://api.whop.com/api/v5/app/members?company_id=${company.whopCompanyId}`;
      console.log(`API URL: ${membersUrl}`);

      const response = await fetch(membersUrl, {
        headers: {
          Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch members:", errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const membersResponse = await response.json();

      console.log(`Fetched ${membersResponse.data?.length || 0} members from API`);

      // Log first few members to debug
      if (membersResponse.data?.length > 0) {
        console.log("Sample members:", membersResponse.data.slice(0, 3).map((m: any) => ({
          username: m.user?.username,
          status: m.status,
          company_id: m.company_id
        })));
      }

      if (!membersResponse.data || membersResponse.data.length === 0) {
        console.log("No members found for this company");

        // Update company last synced time even if no members
        await prisma.company.update({
          where: { id: company.id },
          data: {
            lastSyncedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          synced: 0,
          message: "No members found for this company",
        });
      }

      // Process each member
      for (const memberData of membersResponse.data) {
        try {
          // Get user data
          const user = memberData.user;

          if (!user) {
            console.log("Skipping member - no user data");
            continue;
          }

          // FILTER: Skip members that don't belong to this company
          if (memberData.company_id && memberData.company_id !== company.whopCompanyId) {
            console.log(`Skipping member ${user.username} - belongs to different company (${memberData.company_id})`);
            continue;
          }

          // FILTER: Skip test/agent accounts
          if (user.username && user.username.includes('-agent')) {
            console.log(`Skipping test account: ${user.username}`);
            continue;
          }

          // Debug logging
          console.log("Processing member:", {
            userId: user.id,
            username: user.username,
            email: user.email,
            status: memberData.status,
            accessLevel: memberData.access_level,
            totalSpent: memberData.total_usd_spent
          });

          // Determine member status
          let memberStatus = "inactive";
          if (memberData.status === "joined") {
            memberStatus = memberData.total_usd_spent > 0 ? "active" : "inactive";
          }

          // Create or update member
          const member = await prisma.member.upsert({
            where: { whopUserId: user.id },
            update: {
              email: user.email || "",
              username: user.username,
              profilePicUrl: user.profile_pic_url,
              status: memberStatus,
              lastSeenAt: new Date(),
              updatedAt: new Date(),
            },
            create: {
              whopUserId: user.id,
              email: user.email || "",
              username: user.username,
              profilePicUrl: user.profile_pic_url,
              companyId: company.id,
              status: memberStatus,
              currentPlan: null,
              planId: null,
              firstJoinedAt: new Date(),
            },
          });

          totalSynced++;
          console.log(`Successfully synced member: ${user.username || user.email}`);
        } catch (error) {
          console.error(`Error syncing member:`, error);
        }
      }

      // Now fetch memberships to update member plan details
      console.log("Fetching memberships to update plan details...");

      const membershipsResponse = await fetch(
        `https://api.whop.com/api/v5/app/memberships?company_id=${company.whopCompanyId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
          },
        }
      );

      if (membershipsResponse.ok) {
        const membershipsData = await membershipsResponse.json();
        console.log(`Fetched ${membershipsData.data?.length || 0} memberships`);

        for (const membership of membershipsData.data || []) {
          try {
            const user = membership.user;
            const plan = membership.plan;

            if (!user || !plan) continue;

            // Upsert member with plan details (in case they weren't in the members list)
            const member = await prisma.member.upsert({
              where: { whopUserId: user.id },
              update: {
                currentPlan: plan.name,
                planId: plan.id,
                status: membership.valid ? "active" : "inactive",
                email: user.email || "",
                username: user.username,
                profilePicUrl: user.profile_pic_url,
                updatedAt: new Date(),
              },
              create: {
                whopUserId: user.id,
                email: user.email || "",
                username: user.username,
                profilePicUrl: user.profile_pic_url,
                companyId: company.id,
                status: membership.valid ? "active" : "inactive",
                currentPlan: plan.name,
                planId: plan.id,
                firstJoinedAt: new Date(),
              },
            });

            // Create membership record
            await prisma.membership.upsert({
              where: { whopMembershipId: membership.id },
              update: {
                status: membership.valid ? "active" : "inactive",
                planName: plan.name || "",
                price: plan.initial_price || 0,
                renewsAt: membership.renewal_period_end ? new Date(membership.renewal_period_end * 1000) : null,
                cancelledAt: !membership.valid ? new Date() : null,
                updatedAt: new Date(),
              },
              create: {
                whopMembershipId: membership.id,
                memberId: member.id,
                planId: plan.id || "",
                planName: plan.name || "",
                status: membership.valid ? "active" : "inactive",
                price: plan.initial_price || 0,
                currency: "usd",
                interval: plan.renewal_period || "month",
                startedAt: new Date(),
                renewsAt: membership.renewal_period_end ? new Date(membership.renewal_period_end * 1000) : null,
              },
            });

            console.log(`Updated member ${user.username} with plan: ${plan.name}`);
          } catch (error) {
            console.error("Error updating membership:", error);
          }
        }
      }
    } catch (apiError) {
      console.error("API Error:", apiError);
      return NextResponse.json(
        { error: "Failed to fetch members from Whop API", details: String(apiError) },
        { status: 500 }
      );
    }

    // Update company last synced time
    await prisma.company.update({
      where: { id: company.id },
      data: {
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      synced: totalSynced,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync data" },
      { status: 500 }
    );
  }
}
