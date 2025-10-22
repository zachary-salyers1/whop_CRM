import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

const TEMPLATES = {
  active: {
    name: "Active Members",
    description: "All members with active subscriptions",
    filter: { status: "active" },
  },
  "at-risk": {
    name: "At Risk",
    description: "Members with past due payments",
    filter: { status: "past_due" },
  },
  "high-value": {
    name: "High Value",
    description: "Members with $200+ lifetime revenue",
    filter: { totalRevenue: { gte: 200 }, status: "active" },
  },
  churned: {
    name: "Churned",
    description: "Cancelled members",
    filter: { status: "cancelled" },
  },
  new: {
    name: "New Members",
    description: "Joined in the last 30 days",
    filter: {},
  },
};

export default async function TemplateSegmentPage({
  params,
}: {
  params: Promise<{ companyId: string; templateId: string }>;
}) {
  const { companyId, templateId } = await params;

  const template = TEMPLATES[templateId as keyof typeof TEMPLATES];
  if (!template) {
    return notFound();
  }

  const company = await prisma.company.findUnique({
    where: { whopCompanyId: companyId },
  });

  if (!company) {
    return notFound();
  }

  // Build filter for "new" members
  let filter: any = { companyId: company.id, ...template.filter };

  if (templateId === "new") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filter.firstJoinedAt = { gte: thirtyDaysAgo };
  }

  const members = await prisma.member.findMany({
    where: filter,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      totalRevenue: "desc",
    },
  });

  const totalRevenue = members.reduce((sum, m) => sum + m.totalRevenue, 0);
  const totalMRR = members.reduce((sum, m) => sum + m.monthlyRevenue, 0);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <h1 className="text-3xl font-bold text-white">{template.name}</h1>
              <p className="text-gray-400 mt-2">{template.description}</p>
            </div>
            <a
              href={`/api/segments/template/${templateId}/export?companyId=${companyId}`}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 border border-gray-700"
            >
              Export CSV
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400">Total Members</div>
            <div className="text-3xl font-bold text-white">{members.length}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400">Total Revenue</div>
            <div className="text-3xl font-bold text-white">
              ${totalRevenue.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-400">Total MRR</div>
            <div className="text-3xl font-bold text-white">
              ${totalMRR.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Members</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Tags
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No members in this segment
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {member.username || "No username"}
                        </div>
                        <div className="text-sm text-gray-400">{member.email}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        ${member.totalRevenue.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${member.monthlyRevenue.toFixed(2)}/mo
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/${companyId}/members/${member.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View →
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
