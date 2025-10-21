import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ companyId: string; memberId: string }>;
}) {
  const { companyId, memberId } = await params;

  const company = await prisma.company.findUnique({
    where: { whopCompanyId: companyId },
  });

  if (!company) {
    return notFound();
  }

  const member = await prisma.member.findFirst({
    where: {
      id: memberId,
      companyId: company.id,
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      notes: {
        orderBy: {
          createdAt: "desc",
        },
      },
      events: {
        orderBy: {
          occurredAt: "desc",
        },
        take: 50,
      },
      memberships: {
        orderBy: {
          startedAt: "desc",
        },
      },
    },
  });

  if (!member) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/${companyId}/members`}
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Members
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {member.username || "No Username"}
              </h1>
              <p className="text-gray-400 mt-1">{member.email}</p>
              <div className="flex gap-2 mt-3">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    member.status === "active"
                      ? "bg-green-900 text-green-200"
                      : member.status === "cancelled"
                      ? "bg-red-900 text-red-200"
                      : "bg-yellow-900 text-yellow-200"
                  }`}
                >
                  {member.status}
                </span>
                {member.tags.map((memberTag) => (
                  <span
                    key={memberTag.id}
                    className="px-3 py-1 text-sm rounded-full bg-gray-800 text-gray-300 border border-gray-700"
                    style={{
                      borderColor: memberTag.tag.color || undefined,
                      color: memberTag.tag.color || undefined,
                    }}
                  >
                    {memberTag.tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats & Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Overview
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400">Total Revenue</div>
                  <div className="text-2xl font-bold text-white">
                    ${member.totalRevenue.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Monthly Revenue</div>
                  <div className="text-xl font-bold text-white">
                    ${member.monthlyRevenue.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Lifetime Value</div>
                  <div className="text-xl font-bold text-white">
                    ${member.lifetimeValue.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Engagement Score</div>
                  <div className="text-xl font-bold text-white">
                    {member.engagementScore}/100
                  </div>
                </div>
              </div>
            </div>

            {/* Member Details */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Details</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400">Whop User ID</div>
                  <div className="text-sm text-white font-mono">
                    {member.whopUserId}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Current Plan</div>
                  <div className="text-sm text-white">
                    {member.currentPlan || "No plan"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Joined</div>
                  <div className="text-sm text-white">
                    {new Date(member.firstJoinedAt).toLocaleDateString()}
                  </div>
                </div>
                {member.cancelledAt && (
                  <div>
                    <div className="text-sm text-gray-400">Cancelled</div>
                    <div className="text-sm text-white">
                      {new Date(member.cancelledAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {member.lastSeenAt && (
                  <div>
                    <div className="text-sm text-gray-400">Last Seen</div>
                    <div className="text-sm text-white">
                      {new Date(member.lastSeenAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Memberships */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Subscriptions
              </h2>
              <div className="space-y-3">
                {member.memberships.length === 0 ? (
                  <p className="text-sm text-gray-400">No subscriptions</p>
                ) : (
                  member.memberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="border border-gray-800 rounded p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {membership.planName}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ${membership.price.toFixed(2)}/{membership.interval}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            membership.status === "active"
                              ? "bg-green-900 text-green-200"
                              : "bg-gray-800 text-gray-300"
                          }`}
                        >
                          {membership.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Started: {new Date(membership.startedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Timeline & Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
              <div className="space-y-4">
                {member.notes.length === 0 ? (
                  <p className="text-sm text-gray-400">No notes yet</p>
                ) : (
                  member.notes.map((note) => (
                    <div
                      key={note.id}
                      className="border border-gray-800 rounded p-4"
                    >
                      <p className="text-sm text-white">{note.content}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(note.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Event Timeline */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Activity Timeline
              </h2>
              <div className="space-y-4">
                {member.events.length === 0 ? (
                  <p className="text-sm text-gray-400">No activity yet</p>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800"></div>

                    {member.events.map((event, index) => (
                      <div key={event.id} className="relative pl-10 pb-6">
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-gray-900 ${
                            event.type.includes("succeeded") || event.type.includes("created")
                              ? "bg-green-500"
                              : event.type.includes("failed") || event.type.includes("cancelled")
                              ? "bg-red-500"
                              : "bg-blue-500"
                          }`}
                        ></div>

                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium text-white capitalize">
                                {event.type.replace(/_/g, " ")}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(event.occurredAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
