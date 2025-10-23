"use client";

type Member = {
  id: string;
  status: string;
  totalRevenue: number;
  engagementScore: number | null;
  firstJoinedAt: Date | null;
  currentPlan: string | null;
};

export function MemberGrowthChart({ members }: { members: Member[] }) {
  // Group members by month
  const monthlyData = new Map<string, number>();

  members.forEach((member) => {
    if (!member.firstJoinedAt) return;
    const month = new Date(member.firstJoinedAt).toISOString().slice(0, 7);
    monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
  });

  const sortedMonths = Array.from(monthlyData.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const maxCount = Math.max(...sortedMonths.map(([, count]) => count));

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Member Growth Trend
      </h3>
      <div className="space-y-2">
        {sortedMonths.map(([month, count]) => {
          const percentage = (count / maxCount) * 100;
          return (
            <div key={month} className="flex items-center gap-3">
              <div className="w-20 text-sm text-zinc-400">
                {new Date(month + "-01").toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                })}
              </div>
              <div className="flex-1 h-8 bg-zinc-900 rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-sm font-medium text-white">
                    {count} member{count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatusDistributionChart({ members }: { members: Member[] }) {
  const statusCounts = members.reduce((acc, member) => {
    acc[member.status] = (acc[member.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = members.length;

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-green-600", text: "text-green-400" },
    cancelled: { bg: "bg-red-600", text: "text-red-400" },
    past_due: { bg: "bg-yellow-600", text: "text-yellow-400" },
    inactive: { bg: "bg-zinc-600", text: "text-zinc-400" },
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Member Status Distribution
      </h3>
      <div className="space-y-3">
        {Object.entries(statusCounts).map(([status, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          const colors = statusColors[status] || statusColors.inactive;
          return (
            <div key={status} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-300 capitalize">
                  {status.replace("_", " ")}
                </span>
                <span className={`text-sm font-semibold ${colors.text}`}>
                  {count} ({percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.bg} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RevenueByPlanChart({ members }: { members: Member[] }) {
  const planRevenue = members.reduce((acc, member) => {
    const plan = member.currentPlan || "No Plan";
    acc[plan] = (acc[plan] || 0) + member.totalRevenue;
    return acc;
  }, {} as Record<string, number>);

  const sortedPlans = Object.entries(planRevenue).sort((a, b) => b[1] - a[1]);
  const maxRevenue = Math.max(...sortedPlans.map(([, revenue]) => revenue));

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Revenue by Plan
      </h3>
      <div className="space-y-3">
        {sortedPlans.map(([plan, revenue]) => {
          const percentage = (revenue / maxRevenue) * 100;
          return (
            <div key={plan} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-300">
                  {plan}
                </span>
                <span className="text-sm font-semibold text-green-400">
                  ${revenue.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EngagementLeaderboard({ members }: { members: Member[] }) {
  const topEngaged = members
    .filter((m) => m.engagementScore !== null)
    .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
    .slice(0, 5);

  const bottomEngaged = members
    .filter((m) => m.engagementScore !== null && m.status === "active")
    .sort((a, b) => (a.engagementScore || 0) - (b.engagementScore || 0))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          🔥 Most Engaged Members
        </h3>
        <div className="space-y-3">
          {topEngaged.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="text-sm font-medium text-white">
                  Member #{member.id.slice(0, 8)}
                </div>
              </div>
              <div className="text-sm font-semibold text-green-400">
                {member.engagementScore}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          ⚠️ Least Engaged (Active)
        </h3>
        <div className="space-y-3">
          {bottomEngaged.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="text-sm font-medium text-white">
                  Member #{member.id.slice(0, 8)}
                </div>
              </div>
              <div className="text-sm font-semibold text-yellow-400">
                {member.engagementScore}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
