import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateFieldConfigSchema = z.object({
  organizationId: z.string(),
  fieldName: z.string(),
  visible: z.boolean().optional(),
  editable: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

const BulkUpdateFieldConfigSchema = z.object({
  organizationId: z.string(),
  configs: z.array(
    z.object({
      fieldName: z.string(),
      visible: z.boolean(),
      editable: z.boolean(),
      displayOrder: z.number(),
    })
  ),
});

// GET /api/admin/field-configs - Get field configs for an organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const fieldConfigs = await prisma.fieldConfig.findMany({
      where: { organizationId },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(fieldConfigs);
  } catch (error) {
    console.error("Error fetching field configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch field configs" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/field-configs - Update a field config
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateFieldConfigSchema.parse(body);

    const fieldConfig = await prisma.fieldConfig.upsert({
      where: {
        organizationId_fieldName: {
          organizationId: validatedData.organizationId,
          fieldName: validatedData.fieldName,
        },
      },
      update: {
        visible: validatedData.visible,
        editable: validatedData.editable,
        displayOrder: validatedData.displayOrder,
      },
      create: {
        organizationId: validatedData.organizationId,
        fieldName: validatedData.fieldName,
        visible: validatedData.visible ?? true,
        editable: validatedData.editable ?? false,
        displayOrder: validatedData.displayOrder ?? 0,
      },
    });

    return NextResponse.json(fieldConfig);
  } catch (error) {
    console.error("Error updating field config:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update field config" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/field-configs - Bulk update field configs
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = BulkUpdateFieldConfigSchema.parse(body);

    // Delete existing configs
    await prisma.fieldConfig.deleteMany({
      where: { organizationId: validatedData.organizationId },
    });

    // Create new configs
    await prisma.fieldConfig.createMany({
      data: validatedData.configs.map((config) => ({
        organizationId: validatedData.organizationId,
        ...config,
      })),
    });

    const fieldConfigs = await prisma.fieldConfig.findMany({
      where: { organizationId: validatedData.organizationId },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(fieldConfigs);
  } catch (error) {
    console.error("Error bulk updating field configs:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update field configs" },
      { status: 500 }
    );
  }
}
