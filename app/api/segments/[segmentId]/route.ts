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

// PATCH - Update segment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ segmentId: string }> }
) {
  try {
    const { segmentId } = await params;
    const { name, description, filters, companyId } = await request.json();

    if (!name || !companyId || !filters) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify segment exists and belongs to company
    const existingSegment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!existingSegment || existingSegment.companyId !== companyId) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    // Build where clause from filters
    const whereClause = buildWhereClause(filters);

    // Count matching members
    const memberCount = await prisma.member.count({
      where: {
        companyId,
        ...whereClause,
      },
    });

    // Calculate total MRR
    const members = await prisma.member.findMany({
      where: {
        companyId,
        ...whereClause,
      },
      select: {
        monthlyRevenue: true,
      },
    });

    const totalMrr = members.reduce((sum, m) => sum + m.monthlyRevenue, 0);

    // Update segment
    const segment = await prisma.segment.update({
      where: { id: segmentId },
      data: {
        name,
        description: description || "",
        filters,
        memberCount,
        totalMrr,
      },
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Error updating segment:", error);
    return NextResponse.json(
      { error: "Failed to update segment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete segment
export async function DELETE(
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

    // Verify segment exists and belongs to company
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment || segment.companyId !== companyId) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    // Delete segment
    await prisma.segment.delete({
      where: { id: segmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting segment:", error);
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 }
    );
  }
}
