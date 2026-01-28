import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YouTrackService, CreateCommentSchema } from "@/services/youtrack";
import { NotificationService } from "@/services/notification";

// GET /api/tickets/[id]/comments - Get comments for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify user has access to this ticket
    const ticket = await YouTrackService.getTicket(id);
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    });

    if (!organization || ticket.client !== organization.youtrackClient) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch comments (only public ones)
    const comments = await YouTrackService.getComments(id);

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/comments - Add a comment to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = CreateCommentSchema.parse(body);

    // Verify user has access to this ticket
    const ticket = await YouTrackService.getTicket(id);
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    });

    if (!organization || ticket.client !== organization.youtrackClient) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Add comment to YouTrack
    const comment = await YouTrackService.addComment(id, validatedData.text);

    // Send notifications to other users in the organization
    await NotificationService.notifyOrganization(
      organization.id,
      "COMMENT_ADDED",
      ticket.idReadable,
      ticket.summary,
      `${session.user.name} added a comment`,
      session.user.id
    );

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
