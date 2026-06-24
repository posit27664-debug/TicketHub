import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SkeletonBox, SkeletonStatCards, SkeletonTable } from "../components/Skeleton";
import {
  Ticket,
  CheckCircle2,
  XCircle,
  TrendingUp,
  HelpCircle,
  Wrench,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import api from "../lib/api";
import type { DashboardStats, Ticket as TicketType } from "../types";
import { getStatusBadgeClass, formatRelativeDate } from "../lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  glow,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  glow: string;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: `${color}12`,
          border: `1px solid ${color}25`,
          boxShadow: `0 0 16px ${glow}`,
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: "30px", fontWeight: 700, color: "var(--color-text)", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

const categoryInfo: Record<string, { label: string; icon: React.ComponentType<{ size?: number; color?: string }>; color: string }> = {
  GENERAL_QUESTION: { label: "General", icon: HelpCircle, color: "#6366f1" },
  TECHNICAL_QUESTION: { label: "Technical", icon: Wrench, color: "#3b82f6" },
  REFUND_REQUEST: { label: "Refund", icon: CreditCard, color: "#ef4444" },
};

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["tickets", "stats"],
    queryFn: async () => {
      const { data } = await api.get<{ stats: DashboardStats }>("/tickets/stats");
      return data.stats;
    },
  });

  const { data: recentTickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets", "recent"],
    queryFn: async () => {
      const { data } = await api.get<{ tickets: TicketType[] }>(
        "/tickets?limit=5&sortBy=createdAt&sortOrder=desc"
      );
      return data.tickets;
    },
  });

  const isLoading = statsLoading || ticketsLoading;

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <SkeletonBox style={{ width: "180px", height: "28px", marginBottom: "0.375rem" }} />
        <SkeletonBox style={{ width: "260px", height: "14px", marginBottom: "2rem" }} />
        <SkeletonStatCards />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <SkeletonTable rows={5} cols={3} />
          </div>
          <div className="card" style={{ padding: "1.5rem" }}>
            <SkeletonBox style={{ width: "100px", height: "16px", marginBottom: "1.25rem" }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBox key={i} style={{ width: "100%", height: "32px", marginBottom: "0.875rem" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--color-text)" }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
          Overview of your support operations
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          label="Open Tickets"
          value={stats?.open ?? 0}
          icon={Ticket}
          color="#f59e0b"
          glow="rgba(245,158,11,0.15)"
        />
        <StatCard
          label="Resolved"
          value={stats?.resolved ?? 0}
          icon={CheckCircle2}
          color="#10b981"
          glow="rgba(16,185,129,0.15)"
        />
        <StatCard
          label="Closed"
          value={stats?.closed ?? 0}
          icon={XCircle}
          color="#6b7280"
          glow="rgba(107,114,128,0.1)"
        />
        <StatCard
          label="Total Tickets"
          value={stats?.total ?? 0}
          icon={TrendingUp}
          color="#6366f1"
          glow="rgba(99,102,241,0.2)"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <div
          className="card"
          style={{ padding: 0, overflow: "hidden" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <h2 style={{ fontWeight: 600, fontSize: "1rem" }}>Recent Tickets</h2>
            <Link
              to="/tickets"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                background: "transparent",
                color: "var(--color-primary)",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
              <Ticket size={40} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
              <p>No tickets yet</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Subject</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
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
                        {ticket.subject.length > 50
                          ? ticket.subject.slice(0, 50) + "\u2026"
                          : ticket.subject}
                      </Link>
                      {ticket.fromEmail && (
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.125rem" }}>
                          {ticket.fromEmail}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span className={getStatusBadgeClass(ticket.status)}>
                        {ticket.status}
                      </span>
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

        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "1.25rem" }}>
            By Category
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {(stats?.byCategory ?? []).map(({ category, count }) => {
              const info = categoryInfo[category];
              const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={category}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.375rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <info.icon size={14} color={info.color} />
                      <span style={{ color: "var(--color-text)" }}>{info.label}</span>
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
                      {count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--color-surface-2)",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        width: `${pct}%`,
                        background: info.color,
                        opacity: 0.8,
                        transition: "width 0.7s ease-out",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {(stats?.byCategory?.length ?? 0) === 0 && (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>No data yet</p>
            )}
          </div>
        </div>
      </div>
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
