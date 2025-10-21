import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { tagId, companyId } = await request.json();

    if (!tagId || !companyId) {
      return NextResponse.json(
        { error: "Tag ID and company ID are required" },
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

    // Verify tag exists and belongs to company
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        companyId,
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }

    // Check if already tagged
    const existing = await prisma.memberTag.findUnique({
      where: {
        tagId_memberId: {
          tagId,
          memberId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Member already has this tag" },
        { status: 400 }
      );
    }

    const memberTag = await prisma.memberTag.create({
      data: {
        tagId,
        memberId,
      },
      include: {
        tag: true,
      },
    });

    return NextResponse.json(memberTag);
  } catch (error) {
    console.error("Error adding tag:", error);
    return NextResponse.json(
      { error: "Failed to add tag" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 }
      );
    }

    // Find and delete the member tag
    const memberTag = await prisma.memberTag.findUnique({
      where: {
        tagId_memberId: {
          tagId,
          memberId,
        },
      },
    });

    if (!memberTag) {
      return NextResponse.json(
        { error: "Tag not found on member" },
        { status: 404 }
      );
    }

    await prisma.memberTag.delete({
      where: {
        tagId_memberId: {
          tagId,
          memberId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing tag:", error);
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    );
  }
}
