import { useEffect, useState, type FormEvent } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Loader2,
  Users as UsersIcon,
} from "lucide-react";
import api from "../lib/api";
import type { User } from "../types";
import { formatDate } from "../lib/utils";
import { AppLayout } from "../components/Layout";

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "AGENT";
}

const defaultForm: UserFormData = {
  name: "",
  email: "",
  password: "",
  role: "AGENT",
};

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(defaultForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data } = await api.get<{ users: User[] }>("/users");
    setUsers(data.users);
    setIsLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(defaultForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const payload: Partial<UserFormData> = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${editingUser.id}`, payload);
      } else {
        await api.post("/users", form);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Something went wrong";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="animate-fadeIn" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.625rem", fontWeight: 700 }}>Users</h1>
            <p style={{ color: "var(--color-text-muted)", marginTop: 4 }}>
              Manage agents and admins
            </p>
          </div>
          <button id="create-user-btn" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Add User
          </button>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <div className="spinner" />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <UsersIcon size={40} />
              <p>No users found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Tickets</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>{u.email}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.2rem 0.6rem",
                          borderRadius: 100,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background:
                            u.role === "ADMIN"
                              ? "rgba(99,102,241,0.15)"
                              : "rgba(255,255,255,0.06)",
                          color:
                            u.role === "ADMIN"
                              ? "#a5b4fc"
                              : "var(--color-text-muted)",
                          border:
                            u.role === "ADMIN"
                              ? "1px solid rgba(99,102,241,0.3)"
                              : "1px solid var(--color-border)",
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-text-muted)" }}>
                      {u._count?.assignedTickets ?? 0}
                    </td>
                    <td
                      style={{
                        color: "var(--color-text-muted)",
                        fontSize: "0.8125rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(u.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEditModal(u)}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id}
                          title="Delete"
                        >
                          {deletingId === u.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            className="card animate-fadeIn"
            style={{ width: "100%", maxWidth: 480, padding: "2rem" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ fontWeight: 700, fontSize: "1.125rem" }}>
                {editingUser ? "Edit User" : "Add User"}
              </h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label className="label" htmlFor="user-name">Name</label>
                <input
                  id="user-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="user-email">Email</label>
                <input
                  id="user-email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="user-password">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <input
                  id="user-password"
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingUser}
                  minLength={8}
                  placeholder={editingUser ? "••••••••" : "Min. 8 characters"}
                />
              </div>
              <div>
                <label className="label" htmlFor="user-role">Role</label>
                <select
                  id="user-role"
                  className="input"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as "ADMIN" | "AGENT" })
                  }
                >
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {formError && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.75rem",
                    color: "#fca5a5",
                    fontSize: "0.875rem",
                  }}
                >
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.25rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  id="user-form-submit"
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  {editingUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
