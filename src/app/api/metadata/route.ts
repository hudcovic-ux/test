import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YouTrackService } from "@/services/youtrack";

// GET /api/metadata - Get ticket metadata (states, types, assignees)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get field configs for user's organization
    const fieldConfigs = await prisma.fieldConfig.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { displayOrder: "asc" },
    });

    // Fetch metadata from YouTrack in parallel
    const [states, types, assignees] = await Promise.all([
      YouTrackService.getStates().catch(() => []),
      YouTrackService.getTypes().catch(() => []),
      YouTrackService.getAssignees().catch(() => []),
    ]);

    // Define ticket type icons
    const typeIcons: Record<string, string> = {
      Task: "clipboard-list",
      Feature: "sparkles",
      Bug: "bug",
      Idea: "lightbulb",
    };

    // Define state colors
    const stateColors: Record<string, string> = {
      "Needs Feedback": "pink",
      "New": "sky",
      "For estimation": "orange",
      "Estimation accepted": "green",
      "In progress": "blue",
      "Internally done": "purple",
      "Ready to test (staging)": "yellow",
      "Client testing done": "cyan",
      "On production": "indigo",
      "Done": "slate",
      "Rejected by client": "red",
    };

    return NextResponse.json({
      states: states.map((state) => ({
        name: state,
        color: stateColors[state] || "slate",
      })),
      types: types.map((type) => ({
        name: type,
        icon: typeIcons[type] || "file-text",
      })),
      assignees,
      fieldConfigs,
    });
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
