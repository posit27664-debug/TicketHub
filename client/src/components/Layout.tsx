import { NavLink, Outlet, useNavigate } from "react-router-dom";
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

function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header style={{
      height: 60,
      background: "var(--color-surface)",
      borderBottom: "1px solid var(--color-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      flexShrink: 0,
    }}>
      {/* Left: breadcrumb-style label */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Zap size={18} color="var(--color-primary)" fill="var(--color-primary)" />
        <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text)" }}>
          TicketHub
        </span>
      </div>

      {/* Right: user info + signout */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.375rem 0.75rem",
          borderRadius: "var(--radius-sm)",
          background: "rgba(255,255,255,0.03)",
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary), #818cf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", lineHeight: 1.3 }}>
              {user?.name}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--color-text-subtle)", lineHeight: 1.3 }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          title="Sign out"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </header>
  );
}

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem 0.75rem",
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
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
    </aside>
  );
}

export function AppLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopBar />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            padding: "1.5rem",
            overflowY: "auto",
            minWidth: 0,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
