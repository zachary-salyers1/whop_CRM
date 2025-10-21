"use client";

import { useState } from "react";

export function SyncButton({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(false);

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

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Syncing..." : "Sync Members Now"}
    </button>
  );
}
