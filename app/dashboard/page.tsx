import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  // Get company stats
  const company = await prisma.company.findFirst({
    where: { isActive: true },
  });

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No Active Installation
          </h1>
          <p className="text-gray-600 mb-6">
            Please install the app first to access the dashboard.
          </p>
          <a
            href="/api/auth/install"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Install App
          </a>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to Whop CRM - {company.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Members
            </h3>
            <p className="text-3xl font-bold text-gray-900">{totalMembers}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Active Members
            </h3>
            <p className="text-3xl font-bold text-green-600">{activeMembers}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Revenue
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              ${(totalRevenue._sum.totalRevenue || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">MRR</h3>
            <p className="text-3xl font-bold text-gray-900">
              ${(totalRevenue._sum.monthlyRevenue || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Sync Button */}
        {!company.lastSyncedAt && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Initial Sync Required
            </h3>
            <p className="text-sm text-yellow-700 mb-4">
              You haven't synced your member data yet. Click below to import your
              existing members from Whop.
            </p>
            <button
              onClick={async () => {
                const response = await fetch("/api/sync", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ companyId: company.id }),
                });
                if (response.ok) {
                  window.location.reload();
                }
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Sync Members Now
            </button>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentEvents.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No activity yet
              </div>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.member.email}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {event.type.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.occurredAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Last Synced */}
        {company.lastSyncedAt && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Last synced: {new Date(company.lastSyncedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
