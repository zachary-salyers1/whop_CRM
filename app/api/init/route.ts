import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Initialize company in database
 * For Whop apps, authentication is handled by Whop platform
 * This endpoint just creates the company record
 */
export async function POST(request: NextRequest) {
  try {
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not configured" },
        { status: 400 }
      );
    }

    // Create or update company in database
    // We'll fetch the actual company details via API later
    const company = await prisma.company.upsert({
      where: { whopCompanyId: companyId },
      update: {
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        whopCompanyId: companyId,
        name: "My Whop Business", // Default name, will be updated on first sync
        isActive: true,
      },
    });

    // Redirect back to dashboard
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      new URL(`/dashboard/${companyId}`, baseUrl)
    );
  } catch (error) {
    console.error("Initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize company" },
      { status: 500 }
    );
  }
}
