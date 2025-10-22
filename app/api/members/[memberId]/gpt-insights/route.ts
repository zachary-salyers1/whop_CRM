import { NextRequest, NextResponse } from "next/server";
import { analyzeWithGPT, getMemberForGPTAnalysis } from "@/lib/openaiService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const member = await getMemberForGPTAnalysis(memberId);

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Analyze with GPT-4o
    const insights = await analyzeWithGPT(member);

    return NextResponse.json({
      success: true,
      source: "gpt-4o",
      insights,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error analyzing with GPT:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze member",
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST endpoint to force re-analysis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { updateScores } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const member = await getMemberForGPTAnalysis(memberId);

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    const insights = await analyzeWithGPT(member);

    // Optionally update the member's scores with GPT results
    if (updateScores) {
      const { storeGPTInsights } = await import("@/lib/openaiService");
      await storeGPTInsights(memberId, insights);
    }

    return NextResponse.json({
      success: true,
      source: "gpt-4o",
      insights,
      scoresUpdated: updateScores,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error analyzing with GPT:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze member",
        details: error.message
      },
      { status: 500 }
    );
  }
}
