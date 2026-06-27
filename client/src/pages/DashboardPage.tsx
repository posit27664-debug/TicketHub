import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SkeletonBox, SkeletonStatCards } from "../components/Skeleton";
import {
  Ticket,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import api from "../lib/api";
import type { DashboardStats, DailyMetric } from "../types";

const CHART_W = 760;
const CHART_H = 155;
const PAD = { top: 12, right: 28, bottom: 32, left: 36 };

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
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
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

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ActivityChart({ data }: { data: DailyMetric[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map((d) => Math.max(d.created, d.resolved)), 1);

  const toX = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;

  const createdPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.created)}`).join(" ");
  const resolvedPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.resolved)}`).join(" ");

  const createdArea = `${createdPath} L${toX(data.length - 1)},${PAD.top + innerH} L${toX(0)},${PAD.top + innerH} Z`;
  const resolvedArea = `${resolvedPath} L${toX(data.length - 1)},${PAD.top + innerH} L${toX(0)},${PAD.top + innerH} Z`;

  const yTicks = [0, Math.round(maxVal / 2), maxVal].filter((v) => v > 0);
  if (!yTicks.includes(maxVal)) yTicks.push(maxVal);
  if (yTicks.length < 2) yTicks.unshift(0);

  const xLabelStep = Math.max(1, Math.floor(data.length / 5));

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = CHART_W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const idx = Math.round(((mx - PAD.left) / innerW) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }

  return (
    <div style={{ position: "relative" }}>
      {hovered && (
        <div
          style={{
            position: "absolute",
            top: -4,
            right: 0,
            display: "flex",
            gap: "1.25rem",
            fontSize: "0.8125rem",
            background: "var(--color-surface-2)",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            zIndex: 10,
          }}
        >
          <span style={{ color: "var(--color-text-muted)" }}>
            {formatDateLabel(hovered.date)}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
            <span style={{ color: "var(--color-text)" }}>{hovered.created} created</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ color: "var(--color-text)" }}>{hovered.resolved} resolved</span>
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              y1={toY(v)}
              x2={CHART_W - PAD.right}
              y2={toY(v)}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text x={PAD.left - 6} y={toY(v) + 3} textAnchor="end" fill="var(--color-text-subtle)" fontSize="11">
              {v}
            </text>
          </g>
        ))}

        <path d={createdArea} fill="url(#createdGrad)" />
        <path d={resolvedArea} fill="url(#resolvedGrad)" />

        <path d={createdPath} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
        <path d={resolvedPath} fill="none" stroke="#10b981" strokeWidth={2} strokeLinejoin="round" />

        {(hoverIdx !== null) && (
          <>
            <line
              x1={toX(hoverIdx)}
              y1={PAD.top}
              x2={toX(hoverIdx)}
              y2={PAD.top + innerH}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={toX(hoverIdx)} cy={toY(data[hoverIdx].created)} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
            <circle cx={toX(hoverIdx)} cy={toY(data[hoverIdx].resolved)} r={4} fill="#10b981" stroke="#fff" strokeWidth={2} />
          </>
        )}

        {data.filter((_, i) => i % xLabelStep === 0).map((d, _i) => {
          const origIdx = data.findIndex((x) => x.date === d.date);
          const isLast = origIdx === data.length - 1;
          return (
            <text
              key={d.date}
              x={isLast ? toX(origIdx) - 8 : toX(origIdx)}
              y={CHART_H - 4}
              textAnchor={isLast ? "end" : "middle"}
              fill="var(--color-text-subtle)"
              fontSize="11"
            >
              {formatDateLabel(d.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["tickets", "stats"],
    queryFn: async () => {
      const { data } = await api.get<{ stats: DashboardStats }>("/tickets/stats");
      return data.stats;
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["tickets", "metrics"],
    queryFn: async () => {
      const { data } = await api.get<{ metrics: { total30d: number; resolved30d: number; byDay: DailyMetric[] } }>("/tickets/metrics");
      return data.metrics;
    },
  });

  const isLoading = statsLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <SkeletonBox style={{ width: "180px", height: "28px", marginBottom: "0.375rem" }} />
        <SkeletonBox style={{ width: "260px", height: "14px", marginBottom: "2rem" }} />
        <SkeletonStatCards />
        <div className="card" style={{ padding: "1.5rem" }}>
          <SkeletonBox style={{ width: "200px", height: "18px", marginBottom: "1rem" }} />
          <SkeletonBox style={{ width: "100%", height: "155px", borderRadius: "8px" }} />
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

      <div className="card" style={{ padding: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h2 style={{ fontWeight: 600, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BarChart3 size={18} color="var(--color-primary)" />
              30-Day Activity
            </h2>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              <span style={{ width: 12, height: 3, borderRadius: 2, background: "#3b82f6", display: "inline-block" }} />
              Created
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              <span style={{ width: 12, height: 3, borderRadius: 2, background: "#10b981", display: "inline-block" }} />
              Resolved
            </span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
                {metrics?.total30d ?? 0}
              </div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>in 30 days</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
                {metrics?.resolved30d ?? 0}
              </div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>resolved</div>
            </div>
          </div>
        </div>

        {metrics?.byDay && metrics.byDay.length > 0 ? (
          <ActivityChart data={metrics.byDay} />
        ) : (
          <div
            style={{
              height: CHART_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
            }}
          >
            No activity in the last 30 days
          </div>
        )}
      </div>
    </div>
  );
}
