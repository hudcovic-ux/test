import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/services/notification";
import { createHmac } from "crypto";

const WEBHOOK_SECRET = process.env.YOUTRACK_WEBHOOK_SECRET || "";
const YOUTRACK_CLIENT_FIELD = process.env.YOUTRACK_CLIENT_FIELD || "Client";

interface WebhookPayload {
  timestamp: number;
  events: Array<{
    type: string;
    issue?: {
      id: string;
      idReadable: string;
      summary: string;
      customFields?: Array<{
        name: string;
        value?: { name: string } | null;
      }>;
    };
    change?: {
      field: string;
      oldValue?: string | { name: string };
      newValue?: string | { name: string };
    };
    comment?: {
      id: string;
      text: string;
      author: {
        fullName: string;
      };
    };
  }>;
}

// Verify webhook signature
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn("YOUTRACK_WEBHOOK_SECRET not configured");
    return true; // Skip verification in dev
  }

  const hmac = createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");

  return signature === expectedSignature;
}

// Get client value from issue custom fields
function getClientFromIssue(
  customFields?: Array<{ name: string; value?: { name: string } | null }>
): string | undefined {
  if (!customFields) return undefined;
  const clientField = customFields.find((f) => f.name === YOUTRACK_CLIENT_FIELD);
  return clientField?.value?.name;
}

// POST /api/webhooks/youtrack - Handle YouTrack webhook events
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-hub-signature-256") || "";

    // Verify signature
    if (!verifySignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data: WebhookPayload = JSON.parse(payload);

    for (const event of data.events) {
      if (!event.issue) continue;

      const clientValue = getClientFromIssue(event.issue.customFields);
      if (!clientValue) continue;

      // Find organization by client value
      const organization = await prisma.organization.findUnique({
        where: { youtrackClient: clientValue },
      });

      if (!organization) continue;

      const ticketId = event.issue.idReadable;
      const ticketSummary = event.issue.summary;

      // Handle different event types
      switch (event.type) {
        case "IssueComment": {
          // New comment added
          if (event.comment) {
            const authorName = event.comment.author.fullName;
            await NotificationService.notifyOrganization(
              organization.id,
              "COMMENT_ADDED",
              ticketId,
              ticketSummary,
              `${authorName} added a comment`
            );
          }
          break;
        }

        case "IssueChange": {
          // Issue changed
          if (event.change) {
            const fieldName = event.change.field;

            if (fieldName === "State") {
              const oldValue =
                typeof event.change.oldValue === "object"
                  ? event.change.oldValue?.name
                  : event.change.oldValue;
              const newValue =
                typeof event.change.newValue === "object"
                  ? event.change.newValue?.name
                  : event.change.newValue;

              await NotificationService.notifyOrganization(
                organization.id,
                "STATE_CHANGED",
                ticketId,
                ticketSummary,
                `State changed from ${oldValue || "Unknown"} to ${newValue || "Unknown"}`
              );
            } else if (fieldName === "Assignee") {
              const newValue =
                typeof event.change.newValue === "object"
                  ? event.change.newValue?.name
                  : event.change.newValue;

              await NotificationService.notifyOrganization(
                organization.id,
                "ASSIGNEE_CHANGED",
                ticketId,
                ticketSummary,
                `Ticket assigned to ${newValue || "Unassigned"}`
              );
            }
          }
          break;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
