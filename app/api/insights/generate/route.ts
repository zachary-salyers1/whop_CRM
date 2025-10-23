import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { whopCompanyId: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Gather analytics data
    const members = await prisma.member.findMany({
      where: { companyId: company.id },
      include: {
        memberships: true,
        tags: { include: { tag: true } },
      },
    });

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === "active").length;
    const cancelledMembers = members.filter((m) => m.status === "cancelled").length;
    const highChurnRiskMembers = members.filter((m) => m.churnRisk === "high").length;
    const lowEngagementMembers = members.filter((m) => m.engagementScore && m.engagementScore < 40).length;

    const totalRevenue = members.reduce((sum, m) => sum + m.totalRevenue, 0);
    const avgRevenue = totalMembers > 0 ? totalRevenue / totalMembers : 0;

    // New members in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newMembers = members.filter(
      (m) => m.firstJoinedAt && new Date(m.firstJoinedAt) >= thirtyDaysAgo
    ).length;

    // Churn rate (last 30 days)
    const recentCancellations = members.filter(
      (m) => m.cancelledAt && new Date(m.cancelledAt) >= thirtyDaysAgo
    ).length;
    const churnRate =
      activeMembers + recentCancellations > 0
        ? (recentCancellations / (activeMembers + recentCancellations)) * 100
        : 0;

    const analyticsData = {
      totalMembers,
      activeMembers,
      cancelledMembers,
      highChurnRiskMembers,
      lowEngagementMembers,
      newMembers,
      churnRate: churnRate.toFixed(1),
      totalRevenue: totalRevenue.toFixed(2),
      avgRevenue: avgRevenue.toFixed(2),
    };

    // Use GPT to generate insights
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a CRM analytics expert. Analyze the provided membership data and generate 3-5 actionable insights for the dashboard.

Each insight should:
- Be concise and actionable
- Include a specific metric/number
- Have a priority level (critical, high, medium, low)
- Have a category (churn, revenue, engagement, growth)
- Optionally suggest an action URL (segment filter query)

Return JSON array of insights with this structure:
[
  {
    "title": "Short title",
    "description": "1-2 sentence description with specific metrics",
    "priority": "critical|high|medium|low",
    "category": "churn|revenue|engagement|growth",
    "metric": "23 members" or "15% increase",
    "actionable": true|false,
    "actionUrl": "/dashboard/COMPANY_ID/members?filters=..." (optional)
  }
]

Focus on the most impactful insights. Prioritize urgent issues (high churn, revenue drops) over positive trends.`,
        },
        {
          role: "user",
          content: `Analyze this CRM data and generate insights:

${JSON.stringify(analyticsData, null, 2)}

Generate 3-5 insights focusing on the most important findings.`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      return NextResponse.json(
        { error: "Failed to generate insights" },
        { status: 500 }
      );
    }

    console.log("GPT Response:", responseText);

    const response = JSON.parse(responseText);

    // Handle both array and object responses
    let insights = [];
    if (Array.isArray(response)) {
      insights = response;
    } else if (response.insights && Array.isArray(response.insights)) {
      insights = response.insights;
    } else {
      console.error("Unexpected response format:", response);
      return NextResponse.json(
        { error: "Invalid response format from GPT", debug: response },
        { status: 500 }
      );
    }

    if (insights.length === 0) {
      console.log("No insights generated");
      return NextResponse.json({
        success: true,
        insights: [],
        count: 0,
        message: "No insights to display",
      });
    }

    // Delete old insights for this company
    await prisma.dashboardInsight.deleteMany({
      where: { companyId: company.id },
    });

    // Store new insights
    const createdInsights = await Promise.all(
      insights.map((insight: any) => {
        console.log("Creating insight:", insight);
        return prisma.dashboardInsight.create({
          data: {
            companyId: company.id,
            title: insight.title || "Untitled Insight",
            description: insight.description || "",
            priority: insight.priority || "medium",
            category: insight.category || "general",
            metric: insight.metric || null,
            actionable: insight.actionable || false,
            actionUrl: insight.actionUrl?.replace("COMPANY_ID", companyId) || null,
            isActive: true,
          },
        });
      })
    );

    console.log(`Created ${createdInsights.length} insights`);

    return NextResponse.json({
      success: true,
      insights: createdInsights,
      count: createdInsights.length,
    });
  } catch (error: any) {
    console.error("Generate insights error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}
