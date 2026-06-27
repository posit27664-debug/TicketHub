import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SkeletonTable } from "../components/Skeleton";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Filter,
} from "lucide-react";
import api from "../lib/api";
import type { Ticket, Pagination, TicketStatus, TicketCategory } from "../types";
import {
  getStatusBadgeClass,
  getCategoryBadgeClass,
  formatCategoryLabel,
  formatRelativeDate,
} from "../lib/utils";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";

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

const columnHelper = createColumnHelper<Ticket>();

const columns = [
  columnHelper.accessor("subject", {
    header: "Subject",
    cell: (info) => {
      const ticket = info.row.original;
      return (
        <Link
          to={`/tickets/${ticket.id}`}
          style={{ color: "var(--color-text)", textDecoration: "none", fontWeight: 500 }}
        >
          {ticket.subject}
        </Link>
      );
    },
  }),
  columnHelper.accessor("fromEmail", {
    header: "Sender",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div>
          <div style={{ color: "var(--color-text)", fontSize: "0.875rem" }}>{row.fromName}</div>
          {row.fromEmail && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.125rem" }}>
              {row.fromEmail}
            </div>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span className={getStatusBadgeClass(info.getValue())}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("category", {
    header: "Category",
    cell: (info) => (
      <span className={getCategoryBadgeClass(info.getValue())}>
        {formatCategoryLabel(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("assignedAgent", {
    header: "Assigned To",
    enableSorting: false,
    cell: (info) => {
      const agent = info.getValue();
      return agent?.name ?? (
        <span style={{ color: "var(--color-text-subtle)" }}>{'\u2014'}</span>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => (
      <span style={{ whiteSpace: "nowrap" }}>
        {formatRelativeDate(info.getValue())}
      </span>
    ),
  }),
];

export function TicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get("status") as TicketStatus | null;
  const category = searchParams.get("category") as TicketCategory | null;
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", { status, category, search, page, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "10");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const { data } = await api.get<{ tickets: Ticket[]; pagination: Pagination }>(
        `/tickets?${params}`
      );
      return data;
    },
  });

  const tickets = data?.tickets ?? [];
  const pagination = data?.pagination ?? null;

  const [sorting, setSorting] = useState<SortingState>(() => [
    { id: sortBy, desc: sortOrder === "desc" },
  ]);

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    enableSortingRemoval: false,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        if (next.length > 0) {
          p.set("sortBy", next[0].id);
          p.set("sortOrder", next[0].desc ? "desc" : "asc");
        } else {
          p.delete("sortBy");
          p.delete("sortOrder");
        }
        p.delete("page");
        return p;
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

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
            placeholder="Search tickets..."
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



        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ position: "relative" }}>
            <Filter
              size={14}
              style={{
                position: "absolute",
                left: "0.625rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-subtle)",
                pointerEvents: "none",
              }}
            />
            <select
              id="status-filter"
              style={{
                ...inputStyle,
                width: "auto",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                paddingLeft: "2rem",
                paddingRight: "1.75rem",
              }}
              value={status ?? ""}
              onChange={(e) => setFilter("status", e.target.value || null)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <option value="">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-subtle)",
                pointerEvents: "none",
              }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <select
              id="category-filter"
              style={{
                ...inputStyle,
                width: "auto",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                paddingRight: "1.75rem",
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
            <ChevronDown
              size={14}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-subtle)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

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
          <SkeletonTable rows={8} cols={6} />
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
            <Search size={40} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <p style={{ marginTop: "0.5rem" }}>No tickets found</p>
            <p style={{ fontSize: "13px", marginTop: "0.25rem" }}>Try changing your filters</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        style={{
                          ...thStyle,
                          cursor: canSort ? "pointer" : "default",
                          userSelect: "none",
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                        onMouseEnter={(e) => {
                          if (canSort) e.currentTarget.style.color = "var(--color-text)";
                        }}
                        onMouseLeave={(e) => {
                          if (!sorted) e.currentTarget.style.color = "var(--color-text-subtle)";
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && !sorted && (
                            <ChevronsUpDown size={13} style={{ opacity: 0.3 }} />
                          )}
                          {sorted === "asc" && (
                            <ChevronUp size={14} style={{ color: "var(--color-primary)" }} />
                          )}
                          {sorted === "desc" && (
                            <ChevronDown size={14} style={{ color: "var(--color-primary)" }} />
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ transition: "background-color 0.1s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={tdStyle}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
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
