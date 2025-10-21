"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Filter = {
  field: string;
  operator: string;
  value: string;
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
  select: [
    { value: "equals", label: "Equals" },
  ],
};

export function SegmentBuilder({
  companyId,
  whopCompanyId,
}: {
  companyId: string;
  whopCompanyId: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filters, setFilters] = useState<Filter[]>([
    { field: "status", operator: "equals", value: "active" },
  ]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addFilter = () => {
    setFilters([...filters, { field: "status", operator: "equals", value: "active" }]);
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
      const response = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          companyId,
          filters,
        }),
      });

      if (response.ok) {
        const segment = await response.json();
        router.push(`/dashboard/${whopCompanyId}/segments/${segment.id}`);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create segment");
      }
    } catch (error) {
      alert("Error creating segment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Segment Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Spenders, Trial Users..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this segment represents..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <button
            type="button"
            onClick={addFilter}
            className="text-sm bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700 border border-gray-700"
          >
            + Add Filter
          </button>
        </div>

        <div className="space-y-4">
          {filters.map((filter, index) => {
            const field = FILTER_FIELDS.find((f) => f.value === filter.field);
            const operators = field ? OPERATORS[field.type as keyof typeof OPERATORS] : [];

            return (
              <div
                key={index}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Field */}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Field</label>
                    <select
                      value={filter.field}
                      onChange={(e) =>
                        updateFilter(index, {
                          field: e.target.value,
                          operator: OPERATORS[FILTER_FIELDS.find(f => f.value === e.target.value)?.type as keyof typeof OPERATORS]?.[0]?.value || "equals",
                          value: "",
                        })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {FILTER_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator */}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Condition</label>
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, { operator: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {operators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Value */}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Value</label>
                    {filter.field === "status" ? (
                      <select
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field?.type === "number" ? (
                      <input
                        type="number"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="Enter value..."
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="Enter value..."
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  {/* Remove */}
                  {filters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFilter(index)}
                      className="mt-5 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          All filters are combined with AND logic (members must match all filters)
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href={`/dashboard/${whopCompanyId}/segments`}
          className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700 border border-gray-700"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Segment"}
        </button>
      </div>
    </form>
  );
}
