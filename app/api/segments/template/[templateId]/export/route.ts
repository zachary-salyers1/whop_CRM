import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TEMPLATES: Record<
  string,
  { name: string; filter: any }
> = {
  active: {
    name: "Active Members",
    filter: { status: "active" },
  },
  "at-risk": {
    name: "At Risk",
    filter: { status: "past_due" },
  },
  "high-value": {
    name: "High Value",
    filter: { totalRevenue: { gte: 200 }, status: "active" },
  },
  churned: {
    name: "Churned",
    filter: { status: "cancelled" },
  },
  new: {
    name: "New Members",
    filter: {},
  },
};

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing companyId" },
        { status: 400 }
      );
    }

    const template = TEMPLATES[templateId];
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Get company
    const company = await prisma.company.findUnique({
      where: { whopCompanyId: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Handle "new" template with date filter
    let whereClause: any = { companyId: company.id, ...template.filter };
    if (templateId === "new") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.firstJoinedAt = { gte: thirtyDaysAgo };
    }

    // Get members with tags
    const members = await prisma.member.findMany({
      where: whereClause,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = [
      "Email",
      "Username",
      "Status",
      "Current Plan",
      "Total Revenue",
      "Monthly Revenue",
      "Engagement Score",
      "Join Date",
      "Last Active",
      "Tags",
    ];

    const csvRows = [headers.join(",")];

    for (const member of members) {
      const tags = member.tags.map((mt) => mt.tag.name).join("; ");
      const row = [
        escapeCSV(member.email),
        escapeCSV(member.username),
        escapeCSV(member.status),
        escapeCSV(member.currentPlan),
        escapeCSV(member.totalRevenue.toFixed(2)),
        escapeCSV(member.monthlyRevenue.toFixed(2)),
        escapeCSV(member.engagementScore),
        escapeCSV(member.firstJoinedAt.toISOString().split("T")[0]),
        escapeCSV(member.lastSeenAt?.toISOString().split("T")[0] || ""),
        escapeCSV(tags),
      ];
      csvRows.push(row.join(","));
    }

    const csv = csvRows.join("\n");

    // Create filename with template name and date
    const date = new Date().toISOString().split("T")[0];
    const filename = `${template.name.replace(/[^a-z0-9]/gi, "_")}_${date}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting template segment:", error);
    return NextResponse.json(
      { error: "Failed to export segment" },
      { status: 500 }
    );
  }
}
