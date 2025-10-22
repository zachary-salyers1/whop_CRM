"use client";

import { useState } from "react";

type GPTRecommendation = {
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  action: string;
  expectedImpact: string;
  timeline: string;
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
  recommendations: GPTRecommendation[];
  lifetimeValue: {
    predicted: number;
    confidence: number;
    reasoning: string;
  };
  keyInsights: string[];
};

export default function GPTInsights({ memberId }: { memberId: string }) {
  const [insights, setInsights] = useState<GPTInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);

  const analyzeWithGPT = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/members/${memberId}/gpt-insights`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze");
      }

      const data = await response.json();
      setInsights(data.insights);
      setAnalyzedAt(data.analyzedAt);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getChurnRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "low":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "text-green-400";
      case "stable":
        return "text-blue-400";
      case "declining":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "high":
        return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "low":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  if (!insights && !loading && !error) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-800/30 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <span className="text-purple-400">🤖</span>
              GPT-4o AI Analysis
            </h3>
            <p className="text-sm text-gray-400">
              Get deep insights powered by OpenAI's GPT-4o model
            </p>
          </div>
        </div>

        <button
          onClick={analyzeWithGPT}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Analyze with GPT-4o
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-800/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
          <span className="text-purple-400">Analyzing with GPT-4o...</span>
        </div>
        <p className="text-sm text-gray-400">
          This may take 10-15 seconds as we analyze this member's complete history.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Analysis Failed</h3>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <button
          onClick={analyzeWithGPT}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-800/30 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-purple-400">🤖</span>
              GPT-4o AI Analysis
            </h3>
            {analyzedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Analyzed: {new Date(analyzedAt).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={analyzeWithGPT}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            Re-analyze
          </button>
        </div>

        {/* Churn Risk Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-400 mb-2">Churn Risk</div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getChurnRiskColor(
                  insights.churnRiskAssessment.level
                )}`}
              >
                {insights.churnRiskAssessment.level.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                {insights.churnRiskAssessment.confidence}% confidence
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-2">Engagement Score</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-white">
                {insights.engagementAnalysis.score}
                <span className="text-sm text-gray-400">/100</span>
              </div>
              <span
                className={`text-xs font-medium ${getTrendColor(
                  insights.engagementAnalysis.trend
                )}`}
              >
                {insights.engagementAnalysis.trend === "improving" && "↗ Improving"}
                {insights.engagementAnalysis.trend === "stable" && "→ Stable"}
                {insights.engagementAnalysis.trend === "declining" && "↘ Declining"}
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-2">Predicted LTV</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-white">
                ${insights.lifetimeValue.predicted.toFixed(2)}
              </div>
              <span className="text-xs text-gray-500">
                {insights.lifetimeValue.confidence}% confidence
              </span>
            </div>
          </div>
        </div>

        {/* Churn Risk Reasoning */}
        <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
          <div className="text-xs font-medium text-gray-400 uppercase mb-2">
            Churn Risk Analysis
          </div>
          <p className="text-sm text-gray-300 mb-3">
            {insights.churnRiskAssessment.reasoning}
          </p>
          <div className="flex flex-wrap gap-2">
            {insights.churnRiskAssessment.keyFactors.map((factor, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>

        {/* Engagement Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Activity</div>
            <div className="text-lg font-bold text-white">
              {insights.engagementAnalysis.breakdown.activity}
              <span className="text-xs text-gray-400">/100</span>
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Monetization</div>
            <div className="text-lg font-bold text-white">
              {insights.engagementAnalysis.breakdown.monetization}
              <span className="text-xs text-gray-400">/100</span>
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Loyalty</div>
            <div className="text-lg font-bold text-white">
              {insights.engagementAnalysis.breakdown.loyalty}
              <span className="text-xs text-gray-400">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {insights.keyInsights.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
            <span className="text-blue-400">💡</span>
            Key Insights
          </h4>
          <ul className="space-y-2">
            {insights.keyInsights.map((insight, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* GPT Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            <span className="text-green-400">🎯</span>
            AI Recommendations
          </h4>

          <div className="space-y-3">
            {insights.recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4"
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
                    <span className="text-xs text-gray-500 uppercase">
                      {rec.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{rec.timeline}</span>
                </div>
                <p className="text-sm font-medium text-gray-200 mb-2">
                  {rec.action}
                </p>
                <p className="text-xs text-gray-400">
                  <span className="font-medium">Impact:</span> {rec.expectedImpact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LTV Reasoning */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
          <span className="text-yellow-400">📊</span>
          Lifetime Value Prediction
        </h4>
        <p className="text-sm text-gray-300">{insights.lifetimeValue.reasoning}</p>
      </div>
    </div>
  );
}
