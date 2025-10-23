"use client";

import { useState } from "react";

export default function DeleteMemberButton({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${memberName}?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/members/${memberId}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert("Failed to delete member");
      }
    } catch (error) {
      alert("An error occurred while deleting member");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
