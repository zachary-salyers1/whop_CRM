"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Filter = {
  field: string;
  operator: string;
  value: string;
};

type Segment = {
  id: string;
  name: string;
  description: string | null;
  filters: any;
};

const FILTER_FIELDS = [
  { value: "status", label: "Status", type: "select" },
  { value: "totalRevenue", label: "Total Revenue", type: "number" },
  { value: "monthlyRevenue", label: "Monthly Revenue", type: "number" },
  { value: "engagementScore", label: "Engagement Score", type: "number" },
  { value: "currentPlan", label: "Current Plan", type: "text" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
  { value: "past_due", label: "Past Due" },
];

const OPERATORS = {
  number: [
    { value: "gte", label: "Greater than or equal to" },
    { value: "lte", label: "Less than or equal to" },
    { value: "eq", label: "Equal to" },
  ],
  text: [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
  ],
  select: [{ value: "equals", label: "Equals" }],
};

export default function EditSegmentForm({
  segment,
  companyId,
  whopCompanyId,
  segmentId,
}: {
  segment: Segment;
  companyId: string;
  whopCompanyId: string;
  segmentId: string;
}) {
  const [name, setName] = useState(segment.name);
  const [description, setDescription] = useState(segment.description || "");
  const [filters, setFilters] = useState<Filter[]>(segment.filters as Filter[]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const addFilter = () => {
    setFilters([
      ...filters,
      { field: "status", operator: "equals", value: "active" },
    ]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<Filter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a segment name");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          companyId,
          filters,
        }),
      });

      if (response.ok) {
        router.push(`/dashboard/${whopCompanyId}/segments/${segmentId}`);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update segment");
      }
    } catch (error) {
      alert("Error updating segment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/segments/${segmentId}?companyId=${companyId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        router.push(`/dashboard/${whopCompanyId}/segments`);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete segment");
      }
    } catch (error) {
      alert("Error deleting segment");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getFieldType = (field: string) => {
    return FILTER_FIELDS.find((f) => f.value === field)?.type || "text";
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Segment Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Value Members"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this segment..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white h-20"
            />
          </div>

          {/* Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Filters
            </label>
            <div className="space-y-3">
              {filters.map((filter, index) => {
                const fieldType = getFieldType(filter.field);
                const operators =
                  OPERATORS[fieldType as keyof typeof OPERATORS] ||
                  OPERATORS.text;

                return (
                  <div
                    key={index}
                    className="flex gap-3 items-start bg-gray-800 p-3 rounded"
                  >
                    {/* Field */}
                    <select
                      value={filter.field}
                      onChange={(e) =>
                        updateFilter(index, { field: e.target.value })
                      }
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      {FILTER_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      value={filter.operator}
                      onChange={(e) =>
                        updateFilter(index, { operator: e.target.value })
                      }
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      {operators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    {/* Value */}
                    {filter.field === "status" ? (
                      <select
                        value={filter.value}
                        onChange={(e) =>
                          updateFilter(index, { value: e.target.value })
                        }
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white flex-1"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : fieldType === "number" ? (
                      <input
                        type="number"
                        value={filter.value}
                        onChange={(e) =>
                          updateFilter(index, { value: e.target.value })
                        }
                        placeholder="Value"
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white flex-1"
                      />
                    ) : (
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) =>
                          updateFilter(index, { value: e.target.value })
                        }
                        placeholder="Value"
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white flex-1"
                      />
                    )}

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeFilter(index)}
                      className="text-red-400 hover:text-red-300 px-2"
                      disabled={filters.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addFilter}
              className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
            >
              + Add Filter
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete Segment
          </button>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/${whopCompanyId}/segments/${segmentId}`}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 border border-gray-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Segment?</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{segment.name}"? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
