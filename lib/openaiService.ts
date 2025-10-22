import OpenAI from "openai";
import { prisma } from "./prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Member = {
  id: string;
  email: string;
  username: string | null;
  status: string;
  totalRevenue: number;
  monthlyRevenue: number;
  engagementScore: number;
  churnRisk: string;
  lastSeenAt: Date | null;
  firstJoinedAt: Date;
  cancelledAt: Date | null;
  currentPlan: string | null;
};

type MemberWithRelations = Member & {
  events: Array<{ type: string; occurredAt: Date }>;
  memberships: Array<{ status: string; createdAt: Date; price: number }>;
  notes: Array<{ content: string; createdAt: Date }>;
};

type GPTInsights = {
  churnRiskAssessment: {
    level: "low" | "medium" | "high";
    confidence: number;
    reasoning: string;
    keyFactors: string[];
  };
  engagementAnalysis: {
    score: number;
    trend: "improving" | "stable" | "declining";
    breakdown: {
      activity: number;
      monetization: number;
      loyalty: number;
    };
  };
  recommendations: Array<{
    priority: "critical" | "high" | "medium" | "low";
    category: string;
    action: string;
    expectedImpact: string;
    timeline: string;
  }>;
  lifetimeValue: {
    predicted: number;
    confidence: number;
    reasoning: string;
  };
  keyInsights: string[];
};

/**
 * Analyze a member using GPT-4o
 */
export async function analyzeWithGPT(
  member: MemberWithRelations
): Promise<GPTInsights> {
  // Prepare member data for analysis
  const daysSinceActive = member.lastSeenAt
    ? Math.floor(
        (Date.now() - member.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const accountAgeDays = Math.floor(
    (Date.now() - member.firstJoinedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEvents = member.events.filter(
    (e) => e.occurredAt >= thirtyDaysAgo
  );

  // Group events by type
  const eventSummary = recentEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate revenue metrics
  const avgMonthlyRevenue = member.monthlyRevenue;
  const revenuePerDay = accountAgeDays > 0 ? member.totalRevenue / accountAgeDays : 0;

  const prompt = `You are an expert customer success analyst for a SaaS business. Analyze this member's data and provide actionable insights.

## Member Profile
- Email: ${member.email}
- Username: ${member.username || "Not set"}
- Current Status: ${member.status}
- Current Plan: ${member.currentPlan || "Unknown"}

## Financial Metrics
- Total Lifetime Revenue: $${member.totalRevenue.toFixed(2)}
- Monthly Recurring Revenue: $${member.monthlyRevenue.toFixed(2)}
- Average Revenue per Day: $${revenuePerDay.toFixed(2)}

## Engagement Metrics
- Account Age: ${accountAgeDays} days
- Days Since Last Active: ${daysSinceActive !== null ? daysSinceActive + " days" : "Never seen"}
- Current Engagement Score: ${member.engagementScore}/100 (algorithmic)
- Current Churn Risk: ${member.churnRisk} (algorithmic)

## Activity (Last 30 Days)
- Total Events: ${recentEvents.length}
- Event Breakdown: ${JSON.stringify(eventSummary, null, 2)}

## Historical Data
- Total Memberships: ${member.memberships.length}
- Total Notes/Interactions: ${member.notes.length}
- Join Date: ${member.firstJoinedAt.toISOString().split("T")[0]}
${member.cancelledAt ? `- Cancelled Date: ${member.cancelledAt.toISOString().split("T")[0]}` : ""}

## Recent Notes (Last 3)
${member.notes.slice(0, 3).map((n, i) => `${i + 1}. ${n.content.substring(0, 100)}...`).join("\n") || "No notes"}

---

Based on this data, provide a comprehensive analysis in the following JSON format:

{
  "churnRiskAssessment": {
    "level": "low" | "medium" | "high",
    "confidence": 0-100,
    "reasoning": "Brief explanation of why this risk level",
    "keyFactors": ["factor1", "factor2", "factor3"]
  },
  "engagementAnalysis": {
    "score": 0-100,
    "trend": "improving" | "stable" | "declining",
    "breakdown": {
      "activity": 0-100,
      "monetization": 0-100,
      "loyalty": 0-100
    }
  },
  "recommendations": [
    {
      "priority": "critical" | "high" | "medium" | "low",
      "category": "retention" | "engagement" | "monetization" | "support",
      "action": "Specific action to take",
      "expectedImpact": "What this will achieve",
      "timeline": "When to do this"
    }
  ],
  "lifetimeValue": {
    "predicted": estimated_ltv_in_dollars,
    "confidence": 0-100,
    "reasoning": "Why this LTV prediction"
  },
  "keyInsights": [
    "Notable insight 1",
    "Notable insight 2",
    "Notable insight 3"
  ]
}

Provide 3-5 specific, actionable recommendations. Be direct and data-driven. Focus on what actions would have the highest impact.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert SaaS customer success analyst. Provide detailed, actionable insights based on customer data. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const insights: GPTInsights = JSON.parse(content);
    return insights;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

/**
 * Get member with full relations for GPT analysis
 */
export async function getMemberForGPTAnalysis(memberId: string) {
  return await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      events: {
        orderBy: { occurredAt: "desc" },
        take: 100,
      },
      memberships: {
        orderBy: { createdAt: "desc" },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

/**
 * Store GPT insights in database (optional - for caching)
 */
export async function storeGPTInsights(memberId: string, insights: GPTInsights) {
  // You could store this in a separate table or as JSON in the member record
  // For now, we'll just update the member with the GPT scores
  await prisma.member.update({
    where: { id: memberId },
    data: {
      // Store GPT's assessment alongside algorithmic scores
      churnRisk: insights.churnRiskAssessment.level,
      engagementScore: insights.engagementAnalysis.score,
      lifetimeValue: insights.lifetimeValue.predicted,
    },
  });
}
