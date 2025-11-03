import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/prospects/[prospectId] - Get a single prospect
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ prospectId: string }> }
) {
	try {
		const { prospectId } = await params;

		const prospect = await prisma.prospect.findUnique({
			where: { id: prospectId },
			include: {
				conversations: {
					include: {
						messages: {
							orderBy: { sentAt: "asc" },
						},
					},
					orderBy: { lastMessageAt: "desc" },
				},
				followUpReminders: {
					orderBy: { dueAt: "asc" },
				},
			},
		});

		if (!prospect) {
			return NextResponse.json(
				{ error: "Prospect not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(prospect);
	} catch (error) {
		console.error("Error fetching prospect:", error);
		return NextResponse.json(
			{ error: "Failed to fetch prospect" },
			{ status: 500 }
		);
	}
}

// PUT /api/prospects/[prospectId] - Update a prospect
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ prospectId: string }> }
) {
	try {
		const { prospectId } = await params;
		const body = await request.json();

		const prospect = await prisma.prospect.update({
			where: { id: prospectId },
			data: {
				...body,
				updatedAt: new Date(),
			},
			include: {
				conversations: true,
				followUpReminders: true,
			},
		});

		return NextResponse.json(prospect);
	} catch (error) {
		console.error("Error updating prospect:", error);
		return NextResponse.json(
			{ error: "Failed to update prospect" },
			{ status: 500 }
		);
	}
}

// DELETE /api/prospects/[prospectId] - Delete a prospect
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ prospectId: string }> }
) {
	try {
		const { prospectId } = await params;

		await prisma.prospect.delete({
			where: { id: prospectId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting prospect:", error);
		return NextResponse.json(
			{ error: "Failed to delete prospect" },
			{ status: 500 }
		);
	}
}
