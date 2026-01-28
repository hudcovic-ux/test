import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats - Get admin dashboard stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const [organizationsCount, usersCount, recentUsers] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      organizationsCount,
      usersCount,
      ticketsCount: 0, // Would need YouTrack integration to get real count
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        organizationName: user.organization.name,
        createdAt: user.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
