import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAccess } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { memberIds, companyId } = await request.json();

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: "No members selected" },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
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

    // Verify members belong to this company before deleting
    const members = await prisma.member.findMany({
      where: {
        id: { in: memberIds },
        companyId: validatedCompany.id,
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
