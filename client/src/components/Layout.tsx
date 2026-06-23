import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tickets", icon: Ticket, label: "Tickets" },
];

const adminNavItems = [{ to: "/users", icon: Users, label: "Users" }];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1rem",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.25rem 0.5rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px var(--color-primary-glow)",
          }}
        >
          <Zap size={16} color="white" fill="white" />
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.9375rem",
            color: "var(--color-text)",
          }}
        >
          TicketHub
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.5625rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: isActive ? "var(--color-text)" : "var(--color-text-muted)",
              background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
              border: isActive
                ? "1px solid rgba(99,102,241,0.2)"
                : "1px solid transparent",
              transition: "all 0.15s ease",
            })}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <Icon size={16} />
                {label}
                {isActive ? (
                  <ChevronRight size={14} style={{ marginLeft: "auto" }} />
                ) : null}
              </>
            )}
          </NavLink>
        ))}

        {user?.role === "ADMIN" && (
          <>
            <div
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--color-text-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0.875rem 0.75rem 0.375rem",
              }}
            >
              Admin
            </div>
            {adminNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.5625rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: isActive
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                  background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                  border: isActive
                    ? "1px solid rgba(99,102,241,0.2)"
                    : "1px solid transparent",
                  transition: "all 0.15s ease",
                })}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          paddingTop: "1rem",
          marginTop: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div style={{ padding: "0 0.5rem" }}>
          <div
            style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text)" }}
          >
            {user?.name}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              marginTop: 2,
            }}
          >
            {user?.role}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ justifyContent: "flex-start" }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          padding: "2rem",
          overflowY: "auto",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
