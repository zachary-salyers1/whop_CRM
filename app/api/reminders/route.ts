import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reminders - Get all reminders
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const companyId = searchParams.get("companyId");
		const prospectId = searchParams.get("prospectId");
		const status = searchParams.get("status");
		const upcoming = searchParams.get("upcoming"); // Get upcoming reminders (due soon)

		if (!companyId) {
			return NextResponse.json(
				{ error: "companyId is required" },
				{ status: 400 }
			);
		}

		// Build where clause
		const where: any = { companyId };

		if (prospectId) {
			where.prospectId = prospectId;
		}

		if (status) {
			where.status = status;
		}

		if (upcoming === "true") {
			// Get reminders due in the next 7 days
			const now = new Date();
			const nextWeek = new Date();
			nextWeek.setDate(nextWeek.getDate() + 7);

			where.status = "pending";
			where.dueAt = {
				gte: now,
				lte: nextWeek,
			};
		}

		const reminders = await prisma.followUpReminder.findMany({
			where,
			include: {
				prospect: true,
			},
			orderBy: { dueAt: "asc" },
		});

		return NextResponse.json(reminders);
	} catch (error) {
		console.error("Error fetching reminders:", error);
		return NextResponse.json(
			{ error: "Failed to fetch reminders" },
			{ status: 500 }
		);
	}
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { prospectId, companyId, title, description, dueAt } = body;

		if (!prospectId || !companyId || !title || !dueAt) {
			return NextResponse.json(
				{ error: "prospectId, companyId, title, and dueAt are required" },
				{ status: 400 }
			);
		}

		const reminder = await prisma.followUpReminder.create({
			data: {
				prospectId,
				companyId,
				title,
				description,
				dueAt: new Date(dueAt),
			},
			include: {
				prospect: true,
			},
		});

		return NextResponse.json(reminder, { status: 201 });
	} catch (error) {
		console.error("Error creating reminder:", error);
		return NextResponse.json(
			{ error: "Failed to create reminder" },
			{ status: 500 }
		);
	}
}
