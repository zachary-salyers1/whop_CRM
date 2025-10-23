"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Insight = {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  metric: string | null;
  actionable: boolean;
  actionUrl: string | null;
  generatedAt: string;
};

export default function DashboardInsights({
  initialInsights,
  companyId,
}: {
  initialInsights: Insight[];
  companyId: string;
}) {
  const [insights, setInsights] = useState<Insight[]>(initialInsights);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
        // Refresh the page to get latest data
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to refresh insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-400 bg-red-900/30 border-red-700";
      case "high":
        return "text-orange-400 bg-orange-900/30 border-orange-700";
      case "medium":
        return "text-yellow-400 bg-yellow-900/30 border-yellow-700";
      case "low":
        return "text-white bg-zinc-700 border-zinc-600";
      default:
        return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "churn":
        return "⚠️";
      case "revenue":
        return "💰";
      case "engagement":
        return "📊";
      case "growth":
        return "📈";
      default:
        return "ℹ️";
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>✨</span>
            AI Insights
          </h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-sm text-white hover:text-zinc-300 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Insights"}
          </button>
        </div>
        <p className="text-sm text-zinc-400">
          No insights available yet. Click "Generate Insights" to analyze your
          member data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>✨</span>
          AI Insights
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="text-sm text-white hover:text-zinc-300 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getCategoryIcon(insight.category)}</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(
                      insight.priority
                    )}`}
                  >
                    {insight.priority.toUpperCase()}
                  </span>
                  {insight.metric && (
                    <span className="text-xs text-zinc-500">{insight.metric}</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {insight.title}
                </h3>
                <p className="text-sm text-zinc-300">{insight.description}</p>
              </div>
              {insight.actionable && insight.actionUrl && (
                <Link
                  href={insight.actionUrl}
                  className="text-sm text-white hover:text-zinc-300 whitespace-nowrap"
                >
                  View →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-zinc-500 text-right">
        Last updated: {new Date(insights[0]?.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
