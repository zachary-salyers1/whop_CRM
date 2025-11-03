import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/conversations - Get all conversations
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const companyId = searchParams.get("companyId");
		const prospectId = searchParams.get("prospectId");
		const status = searchParams.get("status");

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

		const conversations = await prisma.conversation.findMany({
			where,
			include: {
				prospect: true,
				messages: {
					orderBy: { sentAt: "desc" },
					take: 5,
				},
			},
			orderBy: { lastMessageAt: "desc" },
		});

		return NextResponse.json(conversations);
	} catch (error) {
		console.error("Error fetching conversations:", error);
		return NextResponse.json(
			{ error: "Failed to fetch conversations" },
			{ status: 500 }
		);
	}
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { prospectId, companyId, title, status } = body;

		if (!prospectId || !companyId || !title) {
			return NextResponse.json(
				{ error: "prospectId, companyId, and title are required" },
				{ status: 400 }
			);
		}

		const conversation = await prisma.conversation.create({
			data: {
				prospectId,
				companyId,
				title,
				status: status || "open",
			},
			include: {
				prospect: true,
				messages: true,
			},
		});

		return NextResponse.json(conversation, { status: 201 });
	} catch (error) {
		console.error("Error creating conversation:", error);
		return NextResponse.json(
			{ error: "Failed to create conversation" },
			{ status: 500 }
		);
	}
}
