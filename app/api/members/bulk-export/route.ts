import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { memberIds, companyId } = await request.json();

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: "No members selected" },
        { status: 400 }
      );
    }

    // Fetch members with their data
    const members = await prisma.member.findMany({
      where: {
        id: { in: memberIds },
        company: { whopCompanyId: companyId },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        memberships: true,
      },
    });

    // Convert to CSV
    const csvHeaders = [
      "Email",
      "Username",
      "Status",
      "Current Plan",
      "Total Revenue",
      "Monthly Revenue",
      "Engagement Score",
      "Churn Risk",
      "First Joined",
      "Cancelled At",
      "Tags",
    ];

    const csvRows = members.map((member) => [
      member.email || "",
      member.username || "",
      member.status,
      member.currentPlan || "No plan",
      member.totalRevenue.toFixed(2),
      member.monthlyRevenue.toFixed(2),
      member.engagementScore || 0,
      member.churnRisk || 0,
      member.firstJoinedAt?.toISOString().split("T")[0] || "",
      member.cancelledAt?.toISOString().split("T")[0] || "",
      member.tags.map((t) => t.tag.name).join("; "),
    ]);

    const csv = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="members-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Bulk export error:", error);
    return NextResponse.json(
      { error: "Failed to export members" },
      { status: 500 }
    );
  }
}
