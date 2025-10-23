import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface CohortData {
  month: string;
  newMembers: number;
  retention30: number;
  retention60: number;
  retention90: number;
  retention180: number;
  retention365: number;
}

export default async function AnalyticsPage({
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

  // Get all members
  const members = await prisma.member.findMany({
    where: { companyId: company.id },
    orderBy: { firstJoinedAt: "asc" },
  });

  // Group members by cohort (month joined)
  const cohorts = new Map<string, typeof members>();

  members.forEach((member) => {
    if (!member.firstJoinedAt) return;

    const cohortMonth = new Date(member.firstJoinedAt);
    cohortMonth.setDate(1); // Normalize to first of month
    const cohortKey = cohortMonth.toISOString().slice(0, 7); // YYYY-MM

    if (!cohorts.has(cohortKey)) {
      cohorts.set(cohortKey, []);
    }
    cohorts.get(cohortKey)!.push(member);
  });

  // Generate continuous timeline from earliest to latest month
  const now = new Date();
  const allMonths: string[] = [];

  if (members.length > 0 && members[0]?.firstJoinedAt) {
    const earliestDate = new Date(members[0].firstJoinedAt);
    earliestDate.setDate(1); // Normalize to first of month

    const currentMonth = new Date(now);
    currentMonth.setDate(1);

    // Generate all months from earliest to current
    const month = new Date(earliestDate);
    while (month <= currentMonth) {
      allMonths.push(month.toISOString().slice(0, 7));
      month.setMonth(month.getMonth() + 1);
    }
  }

  // Calculate retention for each cohort
  const cohortData: CohortData[] = [];

  allMonths
    .sort((a, b) => b.localeCompare(a)) // Sort newest first
    .forEach((cohortMonth) => {
      const cohortMembers = cohorts.get(cohortMonth) || [];
      const cohortStart = new Date(cohortMonth + "-01");

      // Calculate how many are still active after X days
      const calculateRetention = (days: number) => {
        const targetDate = new Date(cohortStart);
        targetDate.setDate(targetDate.getDate() + days);

        // Can't calculate future retention
        if (targetDate > now) return null;

        const activeAfterDays = cohortMembers.filter((member) => {
          // Member must have joined before or on target date
          if (new Date(member.firstJoinedAt) > targetDate) return false;

          // If cancelled, check if they were still active at target date
          if (member.cancelledAt) {
            return new Date(member.cancelledAt) > targetDate;
          }

          // If still active, they count
          return member.status === "active" || member.status === "past_due";
        }).length;

        return cohortMembers.length > 0
          ? Math.round((activeAfterDays / cohortMembers.length) * 100)
          : 0;
      };

      cohortData.push({
        month: cohortMonth,
        newMembers: cohortMembers.length,
        retention30: calculateRetention(30) ?? -1,
        retention60: calculateRetention(60) ?? -1,
        retention90: calculateRetention(90) ?? -1,
        retention180: calculateRetention(180) ?? -1,
        retention365: calculateRetention(365) ?? -1,
      });
    });

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
                className="bg-zinc-800 border-t border-x border-zinc-700 pb-3 pt-3 px-6 text-white font-medium rounded-t-lg"
              >
                Analytics
              </Link>
            </nav>
          </div>
        </div>

        {/* Cohort Retention Analysis */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Cohort Retention Analysis
          </h2>
          <p className="text-zinc-400 mb-6">
            Track how well you retain members over time, grouped by their signup
            month.
          </p>

          {cohortData.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              No cohort data available yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                      Cohort Month
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                      New Members
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                      30 Days
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                      60 Days
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                      90 Days
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                      180 Days
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                      365 Days
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700">
                  {cohortData.map((cohort) => (
                    <tr key={cohort.month} className="hover:bg-zinc-750">
                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {new Date(cohort.month + "-01").toLocaleDateString(
                          "en-US",
                          { month: "short", year: "numeric" }
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-300">
                        {cohort.newMembers}
                      </td>
                      <RetentionCell value={cohort.retention30} />
                      <RetentionCell value={cohort.retention60} />
                      <RetentionCell value={cohort.retention90} />
                      <RetentionCell value={cohort.retention180} />
                      <RetentionCell value={cohort.retention365} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
            <h3 className="text-sm font-medium text-white mb-2">
              How to read this table:
            </h3>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li>
                • Each row represents members who joined in that specific month
              </li>
              <li>
                • Retention % shows how many of those members are still active
                after X days
              </li>
              <li>• Green = strong retention (≥70%), Yellow = moderate (40-69%), Red = poor (&lt;40%)</li>
              <li>• Gray cells indicate the cohort hasn't reached that age yet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function RetentionCell({ value }: { value: number }) {
  if (value === -1) {
    return (
      <td className="px-4 py-4 text-center text-sm text-zinc-600">—</td>
    );
  }

  // Use complete class strings for Tailwind JIT to detect
  if (value >= 70) {
    return (
      <td className="px-4 py-4 text-center">
        <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full border bg-green-950/50 text-green-400 border-green-800">
          {value}%
        </span>
      </td>
    );
  }

  if (value >= 40) {
    return (
      <td className="px-4 py-4 text-center">
        <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full border bg-yellow-950/50 text-yellow-400 border-yellow-800">
          {value}%
        </span>
      </td>
    );
  }

  return (
    <td className="px-4 py-4 text-center">
      <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full border bg-red-950/50 text-red-400 border-red-800">
        {value}%
      </span>
    </td>
  );
}
