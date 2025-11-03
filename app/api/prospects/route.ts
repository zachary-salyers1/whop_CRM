import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/prospects - Get all prospects for a company
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const companyId = searchParams.get("companyId");
		const status = searchParams.get("status");
		const priority = searchParams.get("priority");
		const search = searchParams.get("search");

		if (!companyId) {
			return NextResponse.json(
				{ error: "companyId is required" },
				{ status: 400 }
			);
		}

		// Build where clause
		const where: any = { companyId };

		if (status) {
			where.status = status;
		}

		if (priority) {
			where.priority = priority;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
				{ communityName: { contains: search, mode: "insensitive" } },
			];
		}

		const prospects = await prisma.prospect.findMany({
			where,
			include: {
				conversations: {
					orderBy: { lastMessageAt: "desc" },
					take: 1,
				},
				followUpReminders: {
					where: { status: "pending" },
					orderBy: { dueAt: "asc" },
					take: 1,
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(prospects);
	} catch (error) {
		console.error("Error fetching prospects:", error);
		return NextResponse.json(
			{ error: "Failed to fetch prospects" },
			{ status: 500 }
		);
	}
}

// POST /api/prospects - Create a new prospect
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			companyId,
			name,
			email,
			whopUserId,
			profilePicUrl,
			communityName,
			communitySize,
			platform,
			niche,
			status,
			priority,
			whopDmUrl,
			discordHandle,
			twitterHandle,
			notes,
			tags,
			metadata,
		} = body;

		if (!companyId || !name) {
			return NextResponse.json(
				{ error: "companyId and name are required" },
				{ status: 400 }
			);
		}

		const prospect = await prisma.prospect.create({
			data: {
				companyId,
				name,
				email,
				whopUserId,
				profilePicUrl,
				communityName,
				communitySize,
				platform,
				niche,
				status: status || "new",
				priority: priority || "medium",
				whopDmUrl,
				discordHandle,
				twitterHandle,
				notes,
				tags: tags || [],
				metadata,
			},
			include: {
				conversations: true,
				followUpReminders: true,
			},
		});

		return NextResponse.json(prospect, { status: 201 });
	} catch (error) {
		console.error("Error creating prospect:", error);
		return NextResponse.json(
			{ error: "Failed to create prospect" },
			{ status: 500 }
		);
	}
}
