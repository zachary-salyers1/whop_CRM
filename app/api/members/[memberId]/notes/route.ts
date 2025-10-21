import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { content, companyId } = await request.json();

    if (!content || !companyId) {
      return NextResponse.json(
        { error: "Content and company ID are required" },
        { status: 400 }
      );
    }

    // Verify member exists and belongs to company
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        companyId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    const note = await prisma.note.create({
      data: {
        content,
        memberId,
        companyId,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
