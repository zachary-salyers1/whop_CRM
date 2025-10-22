import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditSegmentForm from "./EditSegmentForm";

export default async function EditSegmentPage({
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

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Segment</h1>
        <EditSegmentForm
          segment={segment}
          companyId={company.id}
          whopCompanyId={companyId}
          segmentId={segmentId}
        />
      </div>
    </div>
  );
}
