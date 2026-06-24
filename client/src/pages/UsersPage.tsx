import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkeletonTable } from "../components/Skeleton";
import { Trash2, Mail } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../types";
import { formatDate } from "../lib/utils";

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

function getRoleBadgeClass(role: "ADMIN" | "AGENT"): string {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border";
  if (role === "ADMIN") {
    return `${base} bg-purple-50 text-purple-700 border-purple-200`;
  }
  return `${base} bg-sky-50 text-sky-700 border-sky-200`;
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get<{ users: User[] }>("/users");
      return data.users;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--color-text)" }}>Users</h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        {isLoading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
            <Mail size={40} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <p>No users found</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Assigned Tickets</th>
                <th style={thStyle}>Created</th>
                <th style={{ ...thStyle, width: "60px" }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  style={{ transition: "background-color 0.1s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ ...tdStyle, fontWeight: 500 }}>
                    {u.name}
                  </td>
                  <td style={{ ...tdStyle, color: "var(--color-text-muted)" }}>
                    {u.email}
                  </td>
                  <td style={tdStyle}>
                    <span className={getRoleBadgeClass(u.role)}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--color-text-muted)" }}>
                    {u._count?.assignedTickets ?? 0}
                  </td>
                  <td style={{ ...tdStyle, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td style={tdStyle}>
                    {u.id !== currentUser?.id && (
                      <button
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          border: "none",
                          background: "transparent",
                          color: "var(--color-text-subtle)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          opacity: deleteMutation.isPending && deleteMutation.variables === u.id ? 0.5 : 1,
                        }}
                        title="Delete user"
                        disabled={deleteMutation.isPending && deleteMutation.variables === u.id}
                        onClick={() => handleDelete(u.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--color-text-subtle)";
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
