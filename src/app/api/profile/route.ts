import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  notifyEmail: z.boolean().optional(),
  notifyInApp: z.boolean().optional(),
  notifyOnComment: z.boolean().optional(),
  notifyOnState: z.boolean().optional(),
  notifyOnAssignee: z.boolean().optional(),
});

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
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
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateProfileSchema.parse(body);

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.name) {
      updateData.name = validatedData.name;
    }

    if (validatedData.email) {
      // Check if email is already in use
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
      updateData.email = validatedData.email;
    }

    // Handle password change
    if (validatedData.newPassword) {
      if (!validatedData.currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isPasswordValid = await compare(
        validatedData.currentPassword,
        user.passwordHash
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      updateData.passwordHash = await hash(validatedData.newPassword, 12);
    }

    // Notification preferences
    if (validatedData.notifyEmail !== undefined) {
      updateData.notifyEmail = validatedData.notifyEmail;
    }
    if (validatedData.notifyInApp !== undefined) {
      updateData.notifyInApp = validatedData.notifyInApp;
    }
    if (validatedData.notifyOnComment !== undefined) {
      updateData.notifyOnComment = validatedData.notifyOnComment;
    }
    if (validatedData.notifyOnState !== undefined) {
      updateData.notifyOnState = validatedData.notifyOnState;
    }
    if (validatedData.notifyOnAssignee !== undefined) {
      updateData.notifyOnAssignee = validatedData.notifyOnAssignee;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        notifyEmail: true,
        notifyInApp: true,
        notifyOnComment: true,
        notifyOnState: true,
        notifyOnAssignee: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
