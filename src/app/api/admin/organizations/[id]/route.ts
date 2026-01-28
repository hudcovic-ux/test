import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  youtrackClient: z.string().min(1).optional(),
});

// GET /api/admin/organizations/[id] - Get a single organization (SUPER_ADMIN only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        fieldConfigs: {
          orderBy: { displayOrder: "asc" },
        },
        invitations: {
          where: {
            expiresAt: { gt: new Date() },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/organizations/[id] - Update an organization (SUPER_ADMIN only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateOrganizationSchema.parse(body);

    // Check if youtrackClient already exists (if changing)
    if (validatedData.youtrackClient) {
      const existing = await prisma.organization.findFirst({
        where: {
          youtrackClient: validatedData.youtrackClient,
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Organization with this YouTrack client already exists" },
          { status: 400 }
        );
      }
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: validatedData,
      include: {
        fieldConfigs: true,
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error updating organization:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/organizations/[id] - Delete an organization (SUPER_ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;

    // Check if organization has users
    const userCount = await prisma.user.count({
      where: { organizationId: id },
    });

    if (userCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete organization with users. Remove all users first." },
        { status: 400 }
      );
    }

    // Delete field configs first
    await prisma.fieldConfig.deleteMany({
      where: { organizationId: id },
    });

    // Delete invitations
    await prisma.invitation.deleteMany({
      where: { organizationId: id },
    });

    // Delete organization
    await prisma.organization.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}
