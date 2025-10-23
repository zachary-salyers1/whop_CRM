"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AISearch({ companyId }: { companyId: string }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/members/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, companyId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Search failed");
      }

      const { filters } = await response.json();

      // Convert filters to URL search params and navigate
      const params = new URLSearchParams();
      params.set("ai", "true");
      params.set("query", query);
      params.set("filters", JSON.stringify(filters));

      router.push(`/dashboard/${companyId}/members?${params.toString()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "show me highly engaged members" or "members at risk of churning"'
              className="w-full px-4 py-3 pl-10 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              disabled={loading}
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>AI Search</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-3 px-4 py-2 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
