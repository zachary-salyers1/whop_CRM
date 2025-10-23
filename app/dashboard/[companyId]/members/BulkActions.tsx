"use client";

import { useState } from "react";

export default function BulkActions({
  companyId,
  selectedIds,
  onClearSelection,
}: {
  companyId: string;
  selectedIds: string[];
  onClearSelection: () => void;
}) {
  const [processing, setProcessing] = useState(false);

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      alert("Please select members to export");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/members/bulk-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: selectedIds, companyId }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `members-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        onClearSelection();
      } else {
        alert("Failed to export members");
      }
    } catch (error) {
      alert("An error occurred while exporting");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select members to delete");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} member(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/members/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: selectedIds, companyId }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert("Failed to delete members");
      }
    } catch (error) {
      alert("An error occurred while deleting");
    } finally {
      setProcessing(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-6 flex items-center justify-between">
      <div className="text-white">
        <span className="font-semibold">{selectedIds.length}</span> member(s)
        selected
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={processing}
          className="bg-zinc-700 text-white px-4 py-2 rounded-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? "Exporting..." : "Export to CSV"}
        </button>
        <button
          onClick={handleDelete}
          disabled={processing}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? "Deleting..." : "Delete Selected"}
        </button>
        <button
          onClick={onClearSelection}
          disabled={processing}
          className="bg-zinc-700 text-white px-4 py-2 rounded-lg hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
