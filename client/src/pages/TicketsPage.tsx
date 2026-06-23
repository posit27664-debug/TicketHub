import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import api from "../lib/api";
import type { Ticket, Pagination, TicketStatus, TicketCategory } from "../types";
import {
  getStatusBadgeClass,
  getCategoryBadgeClass,
  formatCategoryLabel,
  formatRelativeDate,
} from "../lib/utils";

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get("status") as TicketStatus | null;
  const category = searchParams.get("category") as TicketCategory | null;
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "15");
      params.set("sortBy", "createdAt");
      params.set("sortOrder", "desc");

      const { data } = await api.get<{ tickets: Ticket[]; pagination: Pagination }>(
        `/tickets?${params}`
      );
      setTickets(data.tickets);
      setPagination(data.pagination);
    } finally {
      setIsLoading(false);
    }
  }, [status, category, search, page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const setFilter = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete("page");
      return next;
    });
  };

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(p));
      return next;
    });
  };

  const statusOptions: TicketStatus[] = ["OPEN", "RESOLVED", "CLOSED"];
  const categoryOptions: { value: TicketCategory; label: string }[] = [
    { value: "GENERAL_QUESTION", label: "General" },
    { value: "TECHNICAL_QUESTION", label: "Technical" },
    { value: "REFUND_REQUEST", label: "Refund" },
  ];

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.625rem", fontWeight: 700 }}>Tickets</h1>
            <p style={{ color: "var(--color-text-muted)", marginTop: 4 }}>
              {pagination?.total ?? "…"} total tickets
            </p>
          </div>
          <Link to="/tickets/new" id="new-ticket-btn" className="btn btn-primary">
            <Plus size={16} />
            New Ticket
          </Link>
        </div>

        {/* Filters */}
        <div
          className="card"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            marginBottom: "1.25rem",
            padding: "1rem 1.25rem",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-subtle)",
              }}
            />
            <input
              id="ticket-search"
              className="input"
              style={{ paddingLeft: "2rem" }}
              placeholder="Search tickets…"
              value={search}
              onChange={(e) => setFilter("search", e.target.value || null)}
            />
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", gap: "0.375rem" }}>
            <button
              className={`btn btn-sm ${!status ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter("status", null)}
            >
              All
            </button>
            {statusOptions.map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${status === s ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilter("status", s === status ? null : s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <select
            id="category-filter"
            className="input"
            style={{ width: "auto" }}
            value={category ?? ""}
            onChange={(e) => setFilter("category", e.target.value || null)}
          >
            <option value="">All categories</option>
            {categoryOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {(status || category || search) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSearchParams({})}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <div className="spinner" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <Search size={40} />
              <p style={{ marginTop: "0.5rem" }}>No tickets found</p>
              <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>
                Try changing your filters
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link
                        to={`/tickets/${ticket.id}`}
                        style={{
                          color: "var(--color-text)",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        {ticket.subject}
                      </Link>
                      {ticket.fromEmail && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                            marginTop: 2,
                          }}
                        >
                          {ticket.fromName} &lt;{ticket.fromEmail}&gt;
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(ticket.status)}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      <span className={getCategoryBadgeClass(ticket.category)}>
                        {formatCategoryLabel(ticket.category)}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-text-muted)" }}>
                      {ticket.assignedAgent?.name ?? (
                        <span style={{ color: "var(--color-text-subtle)" }}>—</span>
                      )}
                    </td>
                    <td
                      style={{
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {formatRelativeDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "1.25rem",
            }}
          >
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
  );
}
