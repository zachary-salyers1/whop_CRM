import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SegmentBuilder } from "./SegmentBuilder";

export default async function NewSegmentPage({
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

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/${companyId}/segments`}
            className="text-white hover:text-zinc-300 mb-4 inline-block"
          >
            ← Back to Segments
          </Link>
          <h1 className="text-3xl font-bold text-white">Create Custom Segment</h1>
          <p className="text-zinc-400 mt-2">
            Build a custom segment with your own filters
          </p>
        </div>

        <SegmentBuilder companyId={company.id} whopCompanyId={companyId} />
      </div>
    </div>
  );
}
