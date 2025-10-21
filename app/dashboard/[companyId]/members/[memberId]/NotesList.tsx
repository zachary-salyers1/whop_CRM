"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Note = {
  id: string;
  content: string;
  createdAt: Date;
};

export function NotesList({
  notes,
  memberId,
}: {
  notes: Note[];
  memberId: string;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    setDeletingId(noteId);
    try {
      const response = await fetch(`/api/members/${memberId}/notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to delete note");
      }
    } catch (error) {
      alert("Error deleting note");
    } finally {
      setDeletingId(null);
    }
  };

  if (notes.length === 0) {
    return <p className="text-sm text-gray-400">No notes yet</p>;
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="border border-gray-800 rounded p-4 group hover:border-gray-700 transition-colors"
        >
          <div className="flex justify-between items-start">
            <p className="text-sm text-white flex-1">{note.content}</p>
            <button
              onClick={() => handleDelete(note.id)}
              disabled={deletingId === note.id}
              className="ml-4 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            >
              {deletingId === note.id ? "..." : "Delete"}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {new Date(note.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
