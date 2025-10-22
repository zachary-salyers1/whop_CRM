import { prisma } from "./prisma";

type Member = {
  id: string;
  status: string;
  totalRevenue: number;
  monthlyRevenue: number;
  engagementScore: number;
  churnRisk: string;
  lastSeenAt: Date | null;
  firstJoinedAt: Date;
  cancelledAt: Date | null;
};

type MemberWithRelations = Member & {
  events: Array<{ type: string; occurredAt: Date }>;
  memberships: Array<{ status: string; createdAt: Date }>;
  notes: Array<{ createdAt: Date }>;
};

/**
 * Calculate churn risk based on multiple factors
 * Returns: "low", "medium", or "high"
 */
export function calculateChurnRisk(member: MemberWithRelations): string {
  let riskScore = 0;

  // Factor 1: Days since last activity
  if (member.lastSeenAt) {
    const daysSinceActive = Math.floor(
      (Date.now() - member.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActive > 30) riskScore += 30;
    else if (daysSinceActive > 14) riskScore += 20;
    else if (daysSinceActive > 7) riskScore += 10;
  } else {
    riskScore += 25; // Never seen = moderate risk
  }

  // Factor 2: Payment status
  if (member.status === "past_due") riskScore += 40;
  else if (member.status === "cancelled") riskScore += 100;

  // Factor 3: Engagement score
  if (member.engagementScore < 20) riskScore += 30;
  else if (member.engagementScore < 40) riskScore += 20;
  else if (member.engagementScore < 60) riskScore += 10;

  // Factor 4: Event activity (recent 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentEvents = member.events.filter(
    (e) => e.occurredAt >= thirtyDaysAgo
  );

  if (recentEvents.length === 0) riskScore += 20;
  else if (recentEvents.length < 3) riskScore += 10;

  // Factor 5: Account age (very new members have higher churn)
  const accountAgeDays = Math.floor(
    (Date.now() - member.firstJoinedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (accountAgeDays < 7) riskScore += 15;
  else if (accountAgeDays < 30) riskScore += 10;

  // Factor 6: Revenue (lower revenue = higher risk)
  if (member.totalRevenue === 0) riskScore += 25;
  else if (member.totalRevenue < 50) riskScore += 15;

  // Calculate final risk level
  if (riskScore >= 70) return "high";
  if (riskScore >= 40) return "medium";
  return "low";
}

/**
 * Calculate engagement score (0-100)
 * Based on activity, recency, and frequency
 */
export function calculateEngagementScore(member: MemberWithRelations): number {
  let score = 0;

  // Factor 1: Recent activity (40 points max)
  if (member.lastSeenAt) {
    const daysSinceActive = Math.floor(
      (Date.now() - member.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActive <= 1) score += 40;
    else if (daysSinceActive <= 3) score += 30;
    else if (daysSinceActive <= 7) score += 20;
    else if (daysSinceActive <= 14) score += 10;
    else if (daysSinceActive <= 30) score += 5;
  }

  // Factor 2: Event frequency last 30 days (30 points max)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentEvents = member.events.filter(
    (e) => e.occurredAt >= thirtyDaysAgo
  );

  if (recentEvents.length >= 20) score += 30;
  else if (recentEvents.length >= 10) score += 20;
  else if (recentEvents.length >= 5) score += 10;
  else if (recentEvents.length >= 1) score += 5;

  // Factor 3: Payment history (15 points max)
  if (member.status === "active") score += 15;
  else if (member.status === "past_due") score += 5;

  // Factor 4: Notes/interactions (10 points max)
  if (member.notes.length >= 5) score += 10;
  else if (member.notes.length >= 3) score += 7;
  else if (member.notes.length >= 1) score += 5;

  // Factor 5: Account longevity (5 points max)
  const accountAgeDays = Math.floor(
    (Date.now() - member.firstJoinedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (accountAgeDays >= 90) score += 5;
  else if (accountAgeDays >= 30) score += 3;
  else if (accountAgeDays >= 7) score += 1;

  return Math.min(100, Math.max(0, score));
}

/**
 * Generate AI-powered recommendations for a member
 */
export function generateRecommendations(
  member: MemberWithRelations
): Array<{ type: string; priority: string; message: string; action?: string }> {
  const recommendations = [];

  // Churn risk recommendations
  if (member.churnRisk === "high") {
    recommendations.push({
      type: "retention",
      priority: "high",
      message: "High churn risk detected. Consider reaching out personally.",
      action: "Send personalized message or offer",
    });
  }

  // Inactive member
  if (member.lastSeenAt) {
    const daysSinceActive = Math.floor(
      (Date.now() - member.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActive > 30) {
      recommendations.push({
        type: "engagement",
        priority: "high",
        message: `Member hasn't been active in ${daysSinceActive} days`,
        action: "Send re-engagement campaign",
      });
    }
  }

  // Past due payment
  if (member.status === "past_due") {
    recommendations.push({
      type: "payment",
      priority: "high",
      message: "Payment is past due. Risk of involuntary churn.",
      action: "Send payment reminder",
    });
  }

  // Low engagement
  if (member.engagementScore < 30) {
    recommendations.push({
      type: "engagement",
      priority: "medium",
      message: "Low engagement score. Member may not be getting value.",
      action: "Send onboarding resources or check-in",
    });
  }

  // Upsell opportunity (high engagement + active)
  if (member.engagementScore > 70 && member.status === "active") {
    if (member.totalRevenue < 200) {
      recommendations.push({
        type: "upsell",
        priority: "medium",
        message: "High engagement member. Good candidate for upsell.",
        action: "Offer premium plan or add-ons",
      });
    }
  }

  // New member onboarding
  const accountAgeDays = Math.floor(
    (Date.now() - member.firstJoinedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (accountAgeDays <= 7 && member.engagementScore < 40) {
    recommendations.push({
      type: "onboarding",
      priority: "high",
      message: "New member with low engagement. Critical onboarding period.",
      action: "Send welcome series and onboarding guide",
    });
  }

  // No recent notes (neglected member)
  if (member.notes.length === 0 && accountAgeDays > 30) {
    recommendations.push({
      type: "relationship",
      priority: "low",
      message: "No notes on file. Consider adding interaction history.",
      action: "Document relationship and touchpoints",
    });
  }

  // VIP identification
  if (member.totalRevenue > 500 && member.status === "active") {
    recommendations.push({
      type: "vip",
      priority: "high",
      message: "High-value member. Ensure excellent service.",
      action: "Add VIP tag and prioritize support",
    });
  }

  return recommendations;
}

/**
 * Calculate predicted LTV (Lifetime Value)
 */
export function predictLifetimeValue(member: MemberWithRelations): number {
  // Simple LTV formula: MRR × Average customer lifespan estimate
  const monthlyValue = member.monthlyRevenue;

  // Estimate lifespan based on engagement and churn risk
  let estimatedMonths = 12; // default 1 year

  if (member.churnRisk === "low" && member.engagementScore > 70) {
    estimatedMonths = 24; // 2 years for great members
  } else if (member.churnRisk === "high" || member.engagementScore < 30) {
    estimatedMonths = 3; // 3 months for at-risk members
  } else if (member.churnRisk === "medium") {
    estimatedMonths = 6; // 6 months for medium risk
  }

  return monthlyValue * estimatedMonths;
}

/**
 * Update AI scores for a single member
 */
export async function updateMemberInsights(memberId: string) {
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
    throw new Error("Member not found");
  }

  const churnRisk = calculateChurnRisk(member);
  const engagementScore = calculateEngagementScore(member);
  const lifetimeValue = predictLifetimeValue(member);

  await prisma.member.update({
    where: { id: memberId },
    data: {
      churnRisk,
      engagementScore,
      lifetimeValue,
    },
  });

  return { churnRisk, engagementScore, lifetimeValue };
}

/**
 * Batch update AI scores for all members in a company
 */
export async function updateAllMemberInsights(companyId: string) {
  const members = await prisma.member.findMany({
    where: { companyId },
    include: {
      events: {
        orderBy: { occurredAt: "desc" },
        take: 100,
      },
      memberships: true,
      notes: true,
    },
  });

  let updated = 0;

  for (const member of members) {
    try {
      const churnRisk = calculateChurnRisk(member);
      const engagementScore = calculateEngagementScore(member);
      const lifetimeValue = predictLifetimeValue(member);

      await prisma.member.update({
        where: { id: member.id },
        data: {
          churnRisk,
          engagementScore,
          lifetimeValue,
        },
      });

      updated++;
    } catch (error) {
      console.error(`Error updating insights for member ${member.id}:`, error);
    }
  }

  return { updated, total: members.length };
}
