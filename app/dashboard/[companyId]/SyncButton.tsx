"use client";

import { useState } from "react";

export function SyncButton({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      if (response.ok) {
        window.location.reload();
      } else {
        alert("Failed to sync members. Please try again.");
      }
    } catch (error) {
      alert("An error occurred during sync.");
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm("This will delete ALL members and re-sync from scratch. Continue?")) {
      return;
    }

    setCleaning(true);
    try {
      // First cleanup
      const cleanupResponse = await fetch("/api/cleanup-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (!cleanupResponse.ok) {
        alert("Failed to cleanup members.");
        return;
      }

      // Then sync
      const syncResponse = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (syncResponse.ok) {
        window.location.reload();
      } else {
        alert("Cleanup succeeded but sync failed. Please try syncing again.");
      }
    } catch (error) {
      alert("An error occurred during cleanup.");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleSync}
        disabled={loading || cleaning}
        className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Syncing..." : "Sync Members"}
      </button>
      <button
        onClick={handleCleanup}
        disabled={loading || cleaning}
        className="bg-red-900 text-white px-4 py-2 rounded-lg hover:bg-red-800 border border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {cleaning ? "Cleaning..." : "Clean & Re-sync"}
      </button>
    </div>
  );
}
