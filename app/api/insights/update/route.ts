import { NextRequest, NextResponse } from "next/server";
import { updateAllMemberInsights } from "@/lib/aiInsights";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing companyId" },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Update all member insights
    const result = await updateAllMemberInsights(companyId);

    return NextResponse.json({
      success: true,
      updated: result.updated,
      total: result.total,
    });
  } catch (error) {
    console.error("Error updating insights:", error);
    return NextResponse.json(
      { error: "Failed to update insights" },
      { status: 500 }
    );
  }
}
