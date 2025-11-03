import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/conversations/[conversationId] - Get a single conversation
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	try {
		const { conversationId } = await params;

		const conversation = await prisma.conversation.findUnique({
			where: { id: conversationId },
			include: {
				prospect: true,
				messages: {
					orderBy: { sentAt: "asc" },
				},
			},
		});

		if (!conversation) {
			return NextResponse.json(
				{ error: "Conversation not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(conversation);
	} catch (error) {
		console.error("Error fetching conversation:", error);
		return NextResponse.json(
			{ error: "Failed to fetch conversation" },
			{ status: 500 }
		);
	}
}

// PUT /api/conversations/[conversationId] - Update a conversation
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	try {
		const { conversationId } = await params;
		const body = await request.json();

		const conversation = await prisma.conversation.update({
			where: { id: conversationId },
			data: {
				...body,
				updatedAt: new Date(),
			},
			include: {
				prospect: true,
				messages: true,
			},
		});

		return NextResponse.json(conversation);
	} catch (error) {
		console.error("Error updating conversation:", error);
		return NextResponse.json(
			{ error: "Failed to update conversation" },
			{ status: 500 }
		);
	}
}

// DELETE /api/conversations/[conversationId] - Delete a conversation
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	try {
		const { conversationId } = await params;

		await prisma.conversation.delete({
			where: { id: conversationId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting conversation:", error);
		return NextResponse.json(
			{ error: "Failed to delete conversation" },
			{ status: 500 }
		);
	}
}
