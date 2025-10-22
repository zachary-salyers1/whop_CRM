import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const { automationId } = await params;
    const { companyId, isActive } = await request.json();

    // Verify automation exists and belongs to company
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
    });

    if (!automation || automation.companyId !== companyId) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }

    // Update automation
    const updated = await prisma.automation.update({
      where: { id: automationId },
      data: { isActive },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error toggling automation:", error);
    return NextResponse.json(
      { error: "Failed to update automation" },
      { status: 500 }
    );
  }
}
