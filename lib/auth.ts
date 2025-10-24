/**
 * Authentication and authorization utilities for Whop CRM
 *
 * This app uses a single-company-per-deployment model where each Whop community
 * gets their own deployment with a configured NEXT_PUBLIC_WHOP_COMPANY_ID.
 */

import { prisma } from "@/lib/prisma";

/**
 * Get the configured company ID from environment variables
 */
export function getConfiguredCompanyId(): string {
  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

  if (!companyId) {
    throw new Error("NEXT_PUBLIC_WHOP_COMPANY_ID is not configured");
  }

  return companyId;
}

/**
 * Validates that a requested company ID matches the configured company
 *
 * @param requestedCompanyId - The company ID from the request (can be whopCompanyId or internal ID)
 * @param allowInternalId - If true, accepts both whopCompanyId and internal DB id
 * @returns The company object if valid
 * @throws Error if company doesn't match or doesn't exist
 */
export async function validateCompanyAccess(
  requestedCompanyId: string,
  allowInternalId: boolean = true
): Promise<{ id: string; whopCompanyId: string; name: string }> {
  const configuredWhopCompanyId = getConfiguredCompanyId();

  // Try to find company by whopCompanyId first
  let company = await prisma.company.findUnique({
    where: { whopCompanyId: configuredWhopCompanyId },
    select: {
      id: true,
      whopCompanyId: true,
      name: true,
    },
  });

  if (!company) {
    throw new Error(
      `Configured company ${configuredWhopCompanyId} not found in database. Please run initialization.`
    );
  }

  // Validate the requested ID matches either the whopCompanyId or internal id
  const isWhopId = requestedCompanyId === company.whopCompanyId;
  const isInternalId = allowInternalId && requestedCompanyId === company.id;

  if (!isWhopId && !isInternalId) {
    throw new Error(
      `Access denied: Requested company ${requestedCompanyId} does not match configured company ${company.whopCompanyId}`
    );
  }

  return company;
}

/**
 * Validates webhook company ID matches the configured company
 *
 * @param webhookCompanyId - The company_id from webhook payload
 * @throws Error if company doesn't match configured company
 */
export async function validateWebhookCompany(
  webhookCompanyId: string
): Promise<{ id: string; whopCompanyId: string }> {
  const configuredWhopCompanyId = getConfiguredCompanyId();

  // Verify the webhook is for our configured company
  if (webhookCompanyId !== configuredWhopCompanyId) {
    throw new Error(
      `Webhook company ${webhookCompanyId} does not match configured company ${configuredWhopCompanyId}`
    );
  }

  // Find or create the company
  const company = await prisma.company.upsert({
    where: { whopCompanyId: webhookCompanyId },
    update: {
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      whopCompanyId: webhookCompanyId,
      name: "Whop Company", // Will be updated on first sync
      isActive: true,
    },
    select: {
      id: true,
      whopCompanyId: true,
    },
  });

  return company;
}
