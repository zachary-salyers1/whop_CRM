import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SegmentsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  const company = await prisma.company.findUnique({
    where: { whopCompanyId: companyId },
  });

  if (!company) {
    return <div>Company not found</div>;
  }

  // Get all segments for this company
  const customSegments = await prisma.segment.findMany({
    where: {
      companyId: company.id,
      isTemplate: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate pre-built segment counts
  const activeMembers = await prisma.member.count({
    where: {
      companyId: company.id,
      status: "active",
    },
  });

  const atRiskMembers = await prisma.member.count({
    where: {
      companyId: company.id,
      status: "past_due",
    },
  });

  const highValueMembers = await prisma.member.count({
    where: {
      companyId: company.id,
      totalRevenue: { gte: 200 },
      status: "active",
    },
  });

  const churnedMembers = await prisma.member.count({
    where: {
      companyId: company.id,
      status: "cancelled",
    },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newMembers = await prisma.member.count({
    where: {
      companyId: company.id,
      firstJoinedAt: { gte: thirtyDaysAgo },
    },
  });

  const preBuiltSegments = [
    {
      id: "active",
      name: "Active Members",
      description: "All members with active subscriptions",
      count: activeMembers,
      color: "green",
    },
    {
      id: "at-risk",
      name: "At Risk",
      description: "Members with past due payments",
      count: atRiskMembers,
      color: "yellow",
    },
    {
      id: "high-value",
      name: "High Value",
      description: "Members with $200+ lifetime revenue",
      count: highValueMembers,
      color: "purple",
    },
    {
      id: "churned",
      name: "Churned",
      description: "Cancelled members",
      count: churnedMembers,
      color: "red",
    },
    {
      id: "new",
      name: "New Members",
      description: "Joined in the last 30 days",
      count: newMembers,
      color: "blue",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <Link
              href={`/dashboard/${companyId}/segments/new`}
              className="bg-zinc-800 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 border border-zinc-700"
            >
              + Create Segment
            </Link>
          </div>

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
                className="pb-3 pt-3 px-6 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Members
              </Link>
              <Link
                href={`/dashboard/${companyId}/segments`}
                className="bg-zinc-800 border-t border-x border-zinc-700 pb-3 pt-3 px-6 text-white font-medium rounded-t-lg"
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

        {/* Pre-built Segments */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Pre-built Segments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preBuiltSegments.map((segment) => (
              <Link
                key={segment.id}
                href={`/dashboard/${companyId}/segments/template/${segment.id}`}
                className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 hover:bg-zinc-700 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {segment.name}
                  </h3>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-zinc-700 text-white">
                    {segment.count}
                  </span>
                </div>
                <p className="text-sm text-zinc-400">{segment.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Custom Segments */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Custom Segments
          </h2>
          {customSegments.length === 0 ? (
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-12 text-center">
              <p className="text-zinc-400 mb-4">
                No custom segments yet. Create one to get started!
              </p>
              <Link
                href={`/dashboard/${companyId}/segments/new`}
                className="inline-block bg-zinc-700 text-white px-6 py-3 rounded-xl hover:bg-zinc-600"
              >
                Create Your First Segment
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customSegments.map((segment) => (
                <Link
                  key={segment.id}
                  href={`/dashboard/${companyId}/segments/${segment.id}`}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 hover:bg-zinc-700 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      {segment.name}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-zinc-700 text-white">
                      {segment.memberCount}
                    </span>
                  </div>
                  {segment.description && (
                    <p className="text-sm text-zinc-400 mb-3">
                      {segment.description}
                    </p>
                  )}
                  <div className="text-sm text-zinc-400">
                    Total MRR: ${segment.totalMrr.toFixed(2)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
