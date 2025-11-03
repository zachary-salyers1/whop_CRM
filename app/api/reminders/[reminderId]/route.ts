import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reminders/[reminderId] - Get a single reminder
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ reminderId: string }> }
) {
	try {
		const { reminderId } = await params;

		const reminder = await prisma.followUpReminder.findUnique({
			where: { id: reminderId },
			include: {
				prospect: true,
			},
		});

		if (!reminder) {
			return NextResponse.json(
				{ error: "Reminder not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(reminder);
	} catch (error) {
		console.error("Error fetching reminder:", error);
		return NextResponse.json(
			{ error: "Failed to fetch reminder" },
			{ status: 500 }
		);
	}
}

// PUT /api/reminders/[reminderId] - Update a reminder
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ reminderId: string }> }
) {
	try {
		const { reminderId } = await params;
		const body = await request.json();

		const reminder = await prisma.followUpReminder.update({
			where: { id: reminderId },
			data: {
				...body,
				updatedAt: new Date(),
			},
			include: {
				prospect: true,
			},
		});

		return NextResponse.json(reminder);
	} catch (error) {
		console.error("Error updating reminder:", error);
		return NextResponse.json(
			{ error: "Failed to update reminder" },
			{ status: 500 }
		);
	}
}

// DELETE /api/reminders/[reminderId] - Delete a reminder
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ reminderId: string }> }
) {
	try {
		const { reminderId } = await params;

		await prisma.followUpReminder.delete({
			where: { id: reminderId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting reminder:", error);
		return NextResponse.json(
			{ error: "Failed to delete reminder" },
			{ status: 500 }
		);
	}
}
