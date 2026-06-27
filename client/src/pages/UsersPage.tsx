import { useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkeletonTable } from "../components/Skeleton";
import { Trash2, Mail, Plus, X, Pencil } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../types";
import { formatDate } from "../lib/utils";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Valid email is required"),
  password: z.union([z.literal(""), z.string().min(8, "Password must be at least 8 characters")]),
});

type UserFormData = z.infer<typeof formSchema>;

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const isEdit = editingUser !== null;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

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

  const createMutation = useMutation({
    mutationFn: async (body: UserFormData) => {
      await api.post<{ user: User }>("/users", body);
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, string | undefined>) => {
      await api.patch(`/users/${id}`, body);
    },
  });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const cancelDelete = () => setDeleteTarget(null);

  const openCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
    reset({ name: "", email: "", password: "" });
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
    reset({ name: user.name, email: user.email, password: "" });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    reset();
  };

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      const body: Record<string, string> = { name: data.name, email: data.email };
      if (data.password) body.password = data.password;
      editMutation.mutate(
        { id: editingUser.id, ...body },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            closeModal();
          },
          onError: (err) => {
            const message =
              (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
              ?? "Failed to update user";
            setError("email", { message });
          },
        }
      );
    } else {
      if (!data.password) {
        setError("password", { message: "Password must be at least 8 characters" });
        return;
      }
      createMutation.mutate(data, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
          closeModal();
        },
        onError: (err) => {
          const message =
            (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
            ?? "Failed to create user";
          setError("email", { message });
        },
      });
    }
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
        <button
          onClick={openCreate}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "8px",
            border: "none",
            background: "var(--color-primary)",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <Plus size={16} />
          Create User
        </button>
      </div>

      {modalOpen && createPortal(
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            onClick={closeModal}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              zIndex: 1000,
              width: "440px",
              maxWidth: "calc(100vw - 2rem)",
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: "2rem",
              boxShadow: "0 25px 80px rgba(0,0,0,0.35)",
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
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
              }}
            >
              <X size={18} />
            </button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-text)" }}>
              {isEdit ? "Edit User" : "Create User"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", color: "var(--color-text)" }}>
                  Name
                </label>
                <input
                  {...register("name")}
                  placeholder="Full name"
                  autoComplete="off"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "6px",
                    border: `1px solid ${errors.name ? "#ef4444" : "var(--color-border)"}`,
                    fontSize: "0.875rem",
                    outline: "none",
                    backgroundColor: "var(--color-surface-2)",
                    color: "var(--color-text)",
                    boxSizing: "border-box",
                  }}
                />
                {errors.name && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.name.message}</p>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", color: "var(--color-text)" }}>
                  Email
                </label>
                <input
                  {...register("email")}
                  placeholder="email@example.com"
                  type="email"
                  autoComplete="off"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "6px",
                    border: `1px solid ${errors.email ? "#ef4444" : "var(--color-border)"}`,
                    fontSize: "0.875rem",
                    outline: "none",
                    backgroundColor: "var(--color-surface-2)",
                    color: "var(--color-text)",
                    boxSizing: "border-box",
                  }}
                />
                {errors.email && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.email.message}</p>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", color: "var(--color-text)" }}>
                  Password {isEdit && <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(leave blank to keep current)</span>}
                </label>
                <input
                  {...register("password")}
                  placeholder={isEdit ? "New password" : "Min. 8 characters"}
                  type="password"
                  autoComplete="new-password"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "6px",
                    border: `1px solid ${errors.password ? "#ef4444" : "var(--color-border)"}`,
                    fontSize: "0.875rem",
                    outline: "none",
                    backgroundColor: "var(--color-surface-2)",
                    color: "var(--color-text)",
                    boxSizing: "border-box",
                  }}
                />
                {errors.password && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.password.message}</p>}
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending || editMutation.isPending}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: createMutation.isPending || editMutation.isPending ? "var(--color-primary-muted)" : "var(--color-primary)",
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: createMutation.isPending || editMutation.isPending ? "not-allowed" : "pointer",
                  marginTop: "0.5rem",
                  transition: "opacity 0.15s ease",
                }}
              >
                {createMutation.isPending || editMutation.isPending
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : "Create User"
                }
              </button>
            </form>
          </div>
        </>,
        document.body
      )}

      {deleteTarget && createPortal(
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            onClick={cancelDelete}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              zIndex: 1000,
              width: "400px",
              maxWidth: "calc(100vw - 2rem)",
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: "2rem",
              boxShadow: "0 25px 80px rgba(0,0,0,0.35)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "rgba(239,68,68,0.1)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <Trash2 size={22} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-text)" }}>
              Delete User
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  background: deleteMutation.isPending ? "var(--color-primary-muted)" : "#ef4444",
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: deleteMutation.isPending ? "not-allowed" : "pointer",
                  transition: "opacity 0.15s ease",
                }}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

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
                <th style={{ ...thStyle, width: "100px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  style={{
                    transition: "background-color 0.1s ease",
                    backgroundColor: u.id === currentUser?.id ? "var(--color-primary-muted, rgba(59,130,246,0.08))" : undefined,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = u.id === currentUser?.id ? "var(--color-primary-muted, rgba(59,130,246,0.12))" : "rgba(0,0,0,0.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = u.id === currentUser?.id ? "var(--color-primary-muted, rgba(59,130,246,0.08))" : "transparent"; }}
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
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => openEdit(u)}
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
                        marginRight: "4px",
                      }}
                      title="Edit user"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(59,130,246,0.1)";
                        e.currentTarget.style.color = "#3b82f6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--color-text-subtle)";
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    {u.id !== currentUser?.id && u.role !== "ADMIN" && (
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
                        onClick={() => setDeleteTarget(u)}
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
