import type { TicketStatus, TicketCategory } from "../types";

export function getStatusBadgeClass(status: TicketStatus): string {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border";
  switch (status) {
    case "NEW":
      return `${base} bg-blue-50 text-blue-700 border-blue-200`;
    case "PROCESSING":
      return `${base} bg-purple-50 text-purple-700 border-purple-200`;
    case "OPEN":
      return `${base} bg-amber-50 text-amber-700 border-amber-200`;
    case "RESOLVED":
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    case "CLOSED":
      return `${base} bg-gray-50 text-gray-600 border-gray-200`;
  }
}

export function getCategoryBadgeClass(category: TicketCategory): string {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border";
  switch (category) {
    case "GENERAL_QUESTION":
      return `${base} bg-indigo-50 text-indigo-700 border-indigo-200`;
    case "TECHNICAL_QUESTION":
      return `${base} bg-blue-50 text-blue-700 border-blue-200`;
    case "REFUND_REQUEST":
      return `${base} bg-red-50 text-red-700 border-red-200`;
  }
}

export function formatCategoryLabel(category: TicketCategory): string {
  switch (category) {
    case "GENERAL_QUESTION":
      return "General";
    case "TECHNICAL_QUESTION":
      return "Technical";
    case "REFUND_REQUEST":
      return "Refund";
  }
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}
