import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 20px ${glow}`,
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div>
        <div
          style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--color-text)", lineHeight: 1 }}
        >
          {value}
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ stats: DashboardStats }>("/tickets/stats"),
      api.get<{ tickets: TicketType[] }>("/tickets?limit=5&sortBy=createdAt&sortOrder=desc"),
    ])
      .then(([statsRes, ticketsRes]) => {
        setStats(statsRes.data.stats);
        setRecentTickets(ticketsRes.data.tickets);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const categoryInfo = {
    GENERAL_QUESTION: { label: "General", icon: HelpCircle, color: "#a5b4fc" },
    TECHNICAL_QUESTION: { label: "Technical", icon: Wrench, color: "#93c5fd" },
    REFUND_REQUEST: { label: "Refund", icon: CreditCard, color: "#fca5a5" },
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 700, color: "var(--color-text)" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4 }}>
            Overview of your support operations
          </p>
        </div>

        {/* Stats */}
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
          {/* Recent Tickets */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 style={{ fontWeight: 600, fontSize: "1rem" }}>Recent Tickets</h2>
              <Link
                to="/tickets"
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--color-primary)" }}
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {recentTickets.length === 0 ? (
              <div className="empty-state">
                <Ticket size={40} />
                <p>No tickets yet</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((ticket) => (
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
                          {ticket.subject.length > 50
                            ? ticket.subject.slice(0, 50) + "…"
                            : ticket.subject}
                        </Link>
                        {ticket.fromEmail && (
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                            {ticket.fromEmail}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(ticket.status)}>
                          {ticket.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                        {formatRelativeDate(ticket.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* By Category */}
          <div className="card">
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
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        <info.icon size={14} color={info.color} />
                        <span style={{ color: "var(--color-text)" }}>{info.label}</span>
                      </div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
                        {count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "var(--color-surface-2)",
                        borderRadius: 100,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: info.color,
                          borderRadius: 100,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {(stats?.byCategory?.length ?? 0) === 0 && (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                  No data yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
