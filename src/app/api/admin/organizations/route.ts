import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  youtrackClient: z.string().min(1, "YouTrack client value is required"),
});

// GET /api/admin/organizations - List all organizations (SUPER_ADMIN only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true },
        },
        fieldConfigs: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

// POST /api/admin/organizations - Create a new organization (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CreateOrganizationSchema.parse(body);

    // Check if youtrackClient already exists
    const existing = await prisma.organization.findUnique({
      where: { youtrackClient: validatedData.youtrackClient },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Organization with this YouTrack client already exists" },
        { status: 400 }
      );
    }

    // Create organization with default field configs
    const organization = await prisma.organization.create({
      data: {
        name: validatedData.name,
        youtrackClient: validatedData.youtrackClient,
        fieldConfigs: {
          create: [
            { fieldName: "type", visible: true, editable: true, displayOrder: 1 },
            { fieldName: "state", visible: true, editable: true, displayOrder: 2 },
            { fieldName: "assignee", visible: true, editable: true, displayOrder: 3 },
            { fieldName: "estimation", visible: true, editable: false, displayOrder: 4 },
            { fieldName: "dueDate", visible: true, editable: false, displayOrder: 5 },
            { fieldName: "priority", visible: true, editable: false, displayOrder: 6 },
          ],
        },
      },
      include: {
        fieldConfigs: true,
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
