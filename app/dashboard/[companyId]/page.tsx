import { prisma } from "@/lib/prisma";
import { SyncButton } from "./SyncButton";
import Link from "next/link";
import {
  MemberGrowthChart,
  StatusDistributionChart,
  RevenueByPlanChart,
  EngagementLeaderboard,
} from "./DashboardCharts";
import DashboardInsights from "./DashboardInsights";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  const company = await prisma.company.findUnique({
    where: { whopCompanyId: companyId },
  });

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Initializing Your Whop CRM
          </h1>
          <p className="text-gray-600 mb-6">
            Setting up your company data...
          </p>
          <form action="/api/init" method="POST">
            <button
              type="submit"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Initialize CRM
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalMembers = await prisma.member.count({
    where: { companyId: company.id },
  });

  const activeMembers = await prisma.member.count({
    where: {
      companyId: company.id,
      status: "active",
    },
  });

  const totalRevenue = await prisma.member.aggregate({
    where: { companyId: company.id },
    _sum: {
      totalRevenue: true,
      monthlyRevenue: true,
    },
  });

  const recentEvents = await prisma.event.findMany({
    where: {
      member: {
        companyId: company.id,
      },
    },
    include: {
      member: true,
    },
    orderBy: {
      occurredAt: "desc",
    },
    take: 10,
  });

  // Fetch all members for charts
  const allMembers = await prisma.member.findMany({
    where: { companyId: company.id },
    select: {
      id: true,
      status: true,
      totalRevenue: true,
      engagementScore: true,
      firstJoinedAt: true,
      currentPlan: true,
    },
  });

  // Fetch AI insights
  const insightsRaw = await prisma.dashboardInsight.findMany({
    where: {
      companyId: company.id,
      isActive: true,
    },
    orderBy: {
      generatedAt: "desc",
    },
    take: 5,
  });

  // Convert Date objects to strings for client component
  const insights = insightsRaw.map(insight => ({
    ...insight,
    generatedAt: insight.generatedAt.toISOString(),
    createdAt: insight.createdAt.toISOString(),
    updatedAt: insight.updatedAt.toISOString(),
    expiresAt: insight.expiresAt?.toISOString() || null,
  }));

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>

          {/* Tabs Navigation */}
          <div className="border-b border-zinc-800">
            <nav className="flex gap-2">
              <Link
                href={`/dashboard/${companyId}`}
                className="bg-zinc-800 border-t border-x border-zinc-700 pb-3 pt-3 px-6 text-white font-medium rounded-t-lg"
              >
                Overview
              </Link>
              <Link
                href={`/dashboard/${companyId}/members`}
                className="pb-3 pt-3 px-6 text-zinc-500 hover:text-zinc-300 transition-colors"
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
              <Link
                href={`/dashboard/${companyId}/analytics`}
                className="pb-3 pt-3 px-6 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Analytics
              </Link>
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="!bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Total Members
            </h3>
            <p className="text-3xl font-bold text-white">{totalMembers}</p>
          </div>

          <div className="!bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Active Members
            </h3>
            <p className="text-3xl font-bold text-white">{activeMembers}</p>
          </div>

          <div className="!bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Total Revenue
            </h3>
            <p className="text-3xl font-bold text-white">
              ${(totalRevenue._sum.totalRevenue || 0).toFixed(2)}
            </p>
          </div>

          <div className="!bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">MRR</h3>
            <p className="text-3xl font-bold text-white">
              ${(totalRevenue._sum.monthlyRevenue || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {!company.lastSyncedAt && (
          <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-8">
            <h3 className="text-sm font-medium text-yellow-200 mb-2">
              Initial Sync Required
            </h3>
            <p className="text-sm text-yellow-300 mb-4">
              You haven't synced your member data yet. Click below to import your
              existing members from Whop.
            </p>
            <SyncButton companyId={company.id} />
          </div>
        )}

        {/* AI Insights */}
        <div className="mb-8">
          <DashboardInsights initialInsights={insights} companyId={companyId} />
        </div>

        {/* Charts Grid */}
        {allMembers.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <MemberGrowthChart members={allMembers} />
            <StatusDistributionChart members={allMembers} />
            <RevenueByPlanChart members={allMembers} />
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Avg. Revenue per Member</span>
                  <span className="font-semibold text-white">
                    $
                    {(
                      totalRevenue._sum.totalRevenue! / totalMembers || 0
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Active Rate</span>
                  <span className="font-semibold text-green-400">
                    {((activeMembers / totalMembers) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Members</span>
                  <span className="font-semibold text-white">{totalMembers}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Leaderboard */}
        {allMembers.length > 0 && (
          <div className="mb-8">
            <EngagementLeaderboard members={allMembers} />
          </div>
        )}

        <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-zinc-700">
            <h2 className="text-lg font-semibold text-white">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-zinc-700">
            {recentEvents.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-400">
                No activity yet
              </div>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-zinc-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {event.member.email}
                      </p>
                      <p className="text-sm text-zinc-400 capitalize">
                        {event.type.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-sm text-zinc-400">
                      {new Date(event.occurredAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <SyncButton companyId={company.id} />
          {company.lastSyncedAt && (
            <span className="text-sm text-zinc-400">
              Last synced: {new Date(company.lastSyncedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
