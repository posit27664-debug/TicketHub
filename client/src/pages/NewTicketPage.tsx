import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import api from "../lib/api";
import { AppLayout } from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";

export function NewTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    subject: "",
    body: "",
    category: "GENERAL_QUESTION",
    fromName: "",
    fromEmail: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { data } = await api.post<{ ticket: { id: string } }>("/tickets", {
        subject: form.subject,
        body: form.body,
        category: form.category,
        fromName: form.fromName || user?.name,
        fromEmail: form.fromEmail || user?.email,
      });
      navigate(`/tickets/${data.ticket.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to create ticket";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="animate-fadeIn" style={{ maxWidth: 680 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
          style={{ marginBottom: "1.25rem" }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>New Ticket</h1>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4 }}>
            Create a new support ticket manually
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card"
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="label" htmlFor="from-name">From Name</label>
              <input
                id="from-name"
                className="input"
                placeholder="Customer Name"
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="from-email">From Email</label>
              <input
                id="from-email"
                className="input"
                type="email"
                placeholder="customer@example.com"
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="subject">
              Subject <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              id="subject"
              className="input"
              placeholder="What is the ticket about?"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="category">Category</label>
            <select
              id="category"
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="GENERAL_QUESTION">General Question</option>
              <option value="TECHNICAL_QUESTION">Technical Question</option>
              <option value="REFUND_REQUEST">Refund Request</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="body">
              Message <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <textarea
              id="body"
              className="input"
              placeholder="Describe the issue in detail…"
              style={{ minHeight: 160 }}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
          </div>

          {error && (
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
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <Link to="/tickets" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              id="create-ticket-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              <Send size={14} />
              {isLoading ? "Creating…" : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
