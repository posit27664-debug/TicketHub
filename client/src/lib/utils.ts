import type { TicketStatus, TicketCategory } from "../types";

export function getStatusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case "OPEN":
      return "badge badge-open";
    case "RESOLVED":
      return "badge badge-resolved";
    case "CLOSED":
      return "badge badge-closed";
  }
}

export function getCategoryBadgeClass(category: TicketCategory): string {
  switch (category) {
    case "GENERAL_QUESTION":
      return "badge badge-general";
    case "TECHNICAL_QUESTION":
      return "badge badge-technical";
    case "REFUND_REQUEST":
      return "badge badge-refund";
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
