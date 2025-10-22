import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Create automation
    const automation = await prisma.automation.create({
      data: {
        name,
        description: description || "",
        companyId,
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
