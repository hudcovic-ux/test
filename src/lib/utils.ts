import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTicketTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    Task: "clipboard-list",
    Feature: "sparkles",
    Bug: "bug",
    Idea: "lightbulb",
  };
  return icons[type] || "file-text";
}

export function getTicketTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    Task: "\uD83D\uDCCB",
    Feature: "\u2728",
    Bug: "\uD83D\uDC1B",
    Idea: "\uD83D\uDCA1",
  };
  return emojis[type] || "\uD83D\uDCC4";
}

export function getStateColor(state: string): string {
  const colors: Record<string, string> = {
    "Needs Feedback": "bg-pink-500",
    "New": "bg-sky-400",
    "For estimation": "bg-orange-500",
    "Estimation accepted": "bg-green-500",
    "In progress": "bg-blue-500",
    "Internally done": "bg-purple-500",
    "Ready to test (staging)": "bg-yellow-500",
    "Client testing done": "bg-cyan-400",
    "On production": "bg-indigo-500",
    "Done": "bg-slate-500",
    "Rejected by client": "bg-red-500",
  };
  return colors[state] || "bg-slate-500";
}

export function getStateBadgeClasses(state: string): string {
  const base = "px-2 py-1 rounded-full text-xs font-medium text-white";
  return `${base} ${getStateColor(state)}`;
}
