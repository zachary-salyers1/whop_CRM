import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const { companyId } = await params;
  const { search, status } = await searchParams;

  const company = await prisma.company.findUnique({
    where: { whopCompanyId: companyId },
  });

  if (!company) {
    return <div>Company not found</div>;
  }

  // Build filter conditions
  const whereClause: any = {
    companyId: company.id,
  };

  if (search) {
    whereClause.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && status !== "all") {
    whereClause.status = status;
  }

  const members = await prisma.member.findMany({
    where: whereClause,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          events: true,
          notes: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    total: await prisma.member.count({ where: { companyId: company.id } }),
    active: await prisma.member.count({
      where: { companyId: company.id, status: "active" },
    }),
    cancelled: await prisma.member.count({
      where: { companyId: company.id, status: "cancelled" },
    }),
    pastDue: await prisma.member.count({
      where: { companyId: company.id, status: "past_due" },
    }),
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>

          {/* Tabs Navigation */}
          <div className="border-b border-zinc-800">
            <nav className="flex gap-2">
              <Link
                href={`/dashboard/${companyId}`}
                className="pb-3 pt-3 px-6 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Overview
              </Link>
              <Link
                href={`/dashboard/${companyId}/members`}
                className="bg-zinc-800 border-t border-x border-zinc-700 pb-3 pt-3 px-6 text-white font-medium rounded-t-lg"
              >
                Members
              </Link>
              <Link
                href={`/dashboard/${companyId}/segments`}
                className="pb-3 pt-3 px-6 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Segments
              </Link>
              <Link
                href={`/dashboard/${companyId}/automations`}
                className="pb-3 pt-3 px-6 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Automations
              </Link>
            </nav>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
            <div className="text-sm text-zinc-400">Total Members</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
            <div className="text-sm text-zinc-400">Active</div>
            <div className="text-2xl font-bold text-white">
              {stats.active}
            </div>
          </div>
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
            <div className="text-sm text-zinc-400">Cancelled</div>
            <div className="text-2xl font-bold text-white">
              {stats.cancelled}
            </div>
          </div>
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
            <div className="text-sm text-zinc-400">Past Due</div>
            <div className="text-2xl font-bold text-white">
              {stats.pastDue}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-6">
          <form method="GET" className="flex gap-4">
            <input
              type="text"
              name="search"
              placeholder="Search by email or username..."
              defaultValue={search}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
            <select
              name="status"
              defaultValue={status || "all"}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
            </select>
            <button
              type="submit"
              className="bg-zinc-700 text-white px-6 py-2 rounded-xl hover:bg-zinc-600"
            >
              Search
            </button>
          </form>
        </div>

        {/* Members Table */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-700">
            <thead className="bg-zinc-800">
              <tr>
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
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-400">
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-zinc-700">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
