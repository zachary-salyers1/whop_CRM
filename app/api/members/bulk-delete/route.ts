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

    // Verify members belong to this company before deleting
    const members = await prisma.member.findMany({
      where: {
        id: { in: memberIds },
        company: { whopCompanyId: companyId },
      },
    });

    if (members.length !== memberIds.length) {
      return NextResponse.json(
        { error: "Some members not found or don't belong to this company" },
        { status: 403 }
      );
    }

    // Delete members (cascade will handle related records)
    const result = await prisma.member.deleteMany({
      where: {
        id: { in: memberIds },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete members" },
      { status: 500 }
    );
  }
}
