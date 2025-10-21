import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("company_id");

  // Build OAuth authorization URL
  const authUrl = new URL("https://whop.com/oauth");
  authUrl.searchParams.set("client_id", process.env.WHOP_CLIENT_ID || "");
  authUrl.searchParams.set(
    "redirect_uri",
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "memberships:read users:read payments:read");

  if (companyId) {
    authUrl.searchParams.set("state", companyId);
  }

  return NextResponse.redirect(authUrl.toString());
}
