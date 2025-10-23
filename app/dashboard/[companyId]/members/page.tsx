import { prisma } from "@/lib/prisma";
import Link from "next/link";
import MembersTable from "./MembersTable";
import AISearch from "./AISearch";

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ search?: string; status?: string; ai?: string; query?: string; filters?: string }>;
}) {
  const { companyId } = await params;
  const { search, status, ai, query, filters } = await searchParams;

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

  // Handle AI search filters
  if (ai === "true" && filters) {
    try {
      const parsedFilters = JSON.parse(filters);

      // Apply AI-generated filters
      if (parsedFilters.status) {
        whereClause.status = parsedFilters.status;
      }
      if (parsedFilters.churnRisk) {
        whereClause.churnRisk = parsedFilters.churnRisk;
      }
      if (parsedFilters.engagementScore) {
        whereClause.engagementScore = parsedFilters.engagementScore;
      }
      if (parsedFilters.totalRevenue) {
        whereClause.totalRevenue = parsedFilters.totalRevenue;
      }
      if (parsedFilters.monthlyRevenue) {
        whereClause.monthlyRevenue = parsedFilters.monthlyRevenue;
      }
      if (parsedFilters.daysSinceJoined !== undefined) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parsedFilters.daysSinceJoined);
        whereClause.firstJoinedAt = { gte: cutoffDate };
      }
    } catch (e) {
      console.error("Failed to parse AI filters:", e);
    }
  } else {
    // Regular search
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      whereClause.status = status;
    }
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

        {/* AI Search */}
        <AISearch companyId={companyId} />

        {/* Show AI query if active */}
        {ai === "true" && query && (
          <div className="mb-6 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">AI Search Results for:</span>
              <span className="text-sm font-medium text-white">"{query}"</span>
            </div>
            <Link
              href={`/dashboard/${companyId}/members`}
              className="text-sm text-zinc-400 hover:text-white"
            >
              Clear
            </Link>
          </div>
        )}

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
        <MembersTable members={members} companyId={companyId} />
      </div>
    </div>
  );
}
