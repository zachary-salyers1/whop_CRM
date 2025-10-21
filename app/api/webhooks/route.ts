import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

export async function POST(request: NextRequest): Promise<Response> {
	try {
		// Validate the webhook to ensure it's from Whop
		const webhookData = await validateWebhook(request);

		// Process webhook in background
		waitUntil(handleWebhook(webhookData));

		// Return 200 immediately to acknowledge receipt
		return new Response("OK", { status: 200 });
	} catch (error) {
		console.error("Webhook validation error:", error);
		return new Response("Invalid webhook", { status: 400 });
	}
}

async function handleWebhook(webhookData: any) {
	try {
		const { action, data } = webhookData;

		switch (action) {
			case "membership.went_valid":
				await handleMembershipCreated(data);
				break;

			case "membership.went_invalid":
				await handleMembershipCancelled(data);
				break;

			case "payment.succeeded":
				await handlePaymentSucceeded(data);
				break;

			case "payment.failed":
				await handlePaymentFailed(data);
				break;

			default:
				console.log(`Unhandled webhook action: ${action}`);
		}
	} catch (error) {
		console.error("Webhook handler error:", error);
	}
}

async function handleMembershipCreated(data: any) {
	const { id, user, plan, valid, quantity, renewal_period_start, renewal_period_end } = data;

	// Find company (we'll need to get this from the plan or membership data)
	// For now, we'll get the first company - in production you'd match by plan owner
	const company = await prisma.company.findFirst({
		where: { isActive: true },
	});

	if (!company) {
		console.error("No active company found for membership");
		return;
	}

	// Create or update member
	const member = await prisma.member.upsert({
		where: { whopUserId: user.id },
		update: {
			email: user.email || "",
			username: user.username,
			profilePicUrl: user.profile_pic_url,
			status: valid ? "active" : "inactive",
			currentPlan: plan?.name,
			planId: plan?.id,
			updatedAt: new Date(),
		},
		create: {
			whopUserId: user.id,
			email: user.email || "",
			username: user.username,
			profilePicUrl: user.profile_pic_url,
			companyId: company.id,
			status: valid ? "active" : "inactive",
			currentPlan: plan?.name,
			planId: plan?.id,
		},
	});

	// Create membership record
	await prisma.membership.upsert({
		where: { whopMembershipId: id },
		update: {
			status: valid ? "active" : "inactive",
			renewsAt: renewal_period_end ? new Date(renewal_period_end) : null,
			updatedAt: new Date(),
		},
		create: {
			whopMembershipId: id,
			memberId: member.id,
			planId: plan?.id || "",
			planName: plan?.name || "",
			status: valid ? "active" : "inactive",
			price: plan?.initial_price || 0,
			currency: "usd",
			interval: plan?.renewal_period || "month",
			startedAt: renewal_period_start ? new Date(renewal_period_start) : new Date(),
			renewsAt: renewal_period_end ? new Date(renewal_period_end) : null,
		},
	});

	// Create event
	await prisma.event.create({
		data: {
			type: "membership_created",
			memberId: member.id,
			data: data,
			occurredAt: new Date(),
		},
	});
}

async function handleMembershipCancelled(data: any) {
	const { id, user } = data;

	const member = await prisma.member.findUnique({
		where: { whopUserId: user.id },
	});

	if (!member) return;

	// Update member status
	await prisma.member.update({
		where: { id: member.id },
		data: {
			status: "cancelled",
			cancelledAt: new Date(),
		},
	});

	// Update membership
	await prisma.membership.update({
		where: { whopMembershipId: id },
		data: {
			status: "cancelled",
			cancelledAt: new Date(),
		},
	});

	// Create event
	await prisma.event.create({
		data: {
			type: "membership_cancelled",
			memberId: member.id,
			data: data,
			occurredAt: new Date(),
		},
	});
}

async function handlePaymentSucceeded(data: any) {
	const { user_id, final_amount, amount_after_fees, currency } = data;

	if (!user_id) return;

	const member = await prisma.member.findUnique({
		where: { whopUserId: user_id },
	});

	if (!member) return;

	// Update member revenue
	await prisma.member.update({
		where: { id: member.id },
		data: {
			totalRevenue: { increment: amount_after_fees || final_amount },
			lifetimeValue: { increment: amount_after_fees || final_amount },
		},
	});

	// Create event
	await prisma.event.create({
		data: {
			type: "payment_succeeded",
			memberId: member.id,
			data: data,
			occurredAt: new Date(),
		},
	});
}

async function handlePaymentFailed(data: any) {
	const { user_id } = data;

	if (!user_id) return;

	const member = await prisma.member.findUnique({
		where: { whopUserId: user_id },
	});

	if (!member) return;

	// Update member status
	await prisma.member.update({
		where: { id: member.id },
		data: {
			status: "past_due",
		},
	});

	// Create event
	await prisma.event.create({
		data: {
			type: "payment_failed",
			memberId: member.id,
			data: data,
			occurredAt: new Date(),
		},
	});
}
