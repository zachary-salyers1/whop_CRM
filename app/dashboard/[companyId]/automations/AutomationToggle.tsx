"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AutomationToggle({
  automationId,
  companyId,
  initialActive,
}: {
  automationId: string;
  companyId: string;
  initialActive: boolean;
}) {
  const [isActive, setIsActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/automations/${automationId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, isActive: !isActive }),
      });

      if (response.ok) {
        setIsActive(!isActive);
        router.refresh();
      } else {
        alert("Failed to update automation");
      }
    } catch (error) {
      alert("Error updating automation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isActive ? "bg-blue-600" : "bg-gray-700"
      } ${loading ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isActive ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
