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
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Segments</h1>
              <p className="text-gray-400 mt-2">
                Group and analyze your members
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/${companyId}`}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 border border-gray-700"
              >
                ← Dashboard
              </Link>
              <Link
                href={`/dashboard/${companyId}/segments/new`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Create Segment
              </Link>
            </div>
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
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {segment.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      segment.color === "green"
                        ? "bg-green-900 text-green-200"
                        : segment.color === "yellow"
                        ? "bg-yellow-900 text-yellow-200"
                        : segment.color === "purple"
                        ? "bg-purple-900 text-purple-200"
                        : segment.color === "red"
                        ? "bg-red-900 text-red-200"
                        : "bg-blue-900 text-blue-200"
                    }`}
                  >
                    {segment.count}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{segment.description}</p>
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
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
              <p className="text-gray-400 mb-4">
                No custom segments yet. Create one to get started!
              </p>
              <Link
                href={`/dashboard/${companyId}/segments/new`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
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
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {segment.name}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-800 text-gray-300">
                      {segment.memberCount}
                    </span>
                  </div>
                  {segment.description && (
                    <p className="text-sm text-gray-400 mb-3">
                      {segment.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-500">
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
