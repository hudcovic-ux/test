import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YouTrackService, UpdateTicketSchema } from "@/services/youtrack";
import { NotificationService } from "@/services/notification";

// GET /api/tickets/[id] - Get a single ticket
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

    // Fetch ticket from YouTrack
    const ticket = await YouTrackService.getTicket(id);

    // Get user's organization to verify access
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    });

    if (!organization || ticket.client !== organization.youtrackClient) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// PATCH /api/tickets/[id] - Update a ticket
export async function PATCH(
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
    const validatedData = UpdateTicketSchema.parse(body);

    // Get current ticket to verify access and track changes
    const currentTicket = await YouTrackService.getTicket(id);

    // Get user's organization to verify access
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        fieldConfigs: true,
      },
    });

    if (!organization || currentTicket.client !== organization.youtrackClient) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user has permission to edit fields
    const editableFields = organization.fieldConfigs
      .filter((fc) => fc.editable)
      .map((fc) => fc.fieldName);

    // Validate that user can edit the requested fields
    for (const field of Object.keys(validatedData)) {
      if (validatedData[field as keyof typeof validatedData] !== undefined) {
        if (!editableFields.includes(field) && field !== "summary" && field !== "description") {
          return NextResponse.json(
            { error: `You don't have permission to edit ${field}` },
            { status: 403 }
          );
        }
      }
    }

    // Update ticket in YouTrack
    const updatedTicket = await YouTrackService.updateTicket(id, validatedData);

    // Send notifications for state change
    if (validatedData.state && validatedData.state !== currentTicket.state) {
      await NotificationService.notifyOrganization(
        organization.id,
        "STATE_CHANGED",
        updatedTicket.idReadable,
        updatedTicket.summary,
        `State changed from ${currentTicket.state} to ${validatedData.state}`,
        session.user.id
      );
    }

    // Send notifications for assignee change
    if (validatedData.assignee && validatedData.assignee !== currentTicket.assignee?.id) {
      const newAssignee = updatedTicket.assignee?.name || "Unassigned";
      await NotificationService.notifyOrganization(
        organization.id,
        "ASSIGNEE_CHANGED",
        updatedTicket.idReadable,
        updatedTicket.summary,
        `Ticket assigned to ${newAssignee}`,
        session.user.id
      );
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
