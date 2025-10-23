"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteMemberButton from "./DeleteMemberButton";
import BulkActions from "./BulkActions";

type Member = {
  id: string;
  username: string | null;
  email: string;
  status: string;
  currentPlan: string | null;
  totalRevenue: number;
  tags: Array<{ id: string; tag: { name: string } }>;
  _count: { events: number; notes: number };
};

export default function MembersTable({
  members,
  companyId,
}: {
  members: Member[];
  companyId: string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (memberId: string) => {
    setSelectedIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === members.length ? [] : members.map((m) => m.id)
    );
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <>
      <BulkActions
        companyId={companyId}
        selectedIds={selectedIds}
        onClearSelection={clearSelection}
      />

      <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-700">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === members.length && members.length > 0
                  }
                  onChange={toggleAll}
                  className="rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {members.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-zinc-400">
                  No members found
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-zinc-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(member.id)}
                      onChange={() => toggleSelection(member.id)}
                      className="rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {member.username || "No username"}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.status === "active"
                          ? "bg-zinc-700 text-white"
                          : member.status === "cancelled"
                          ? "bg-zinc-700 text-white"
                          : "bg-zinc-700 text-white"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                    {member.currentPlan || "No plan"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    ${member.totalRevenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {member.tags.slice(0, 2).map((memberTag) => (
                        <span
                          key={memberTag.id}
                          className="px-2 py-1 text-xs rounded-full bg-zinc-700 text-zinc-300 border border-zinc-600"
                        >
                          {memberTag.tag.name}
                        </span>
                      ))}
                      {member.tags.length > 2 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-zinc-700 text-zinc-300 border border-zinc-600">
                          +{member.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {member._count.events} events • {member._count.notes} notes
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/${companyId}/members/${member.id}`}
                      className="text-white hover:text-zinc-300"
                    >
                      View Profile →
                    </Link>
                    <DeleteMemberButton
                      memberId={member.id}
                      memberName={member.username || member.email}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
