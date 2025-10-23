"use client";

import { useEffect, useState } from "react";

type Recommendation = {
  type: string;
  priority: string;
  message: string;
  action?: string;
};

type Insights = {
  churnRisk: string;
  engagementScore: number;
  lifetimeValue: number;
  recommendations: Recommendation[];
};

export default function AIInsights({ memberId }: { memberId: string }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, [memberId]);

  const fetchInsights = async () => {
    try {
      const response = await fetch(`/api/members/${memberId}/insights`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-zinc-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const getChurnRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-400 bg-red-950/50 border-red-800";
      case "medium":
        return "text-yellow-400 bg-yellow-950/50 border-yellow-800";
      case "low":
        return "text-green-400 bg-green-950/50 border-green-800";
      default:
        return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  const getEngagementColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-950/50 border-red-800";
      case "medium":
        return "text-yellow-400 bg-yellow-950/50 border-yellow-800";
      case "low":
        return "text-primary-400 bg-primary-950/50 border-primary-800";
      default:
        return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Scores */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-purple-400">✨</span>
          AI Insights
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-zinc-400 mb-2">Churn Risk</div>
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getChurnRiskColor(
                insights.churnRisk
              )}`}
            >
              {insights.churnRisk.toUpperCase()}
            </span>
          </div>

          <div>
            <div className="text-sm text-zinc-400 mb-2">Engagement Score</div>
            <div className={`text-2xl font-bold ${getEngagementColor(insights.engagementScore)}`}>
              {insights.engagementScore}
              <span className="text-sm text-zinc-400">/100</span>
            </div>
          </div>

          <div>
            <div className="text-sm text-zinc-400 mb-2">Predicted LTV</div>
            <div className="text-2xl font-bold text-white">
              ${insights.lifetimeValue.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-primary-400">💡</span>
            Recommended Actions
          </h3>

          <div className="space-y-3">
            {insights.recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(
                        rec.priority
                      )}`}
                    >
                      {rec.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase">{rec.type}</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-300 mb-2">{rec.message}</p>
                {rec.action && (
                  <p className="text-sm text-primary-400">
                    → <span className="font-medium">{rec.action}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
