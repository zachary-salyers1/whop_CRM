-- CreateTable
CREATE TABLE "DashboardInsight" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metric" TEXT,
    "actionable" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DashboardInsight_companyId_isActive_idx" ON "DashboardInsight"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "DashboardInsight_generatedAt_idx" ON "DashboardInsight"("generatedAt");

-- AddForeignKey
ALTER TABLE "DashboardInsight" ADD CONSTRAINT "DashboardInsight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
