import type { CSSProperties } from "react";

const shimmer: CSSProperties = {
  background: "linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-border) 50%, var(--color-surface-2) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s ease-in-out infinite",
  borderRadius: "6px",
};

export function SkeletonBox({ width, height, style }: { width?: string | number; height?: string | number; style?: CSSProperties }) {
  return <div style={{ ...shimmer, width: width ?? "100%", height: height ?? "1rem", ...style }} />;
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  const thStyle: CSSProperties = {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--color-border)",
  };

  const tdStyle: CSSProperties = {
    padding: "0.875rem 1rem",
    borderBottom: "1px solid var(--color-border)",
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} style={thStyle}>
              <SkeletonBox width="80%" height="12px" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} style={tdStyle}>
                <SkeletonBox width={c === 0 ? "70%" : c === cols - 1 ? "50%" : "60%"} height="14px" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <SkeletonBox width="48px" height="48px" style={{ borderRadius: "12px", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonBox width="60%" height="28px" style={{ marginBottom: "0.375rem" }} />
            <SkeletonBox width="40%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetailPage() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <SkeletonBox width="60%" height="20px" style={{ marginBottom: "1rem" }} />
          <SkeletonBox width="100%" height="80px" style={{ marginBottom: "1rem" }} />
          <SkeletonBox width="40%" height="12px" />
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <SkeletonBox width="30%" height="16px" style={{ marginBottom: "1rem" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBox key={i} width="80%" height="60px" />
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <SkeletonBox width="25%" height="16px" style={{ marginBottom: "0.875rem" }} />
          <SkeletonBox width="100%" height="120px" />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <SkeletonBox width="40%" height="14px" style={{ marginBottom: "1rem" }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBox key={i} width="100%" height="36px" style={{ marginBottom: "0.625rem" }} />
          ))}
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <SkeletonBox width="50%" height="16px" style={{ marginBottom: "1rem" }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBox key={i} width="100%" height="32px" style={{ marginBottom: "0.5rem" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
