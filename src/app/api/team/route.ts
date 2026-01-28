import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { z } from "zod";
import { EmailService } from "@/services/email";

const InviteSchema = z.object({
  email: z.string().email(),
});

// GET /api/team - Get team members for user's organization
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can view team
    if (session.user.role === "USER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { organizationId: session.user.organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        organizationId: session.user.organizationId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        expiresAt: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users,
      pendingInvitations,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

// POST /api/team - Invite a new team member
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can invite
    if (session.user.role === "USER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = InviteSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: validatedData.email,
        organizationId: session.user.organizationId,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.invitation.create({
      data: {
        email: validatedData.email,
        token,
        organizationId: session.user.organizationId,
        createdById: session.user.id,
        expiresAt,
      },
    });

    // Send invitation email
    await EmailService.sendInvitation(
      validatedData.email,
      session.user.name,
      session.user.organizationName,
      token
    );

    return NextResponse.json(
      {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invitation:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

// DELETE /api/team - Remove a team member or cancel invitation
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can remove
    if (session.user.role === "USER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const invitationId = searchParams.get("invitationId");

    if (invitationId) {
      // Cancel invitation
      await prisma.invitation.delete({
        where: {
          id: invitationId,
          organizationId: session.user.organizationId,
        },
      });
    } else if (userId) {
      // Cannot remove yourself
      if (userId === session.user.id) {
        return NextResponse.json(
          { error: "Cannot remove yourself" },
          { status: 400 }
        );
      }

      // Verify user belongs to the same organization
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId: session.user.organizationId,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Delete user's notifications first
      await prisma.notification.deleteMany({
        where: { userId },
      });

      // Delete user's sent invitations
      await prisma.invitation.deleteMany({
        where: { createdById: userId },
      });

      // Delete user
      await prisma.user.delete({
        where: { id: userId },
      });
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
