import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AutomationBuilder from "./AutomationBuilder";

export default async function NewAutomationPage({
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

  // Get available tags for the tag actions
  const tags = await prisma.tag.findMany({
    where: { companyId: company.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Automation</h1>
        <AutomationBuilder
          companyId={company.id}
          whopCompanyId={companyId}
          tags={tags}
        />
      </div>
    </div>
  );
}
