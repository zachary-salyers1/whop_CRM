import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

type Filter = {
  field: string;
  operator: string;
  value: string;
};

function buildWhereClause(filters: Filter[]) {
  const conditions: any[] = [];

  for (const filter of filters) {
    const { field, operator, value } = filter;

    if (field === "status") {
      conditions.push({ status: value });
    } else if (field === "totalRevenue") {
      const numValue = parseFloat(value);
      if (operator === "gte") conditions.push({ totalRevenue: { gte: numValue } });
      else if (operator === "lte") conditions.push({ totalRevenue: { lte: numValue } });
      else if (operator === "eq") conditions.push({ totalRevenue: numValue });
    } else if (field === "monthlyRevenue") {
      const numValue = parseFloat(value);
      if (operator === "gte") conditions.push({ monthlyRevenue: { gte: numValue } });
      else if (operator === "lte") conditions.push({ monthlyRevenue: { lte: numValue } });
      else if (operator === "eq") conditions.push({ monthlyRevenue: numValue });
    } else if (field === "engagementScore") {
      const numValue = parseInt(value);
      if (operator === "gte") conditions.push({ engagementScore: { gte: numValue } });
      else if (operator === "lte") conditions.push({ engagementScore: { lte: numValue } });
      else if (operator === "eq") conditions.push({ engagementScore: numValue });
    } else if (field === "currentPlan") {
      if (operator === "equals") {
        conditions.push({ currentPlan: value });
      } else if (operator === "contains") {
        conditions.push({ currentPlan: { contains: value, mode: "insensitive" } });
      }
    }
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export default async function SegmentDetailPage({
  params,
}: {
  params: Promise<{ companyId: string; segmentId: string }>;
}) {
  const { companyId, segmentId } = await params;

  const company = await prisma.company.findFirst({
    where: { whopCompanyId: companyId },
  });

  if (!company) {
    notFound();
  }

  const segment = await prisma.segment.findUnique({
    where: { id: segmentId },
  });

  if (!segment || segment.companyId !== company.id) {
    notFound();
  }

  // Build where clause from saved filters
  const filters = segment.filters as Filter[];
  const whereClause = buildWhereClause(filters);

  const members = await prisma.member.findMany({
    where: {
      companyId: company.id,
      ...whereClause,
    },
    orderBy: { createdAt: "desc" },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "cancelled":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "past_due":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/${companyId}/segments`}
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Segments
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{segment.name}</h1>
              {segment.description && (
                <p className="text-gray-400">{segment.description}</p>
              )}
            </div>
            <div className="flex gap-3">
              <a
                href={`/api/segments/${segment.id}/export?companyId=${company.id}`}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 border border-gray-700"
              >
                Export CSV
              </a>
              <Link
                href={`/dashboard/${companyId}/segments/${segment.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Segment
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Members</h3>
            <p className="text-3xl font-bold text-white">{members.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Total MRR</h3>
            <p className="text-3xl font-bold text-white">
              ${members.reduce((sum, m) => sum + m.monthlyRevenue, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-white">
              ${members.reduce((sum, m) => sum + m.totalRevenue, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filters Applied */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Applied Filters</h2>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <div
                key={index}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
              >
                <span className="text-gray-300">{filter.field}</span>{" "}
                <span className="text-gray-500">{filter.operator}</span>{" "}
                <span className="text-white">{filter.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Members List */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Members in Segment</h2>
          </div>

          {members.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No members match this segment's criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      MRR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Engagement
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/${companyId}/members/${member.id}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {member.email}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {member.username || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            member.status
                          )}`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        ${member.monthlyRevenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        ${member.totalRevenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {member.engagementScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
