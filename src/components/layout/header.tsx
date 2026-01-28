"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  ticketId: string;
  ticketSummary: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function Header({ title }: { title?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "COMMENT_ADDED":
        return "\uD83D\uDCAC";
      case "STATE_CHANGED":
        return "\uD83D\uDD04";
      case "ASSIGNEE_CHANGED":
        return "\uD83D\uDC64";
      default:
        return "\uD83D\uDD14";
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center justify-between h-full px-6">
        <h1 className="text-xl font-semibold text-slate-100">
          {title || "Dashboard"}
        </h1>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-400 hover:text-slate-200"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-500 text-xs font-medium text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0 bg-slate-800 border-slate-700"
            align="end"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="font-semibold text-slate-100">Notifications</h2>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                  onClick={markAllAsRead}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={`/tickets/${notification.ticketId}`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      setIsOpen(false);
                    }}
                    className={cn(
                      "block p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors",
                      !notification.read && "bg-slate-700/20"
                    )}
                  >
                    <div className="flex gap-3">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">
                          {notification.ticketSummary}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
