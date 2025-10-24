import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAccess } from "@/lib/auth";

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

export async function POST(request: NextRequest) {
  try {
    const { name, description, companyId, filters } = await request.json();

    if (!name || !companyId || !filters) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate company access
    let validatedCompany;
    try {
      validatedCompany = await validateCompanyAccess(companyId, true);
    } catch (error: any) {
      console.error("Company validation error:", error.message);
      return NextResponse.json(
        { error: "Access denied: Invalid company ID" },
        { status: 403 }
      );
    }

    // Use validated company ID for database operations
    const companyDbId = validatedCompany.id;

    // Build where clause from filters
    const whereClause = buildWhereClause(filters);

    // Count matching members
    const memberCount = await prisma.member.count({
      where: {
        companyId: companyDbId,
        ...whereClause,
      },
    });

    // Calculate total MRR for matching members
    const members = await prisma.member.findMany({
      where: {
        companyId: companyDbId,
        ...whereClause,
      },
      select: {
        monthlyRevenue: true,
      },
    });

    const totalMrr = members.reduce((sum, m) => sum + m.monthlyRevenue, 0);

    // Create segment
    const segment = await prisma.segment.create({
      data: {
        name,
        description: description || "",
        companyId: companyDbId,
        filters: filters,
        memberCount,
        totalMrr,
      },
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Error creating segment:", error);
    return NextResponse.json(
      { error: "Failed to create segment" },
      { status: 500 }
    );
  }
}
