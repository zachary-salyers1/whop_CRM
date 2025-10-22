import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRecommendations } from "@/lib/aiInsights";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        events: {
          orderBy: { occurredAt: "desc" },
          take: 100,
        },
        memberships: true,
        notes: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    const recommendations = generateRecommendations(member);

    return NextResponse.json({
      churnRisk: member.churnRisk,
      engagementScore: member.engagementScore,
      lifetimeValue: member.lifetimeValue,
      recommendations,
    });
  } catch (error) {
    console.error("Error fetching member insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}
