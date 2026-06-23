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

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  borderRadius: "6px",
  fontSize: "0.875rem",
  fontWeight: 500,
  cursor: "pointer",
  border: "none",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
  textDecoration: "none",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "6px",
  color: "var(--color-text)",
  fontSize: "0.875rem",
  padding: "0.625rem 0.875rem",
  outline: "none",
  transition: "all 0.15s ease",
};

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

  const primaryBtn = (small?: boolean): React.CSSProperties => ({
    ...btn,
    padding: small ? "0.375rem 0.75rem" : "0.5rem 1rem",
    fontSize: small ? "13px" : "0.875rem",
    background: "var(--color-primary)",
    color: "white",
  });

  const secondaryBtn = (small?: boolean): React.CSSProperties => ({
    ...btn,
    padding: small ? "0.375rem 0.75rem" : "0.5rem 1rem",
    fontSize: small ? "13px" : "0.875rem",
    background: "var(--color-surface-2)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
  });

  const ghostBtn = (small?: boolean): React.CSSProperties => ({
    ...btn,
    padding: small ? "0.375rem 0.75rem" : "0.5rem 1rem",
    fontSize: small ? "13px" : "0.875rem",
    background: "transparent",
    color: "var(--color-text-muted)",
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--color-text)" }}>Tickets</h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {pagination?.total ?? "\u2026"} total tickets
          </p>
        </div>
        <Link
          to="/tickets/new"
          id="new-ticket-btn"
          style={primaryBtn()}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "var(--color-shadow-glow)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "none";
          }}
        >
          <Plus size={16} />
          New Ticket
        </Link>
      </div>

      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: "160px",
            flexBasis: "200px",
          }}
        >
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "0.625rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-subtle)",
            }}
          />
          <input
            id="ticket-search"
            style={{
              ...inputStyle,
              paddingLeft: "2rem",
            }}
            placeholder="Search tickets\u2026"
            value={search}
            onChange={(e) => setFilter("search", e.target.value || null)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.375rem" }}>
          {[
            { key: null as string | null, label: "All" },
            ...statusOptions.map((s) => ({ key: s, label: s })),
          ].map(({ key, label }) => {
            const active = key === status || (key === null && !status);
            return (
              <button
                key={label}
                style={active ? { ...primaryBtn(true), outline: "none" } : { ...secondaryBtn(true), outline: "none" }}
                onClick={() => setFilter("status", key)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <select
          id="category-filter"
          style={{
            ...inputStyle,
            width: "auto",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            paddingRight: "1.5rem",
          }}
          value={category ?? ""}
          onChange={(e) => setFilter("category", e.target.value || null)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <option value="">All categories</option>
          {categoryOptions.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {(status || category || search) && (
          <button
            style={{ ...ghostBtn(true), outline: "none" }}
            onClick={() => setSearchParams({})}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.04)";
              e.currentTarget.style.color = "var(--color-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-muted)";
            }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <div
        className="card"
        style={{ padding: 0, overflowX: "auto" }}
      >
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <div className="spinner !w-5 !h-5" />
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
            <Search size={40} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <p style={{ marginTop: "0.5rem" }}>No tickets found</p>
            <p style={{ fontSize: "13px", marginTop: "0.25rem" }}>Try changing your filters</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Assigned To</th>
                <th style={thStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  style={{ transition: "background-color 0.1s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={tdStyle}>
                    <Link
                      to={`/tickets/${ticket.id}`}
                      style={{ color: "var(--color-text)", textDecoration: "none", fontWeight: 500 }}
                    >
                      {ticket.subject}
                    </Link>
                    {ticket.fromEmail && (
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.125rem" }}>
                        {ticket.fromName} &lt;{ticket.fromEmail}&gt;
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span className={getStatusBadgeClass(ticket.status)}>
                      {ticket.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span className={getCategoryBadgeClass(ticket.category)}>
                      {formatCategoryLabel(ticket.category)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--color-text-muted)" }}>
                    {ticket.assignedAgent?.name ?? (
                      <span style={{ color: "var(--color-text-subtle)" }}>{'\u2014'}</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    {formatRelativeDate(ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "1.25rem" }}>
          <button
            style={{ ...secondaryBtn(true), outline: "none" }}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Page {page} of {pagination.totalPages}
          </span>
          <button
            style={{ ...secondaryBtn(true), outline: "none" }}
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

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.75rem 1rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--color-text-subtle)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  borderBottom: "1px solid var(--color-border)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "0.875rem 1rem",
  borderBottom: "1px solid var(--color-border)",
  verticalAlign: "middle",
  fontSize: "0.875rem",
};
