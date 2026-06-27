export type Role = "ADMIN" | "AGENT";
export type TicketStatus = "NEW" | "PROCESSING" | "OPEN" | "RESOLVED" | "CLOSED";
export type TicketCategory =
  | "GENERAL_QUESTION"
  | "TECHNICAL_QUESTION"
  | "REFUND_REQUEST";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt?: string;
  _count?: { assignedTickets: number };
}

export interface Message {
  id: string;
  ticketId: string;
  body: string;
  fromName: string;
  fromEmail: string;
  isAgent: boolean;
  sentAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: TicketStatus;
  category: TicketCategory;
  fromName?: string;
  fromEmail?: string;
  aiSummary?: string;
  aiSuggestedReply?: string;
  assignedAgentId?: string;
  assignedAgent?: Pick<User, "id" | "name" | "email">;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DailyMetric {
  date: string;
  created: number;
  resolved: number;
}

export interface TicketMetrics {
  total30d: number;
  resolved30d: number;
  byDay: DailyMetric[];
}

export interface DashboardStats {
  open: number;
  resolved: number;
  closed: number;
  processing: number;
  total: number;
  byCategory: { category: TicketCategory; count: number }[];
}
