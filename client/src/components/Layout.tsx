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
    <header
      style={{
        height: "60px",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Zap size={18} color="var(--color-primary)" fill="var(--color-primary)" />
        <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--color-text)" }}>
          TicketHub
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.375rem 0.75rem",
            borderRadius: "6px",
            background: "rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-primary), #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text)", lineHeight: 1.25 }}>
              {user?.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-subtle)", lineHeight: 1.25 }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
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
            color: "var(--color-text-muted)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.04)";
            e.currentTarget.style.color = "var(--color-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
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
        width: "220px",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        alignSelf: "stretch",
      }}
    >
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.125rem" }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link${isActive ? " nav-link-active" : ""}`
            }
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
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-text-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "0 0.75rem 0.375rem 0.75rem",
                marginTop: "0.875rem",
              }}
            >
              Admin
            </div>
            {adminNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `nav-link${isActive ? " nav-link-active" : ""}`
                }
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
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "1.5rem", minWidth: 0, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
