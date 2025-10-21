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
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Members</h1>
              <p className="text-gray-400 mt-2">
                Manage and view all your members
              </p>
            </div>
            <Link
              href={`/dashboard/${companyId}`}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 border border-gray-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Total Members</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Active</div>
            <div className="text-2xl font-bold text-green-400">
              {stats.active}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Cancelled</div>
            <div className="text-2xl font-bold text-red-400">
              {stats.cancelled}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Past Due</div>
            <div className="text-2xl font-bold text-yellow-400">
              {stats.pastDue}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <form method="GET" className="flex gap-4">
            <input
              type="text"
              name="search"
              placeholder="Search by email or username..."
              defaultValue={search}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="status"
              defaultValue={status || "all"}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Members Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {member.username || "No username"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.status === "active"
                            ? "bg-green-900 text-green-200"
                            : member.status === "cancelled"
                            ? "bg-red-900 text-red-200"
                            : "bg-yellow-900 text-yellow-200"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
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
                            className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-300 border border-gray-700"
                          >
                            {memberTag.tag.name}
                          </span>
                        ))}
                        {member.tags.length > 2 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                            +{member.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {member._count.events} events • {member._count.notes} notes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/${companyId}/members/${member.id}`}
                        className="text-blue-400 hover:text-blue-300"
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
