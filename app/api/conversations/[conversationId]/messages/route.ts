import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/conversations/[conversationId]/messages - Get all messages in a conversation
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	try {
		const { conversationId } = await params;

		const messages = await prisma.conversationMessage.findMany({
			where: { conversationId },
			orderBy: { sentAt: "asc" },
		});

		return NextResponse.json(messages);
	} catch (error) {
		console.error("Error fetching messages:", error);
		return NextResponse.json(
			{ error: "Failed to fetch messages" },
			{ status: 500 }
		);
	}
}

// POST /api/conversations/[conversationId]/messages - Add a message to a conversation
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	try {
		const { conversationId } = await params;
		const body = await request.json();
		const { content, sender, senderName, metadata } = body;

		if (!content || !sender) {
			return NextResponse.json(
				{ error: "content and sender are required" },
				{ status: 400 }
			);
		}

		// Create the message
		const message = await prisma.conversationMessage.create({
			data: {
				conversationId,
				content,
				sender,
				senderName,
				metadata,
			},
		});

		// Update conversation stats
		await prisma.conversation.update({
			where: { id: conversationId },
			data: {
				lastMessage: content.substring(0, 100),
				lastMessageAt: new Date(),
				messageCount: { increment: 1 },
			},
		});

		return NextResponse.json(message, { status: 201 });
	} catch (error) {
		console.error("Error creating message:", error);
		return NextResponse.json(
			{ error: "Failed to create message" },
			{ status: 500 }
		);
	}
}
