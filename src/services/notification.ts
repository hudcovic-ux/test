import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { EmailService } from "./email";

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  ticketId: string;
  ticketSummary: string;
  message: string;
}

export const NotificationService = {
  // Create a notification and optionally send email
  async create(data: CreateNotificationData): Promise<void> {
    // Create in-app notification
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) return;

    // Check user preferences
    const shouldNotifyInApp = user.notifyInApp;
    const shouldNotifyEmail = user.notifyEmail;

    let shouldCreateNotification = shouldNotifyInApp;

    // Check specific notification type preferences
    switch (data.type) {
      case "COMMENT_ADDED":
        shouldCreateNotification = shouldNotifyInApp && user.notifyOnComment;
        break;
      case "STATE_CHANGED":
        shouldCreateNotification = shouldNotifyInApp && user.notifyOnState;
        break;
      case "ASSIGNEE_CHANGED":
        shouldCreateNotification = shouldNotifyInApp && user.notifyOnAssignee;
        break;
    }

    if (shouldCreateNotification) {
      await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          ticketId: data.ticketId,
          ticketSummary: data.ticketSummary,
          message: data.message,
        },
      });
    }

    // Send email notification if enabled
    if (shouldNotifyEmail) {
      switch (data.type) {
        case "COMMENT_ADDED":
          if (user.notifyOnComment) {
            // Extract author name from message (assuming format "AuthorName added a comment")
            const authorMatch = data.message.match(/^(.+) added a comment/);
            const authorName = authorMatch?.[1] || "Someone";
            await EmailService.sendCommentNotification(
              user.email,
              user.name,
              data.ticketId,
              data.ticketSummary,
              authorName,
              data.message
            );
          }
          break;
        case "STATE_CHANGED":
          if (user.notifyOnState) {
            // Extract states from message (assuming format "State changed from X to Y")
            const stateMatch = data.message.match(/from (.+) to (.+)/);
            const oldState = stateMatch?.[1] || "Unknown";
            const newState = stateMatch?.[2] || "Unknown";
            await EmailService.sendStateChangeNotification(
              user.email,
              user.name,
              data.ticketId,
              data.ticketSummary,
              oldState,
              newState
            );
          }
          break;
        case "ASSIGNEE_CHANGED":
          if (user.notifyOnAssignee) {
            // Extract assignee name from message
            const assigneeMatch = data.message.match(/assigned to (.+)/);
            const assigneeName = assigneeMatch?.[1] || "Someone";
            await EmailService.sendAssigneeChangeNotification(
              user.email,
              user.name,
              data.ticketId,
              data.ticketSummary,
              assigneeName
            );
          }
          break;
      }
    }
  },

  // Get unread notifications for a user
  async getUnread(userId: string) {
    return prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  // Get all notifications for a user
  async getAll(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  },

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
      },
    });
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  },

  // Get unread count
  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  },

  // Notify all users in an organization about a ticket change
  async notifyOrganization(
    organizationId: string,
    type: NotificationType,
    ticketId: string,
    ticketSummary: string,
    message: string,
    excludeUserId?: string
  ): Promise<void> {
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
    });

    await Promise.all(
      users.map((user) =>
        this.create({
          userId: user.id,
          type,
          ticketId,
          ticketSummary,
          message,
        })
      )
    );
  },
};

export default NotificationService;
