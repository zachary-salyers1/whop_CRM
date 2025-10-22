import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import AutomationToggle from "./AutomationToggle";

export default async function AutomationsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  const company = await prisma.company.findFirst({
    where: { whopCompanyId: companyId },
  });

  if (!company) {
    notFound();
  }

  const automations = await prisma.automation.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Automations</h1>
              <p className="text-gray-400 mt-2">
                Automate actions based on member behavior
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
                href={`/dashboard/${companyId}/automations/new`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Create Automation
              </Link>
            </div>
          </div>
        </div>

        {/* Automations List */}
        {automations.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No automations yet</h2>
            <p className="text-gray-400 mb-6">
              Create your first automation to automatically manage your members
            </p>
            <Link
              href={`/dashboard/${companyId}/automations/new`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Create Your First Automation
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {automations.map((automation) => {
              const trigger = automation.trigger as any;
              const actions = automation.actions as any[];

              return (
                <div
                  key={automation.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {automation.name}
                        </h3>
                        <AutomationToggle
                          automationId={automation.id}
                          companyId={company.id}
                          initialActive={automation.isActive}
                        />
                      </div>
                      {automation.description && (
                        <p className="text-sm text-gray-400 mb-4">
                          {automation.description}
                        </p>
                      )}

                      {/* Trigger and Actions Preview */}
                      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                        <div>
                          <span className="text-xs font-medium text-blue-400 uppercase">
                            When
                          </span>
                          <p className="text-sm text-gray-300 mt-1">
                            {trigger.type === "membership_cancelled" &&
                              "Member cancels subscription"}
                            {trigger.type === "membership_created" &&
                              "New member joins"}
                            {trigger.type === "payment_succeeded" &&
                              "Payment succeeds"}
                            {trigger.type === "payment_failed" &&
                              "Payment fails"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-green-400 uppercase">
                            Then
                          </span>
                          <ul className="text-sm text-gray-300 mt-1 space-y-1">
                            {actions.map((action: any, idx: number) => (
                              <li key={idx}>
                                • {action.type === "add_tag" && `Add tag "${action.tagName}"`}
                                {action.type === "remove_tag" && `Remove tag "${action.tagName}"`}
                                {action.type === "add_note" && `Add note: "${action.content}"`}
                                {action.type === "update_field" &&
                                  `Update ${action.field} to ${action.value}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/dashboard/${companyId}/automations/${automation.id}/edit`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-400 pt-4 border-t border-gray-800">
                    <div>
                      <span className="font-medium">Runs:</span> {automation.runCount}
                    </div>
                    {automation.lastRunAt && (
                      <div>
                        <span className="font-medium">Last run:</span>{" "}
                        {new Date(automation.lastRunAt).toLocaleDateString()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(automation.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
