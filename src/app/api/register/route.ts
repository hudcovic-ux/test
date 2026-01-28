import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// POST /api/register - Register a new user via invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RegisterSchema.parse(body);

    // Find valid invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token: validatedData.token },
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        name: validatedData.name,
        passwordHash,
        organizationId: invitation.organizationId,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    // Delete invitation
    await prisma.invitation.delete({
      where: { id: invitation.id },
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

// GET /api/register?token=xxx - Validate invitation token
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      email: invitation.email,
      organizationName: invitation.organization.name,
      invitedBy: invitation.createdBy.name,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation" },
      { status: 500 }
    );
  }
}
