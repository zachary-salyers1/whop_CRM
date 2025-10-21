"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Tag = {
  id: string;
  name: string;
  color: string | null;
};

type MemberTag = {
  id: string;
  tag: Tag;
};

export function TagManager({
  memberId,
  companyId,
  initialTags,
}: {
  memberId: string;
  companyId: string;
  initialTags: MemberTag[];
}) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAvailableTags();
  }, [companyId]);

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch(`/api/tags?companyId=${companyId}`);
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const handleAddTag = async (tagId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/members/${memberId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, companyId }),
      });

      if (response.ok) {
        setShowDropdown(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to add tag");
      }
    } catch (error) {
      alert("Error adding tag");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/members/${memberId}/tags?tagId=${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to remove tag");
      }
    } catch (error) {
      alert("Error removing tag");
    } finally {
      setLoading(false);
    }
  };

  const currentTagIds = initialTags.map((mt) => mt.tag.id);
  const tagsToAdd = availableTags.filter((tag) => !currentTagIds.includes(tag.id));

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {initialTags.map((memberTag) => (
        <div
          key={memberTag.id}
          className="group flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-sm"
          style={{
            borderColor: memberTag.tag.color || undefined,
            color: memberTag.tag.color || undefined,
          }}
        >
          <span>{memberTag.tag.name}</span>
          <button
            onClick={() => handleRemoveTag(memberTag.tag.id)}
            disabled={loading}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity disabled:opacity-50"
          >
            ×
          </button>
        </div>
      ))}

      {tagsToAdd.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            + Add Tag
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[200px]">
              <div className="p-2 space-y-1">
                {tagsToAdd.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-sm text-white disabled:opacity-50 transition-colors"
                    style={{ color: tag.color || undefined }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tagsToAdd.length === 0 && initialTags.length === availableTags.length && (
        <span className="text-sm text-gray-500">All tags applied</span>
      )}
    </div>
  );
}
