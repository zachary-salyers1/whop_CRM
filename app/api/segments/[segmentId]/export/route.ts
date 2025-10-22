import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Filter = {
  field: string;
  operator: string;
  value: string;
};

function buildWhereClause(filters: Filter[]) {
  const conditions: any[] = [];

  for (const filter of filters) {
    const { field, operator, value } = filter;

    if (field === "status") {
      conditions.push({ status: value });
    } else if (field === "totalRevenue") {
      const numValue = parseFloat(value);
      if (operator === "gte") conditions.push({ totalRevenue: { gte: numValue } });
      else if (operator === "lte") conditions.push({ totalRevenue: { lte: numValue } });
      else if (operator === "eq") conditions.push({ totalRevenue: numValue });
    } else if (field === "monthlyRevenue") {
      const numValue = parseFloat(value);
      if (operator === "gte") conditions.push({ monthlyRevenue: { gte: numValue } });
      else if (operator === "lte") conditions.push({ monthlyRevenue: { lte: numValue } });
      else if (operator === "eq") conditions.push({ monthlyRevenue: numValue });
    } else if (field === "engagementScore") {
      const numValue = parseInt(value);
      if (operator === "gte") conditions.push({ engagementScore: { gte: numValue } });
      else if (operator === "lte") conditions.push({ engagementScore: { lte: numValue } });
      else if (operator === "eq") conditions.push({ engagementScore: numValue });
    } else if (field === "currentPlan") {
      if (operator === "equals") {
        conditions.push({ currentPlan: value });
      } else if (operator === "contains") {
        conditions.push({ currentPlan: { contains: value, mode: "insensitive" } });
      }
    }
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

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
  { params }: { params: Promise<{ segmentId: string }> }
) {
  try {
    const { segmentId } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing companyId" },
        { status: 400 }
      );
    }

    // Get segment
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment || segment.companyId !== companyId) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const filters = segment.filters as Filter[];
    const whereClause = buildWhereClause(filters);

    // Get members with tags
    const members = await prisma.member.findMany({
      where: {
        companyId,
        ...whereClause,
      },
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

    // Create filename with segment name and date
    const date = new Date().toISOString().split("T")[0];
    const filename = `${segment.name.replace(/[^a-z0-9]/gi, "_")}_${date}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting segment:", error);
    return NextResponse.json(
      { error: "Failed to export segment" },
      { status: 500 }
    );
  }
}
