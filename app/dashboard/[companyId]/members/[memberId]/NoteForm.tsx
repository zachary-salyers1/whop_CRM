"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NoteForm({
  memberId,
  companyId,
}: {
  memberId: string;
  companyId: string;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/members/${memberId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, companyId }),
      });

      if (response.ok) {
        setContent("");
        router.refresh();
      } else {
        alert("Failed to add note");
      }
    } catch (error) {
      alert("Error adding note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note about this member..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add Note"}
      </button>
    </form>
  );
}
