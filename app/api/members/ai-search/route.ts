import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, companyId } = await request.json();

    if (!query || !companyId) {
      return NextResponse.json(
        { error: "Query and companyId are required" },
        { status: 400 }
      );
    }

    // Use GPT to convert natural language to filter criteria
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a CRM query assistant. Convert natural language queries into structured filter criteria.

Available filters:
- status: "active", "cancelled", "past_due", "trialing"
- churnRisk: number 0-100 (higher = more risk)
- engagementScore: number 0-100 (higher = more engaged)
- totalRevenue: number (in dollars)
- monthlyRevenue: number (in dollars)
- tags: array of tag names
- daysSinceJoined: number
- hasNotes: boolean

Time references:
- "last 30 days" / "past month" = daysSinceJoined <= 30
- "last 60 days" = daysSinceJoined <= 60
- "last 90 days" = daysSinceJoined <= 90
- "new members" = daysSinceJoined <= 30

Engagement references:
- "highly engaged" / "active" = engagementScore >= 70
- "moderately engaged" = engagementScore >= 40 AND engagementScore < 70
- "low engagement" / "inactive" = engagementScore < 40

Churn risk references:
- "at risk" / "high churn risk" = churnRisk >= 70
- "medium churn risk" = churnRisk >= 40 AND churnRisk < 70
- "low churn risk" / "stable" = churnRisk < 40

Revenue references:
- "high value" / "big spenders" = totalRevenue >= 500
- "low value" = totalRevenue < 100

Return ONLY a JSON object with the filters. Example:
{"status": "active", "churnRisk": {"gte": 70}, "engagementScore": {"lt": 40}}

For range queries, use: {"gte": X} for >=, {"lte": X} for <=, {"gt": X} for >, {"lt": X} for <`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const filtersText = completion.choices[0].message.content;
    if (!filtersText) {
      return NextResponse.json(
        { error: "Failed to parse query" },
        { status: 500 }
      );
    }

    const filters = JSON.parse(filtersText);

    return NextResponse.json({
      filters,
      interpretation: `Searching for members matching: ${query}`,
    });
  } catch (error: any) {
    console.error("AI Search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process search query" },
      { status: 500 }
    );
  }
}
