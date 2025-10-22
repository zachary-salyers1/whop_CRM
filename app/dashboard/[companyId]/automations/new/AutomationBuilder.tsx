"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tag = {
  id: string;
  name: string;
};

type Action = {
  type: "add_tag" | "remove_tag" | "add_note" | "update_field";
  tagId?: string;
  tagName?: string;
  content?: string;
  field?: string;
  value?: string;
};

type Trigger = {
  type: "membership_created" | "membership_cancelled" | "payment_succeeded" | "payment_failed";
};

const TRIGGER_OPTIONS = [
  { value: "membership_created", label: "New member joins", description: "When a new member creates a subscription" },
  { value: "membership_cancelled", label: "Member cancels", description: "When a member cancels their subscription" },
  { value: "payment_succeeded", label: "Payment succeeds", description: "When a payment is successfully processed" },
  { value: "payment_failed", label: "Payment fails", description: "When a payment fails or is declined" },
];

const ACTION_OPTIONS = [
  { value: "add_tag", label: "Add tag", description: "Add a tag to the member" },
  { value: "remove_tag", label: "Remove tag", description: "Remove a tag from the member" },
  { value: "add_note", label: "Add note", description: "Add a note to the member's profile" },
  { value: "update_field", label: "Update field", description: "Update a member field" },
];

const FIELD_OPTIONS = [
  { value: "churnRisk", label: "Churn Risk" },
  { value: "status", label: "Status" },
];

export default function AutomationBuilder({
  companyId,
  whopCompanyId,
  tags,
}: {
  companyId: string;
  whopCompanyId: string;
  tags: Tag[];
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<Trigger>({
    type: "membership_cancelled",
  });
  const [actions, setActions] = useState<Action[]>([
    { type: "add_tag", tagId: "", tagName: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addAction = () => {
    setActions([...actions, { type: "add_tag", tagId: "", tagName: "" }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, updates: Partial<Action>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };

    // If updating tag action, also update the tag name
    if (updates.tagId) {
      const tag = tags.find((t) => t.id === updates.tagId);
      if (tag) {
        newActions[index].tagName = tag.name;
      }
    }

    setActions(newActions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter an automation name");
      return;
    }

    // Validate actions
    for (const action of actions) {
      if ((action.type === "add_tag" || action.type === "remove_tag") && !action.tagId) {
        alert("Please select a tag for all tag actions");
        return;
      }
      if (action.type === "add_note" && !action.content?.trim()) {
        alert("Please enter note content");
        return;
      }
      if (action.type === "update_field" && (!action.field || !action.value)) {
        alert("Please select field and value for update actions");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          companyId,
          trigger,
          actions,
        }),
      });

      if (response.ok) {
        router.push(`/dashboard/${whopCompanyId}/automations`);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create automation");
      }
    } catch (error) {
      alert("Error creating automation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Automation Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Tag churned members"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this automation does..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white h-20"
          />
        </div>
      </div>

      {/* Trigger */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">
          When (Trigger)
        </h3>
        <div className="space-y-2">
          {TRIGGER_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-3 p-3 bg-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-600"
            >
              <input
                type="radio"
                name="trigger"
                value={option.value}
                checked={trigger.type === option.value}
                onChange={(e) =>
                  setTrigger({ type: e.target.value as Trigger["type"] })
                }
                className="mt-1"
              />
              <div>
                <div className="font-medium text-white">{option.label}</div>
                <div className="text-sm text-zinc-400">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Then (Actions)
        </h3>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div
              key={index}
              className="bg-zinc-700 p-4 rounded-xl space-y-3"
            >
              {/* Action Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Action Type
                </label>
                <select
                  value={action.type}
                  onChange={(e) =>
                    updateAction(index, {
                      type: e.target.value as Action["type"],
                      tagId: "",
                      tagName: "",
                      content: "",
                      field: "",
                      value: "",
                    })
                  }
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-white"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Selection for add_tag/remove_tag */}
              {(action.type === "add_tag" || action.type === "remove_tag") && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Select Tag *
                  </label>
                  <select
                    value={action.tagId || ""}
                    onChange={(e) =>
                      updateAction(index, { tagId: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-white"
                    required
                  >
                    <option value="">-- Select a tag --</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Note Content for add_note */}
              {action.type === "add_note" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Note Content *
                  </label>
                  <textarea
                    value={action.content || ""}
                    onChange={(e) =>
                      updateAction(index, { content: e.target.value })
                    }
                    placeholder="Enter note content..."
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-white h-20"
                    required
                  />
                </div>
              )}

              {/* Field Update for update_field */}
              {action.type === "update_field" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Field *
                    </label>
                    <select
                      value={action.field || ""}
                      onChange={(e) =>
                        updateAction(index, { field: e.target.value })
                      }
                      className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-white"
                      required
                    >
                      <option value="">-- Select field --</option>
                      {FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Value *
                    </label>
                    <input
                      type="text"
                      value={action.value || ""}
                      onChange={(e) =>
                        updateAction(index, { value: e.target.value })
                      }
                      placeholder="e.g., high, active"
                      className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                </>
              )}

              {/* Remove Action Button */}
              {actions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAction(index)}
                  className="text-white hover:text-zinc-300 text-sm"
                >
                  Remove Action
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addAction}
          className="mt-3 text-white hover:text-zinc-300 text-sm"
        >
          + Add Another Action
        </button>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Link
          href={`/dashboard/${whopCompanyId}/automations`}
          className="bg-zinc-800 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 border border-zinc-700"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="bg-zinc-700 text-white px-6 py-2 rounded-xl hover:bg-zinc-600 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Automation"}
        </button>
      </div>
    </form>
  );
}
