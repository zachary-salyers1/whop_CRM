import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return NextResponse.json(
        { error: "No authorization code provided" },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.whop.com/api/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: process.env.WHOP_CLIENT_ID,
        client_secret: process.env.WHOP_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", errorData);
      return NextResponse.json(
        { error: "Failed to exchange authorization code" },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get company info from Whop
    const companyResponse = await fetch("https://api.whop.com/api/v5/me/company", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!companyResponse.ok) {
      console.error("Failed to fetch company info");
      return NextResponse.json(
        { error: "Failed to fetch company information" },
        { status: 500 }
      );
    }

    const companyData = await companyResponse.json();

    // Store or update company in database
    const company = await prisma.company.upsert({
      where: { whopCompanyId: companyData.id },
      update: {
        name: companyData.name || "Unknown Company",
        email: companyData.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        whopCompanyId: companyData.id,
        name: companyData.name || "Unknown Company",
        email: companyData.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        isActive: true,
      },
    });

    // Redirect to dashboard with company ID
    return NextResponse.redirect(new URL(`/dashboard/${companyData.id}`, request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
