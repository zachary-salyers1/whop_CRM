import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Delete all members for this company
    // This will cascade delete related records (memberships, events, etc.)
    const deleteResult = await prisma.member.deleteMany({
      where: { companyId: company.id },
    });

    return NextResponse.json({
      success: true,
      deleted: deleteResult.count,
      message: `Deleted ${deleteResult.count} members. Run sync to re-import only your company's members.`,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup members" },
      { status: 500 }
    );
  }
}
