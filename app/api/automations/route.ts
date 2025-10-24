import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAccess } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, description, companyId, trigger, actions } =
      await request.json();

    if (!name || !companyId || !trigger || !actions) {
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

    // Create automation
    const automation = await prisma.automation.create({
      data: {
        name,
        description: description || "",
        companyId: validatedCompany.id,
        trigger,
        actions,
        isActive: true,
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Error creating automation:", error);
    return NextResponse.json(
      { error: "Failed to create automation" },
      { status: 500 }
    );
  }
}
