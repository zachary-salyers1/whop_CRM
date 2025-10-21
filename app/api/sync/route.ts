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

    let page = 1;
    let hasMore = true;
    let totalSynced = 0;

    while (hasMore) {
      // Fetch directly from API using the configured API key
      const response = await fetch(
        `https://api.whop.com/api/v5/memberships?page=${page}&per=100`,
        {
          headers: {
            Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch memberships from Whop:", await response.text());
        break;
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        hasMore = false;
        break;
      }

      // Process each membership
      for (const membership of data.data) {
        try {
          // Get user data
          const user = membership.user;
          const plan = membership.plan;

          if (!user) continue;

          // Create or update member
          const member = await prisma.member.upsert({
            where: { whopUserId: user.id },
            update: {
              email: user.email || "",
              username: user.username,
              profilePicUrl: user.profile_pic_url,
              status: membership.status || "inactive",
              currentPlan: plan?.name,
              planId: plan?.id,
              lastSeenAt: new Date(),
              updatedAt: new Date(),
            },
            create: {
              whopUserId: user.id,
              email: user.email || "",
              username: user.username,
              profilePicUrl: user.profile_pic_url,
              companyId: company.id,
              status: membership.status || "inactive",
              currentPlan: plan?.name,
              planId: plan?.id,
              firstJoinedAt: membership.created_at ? new Date(membership.created_at) : new Date(),
            },
          });

          // Create membership record
          await prisma.membership.upsert({
            where: { whopMembershipId: membership.id },
            update: {
              status: membership.status || "inactive",
              planName: plan?.name || "",
              price: membership.amount || 0,
              renewsAt: membership.renewal_period_end ? new Date(membership.renewal_period_end) : null,
              cancelledAt: membership.cancel_at_period_end ? new Date() : null,
              updatedAt: new Date(),
            },
            create: {
              whopMembershipId: membership.id,
              memberId: member.id,
              planId: plan?.id || "",
              planName: plan?.name || "",
              status: membership.status || "inactive",
              price: membership.amount || 0,
              currency: "usd",
              interval: plan?.renewal_period || "month",
              startedAt: membership.created_at ? new Date(membership.created_at) : new Date(),
              renewsAt: membership.renewal_period_end ? new Date(membership.renewal_period_end) : null,
            },
          });

          totalSynced++;
        } catch (error) {
          console.error(`Error syncing membership ${membership.id}:`, error);
        }
      }

      page++;

      // Safety check - don't loop forever
      if (page > 100) {
        hasMore = false;
      }
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
