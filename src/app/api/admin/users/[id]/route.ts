import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const UpdateUserSchema = z.object({
  email: z.string().email("Neplatný email").optional(),
  name: z.string().min(1, "Jméno je povinné").optional(),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků").optional(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  organizationId: z.string().optional(),
});

// GET /api/admin/users/[id] - Get a single user
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
        notifyEmail: true,
        notifyInApp: true,
        notifyOnComment: true,
        notifyOnState: true,
        notifyOnAssignee: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update a user
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
    const validatedData = UpdateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Uživatel s tímto emailem již existuje" },
          { status: 400 }
        );
      }
    }

    // Verify organization if being changed
    if (validatedData.organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: validatedData.organizationId },
      });

      if (!organization) {
        return NextResponse.json(
          { error: "Organizace neexistuje" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.role) updateData.role = validatedData.role;
    if (validatedData.organizationId)
      updateData.organizationId = validatedData.organizationId;

    if (validatedData.password) {
      updateData.passwordHash = await hash(validatedData.password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete a user
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

    // Cannot delete yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Nemůžete smazat sami sebe" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete related data first
    await prisma.notification.deleteMany({
      where: { userId: id },
    });

    await prisma.invitation.deleteMany({
      where: { createdById: id },
    });

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
