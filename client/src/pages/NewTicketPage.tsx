import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "6px",
  color: "var(--color-text)",
  fontSize: "0.875rem",
  padding: "0.625rem 0.875rem",
  outline: "none",
  transition: "all 0.15s ease",
};

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
    <div className="animate-fade-in" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <button
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.375rem 0.75rem",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          border: "none",
          background: "transparent",
          color: "var(--color-text-muted)",
          transition: "all 0.15s ease",
          marginBottom: "1.25rem",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.04)";
          e.currentTarget.style.color = "var(--color-text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--color-text-muted)";
        }}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>New Ticket</h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
          Create a new support ticket manually
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "0.375rem" }} htmlFor="from-name">From Name</label>
            <input
              id="from-name"
              style={inputBase}
              placeholder="Customer Name"
              value={form.fromName}
              onChange={(e) => setForm({ ...form, fromName: e.target.value })}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "0.375rem" }} htmlFor="from-email">From Email</label>
            <input
              id="from-email"
              style={inputBase}
              type="email"
              placeholder="customer@example.com"
              value={form.fromEmail}
              onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "0.375rem" }} htmlFor="subject">
            Subject <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            id="subject"
            style={inputBase}
            placeholder="What is the ticket about?"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "0.375rem" }} htmlFor="category">Category</label>
          <select
            id="category"
            style={{ ...inputBase, cursor: "pointer", appearance: "none", WebkitAppearance: "none", paddingRight: "1.5rem" }}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <option value="GENERAL_QUESTION">General Question</option>
            <option value="TECHNICAL_QUESTION">Technical Question</option>
            <option value="REFUND_REQUEST">Refund Request</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "0.375rem" }} htmlFor="body">
            Message <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <textarea
            id="body"
            style={{ ...inputBase, minHeight: "160px", resize: "vertical" }}
            placeholder="Describe the issue in detail\u2026"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {error && (
          <div style={{ background: "var(--color-red-50, #fef2f2)", border: "1px solid var(--color-red-200, #fecaca)", borderRadius: "6px", padding: "0.75rem", color: "var(--color-red-700, #b91c1c)", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <div className="flex justify-end" style={{ gap: "0.75rem" }}>
          <Link
            to="/tickets"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
              color: "var(--color-text)",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = "var(--color-border-strong)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-surface-2)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
          >
            Cancel
          </Link>
          <button
            id="create-ticket-btn"
            type="submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isLoading ? "not-allowed" : "pointer",
              border: "none",
              background: "var(--color-primary)",
              color: "white",
              transition: "all 0.15s ease",
              opacity: isLoading ? 0.5 : 1,
            }}
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = "var(--color-primary-hover)";
                e.currentTarget.style.boxShadow = "var(--color-shadow-glow)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "none";
            }}
          >
            <Send size={14} />
            {isLoading ? "Creating\u2026" : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
