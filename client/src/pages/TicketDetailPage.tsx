import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  Sparkles,
  FileText,
  MessageCircle,
  User,
  Send,
  Loader2,
  ChevronDown,
} from "lucide-react";
import api from "../lib/api";
import type { Ticket, User as UserType, TicketStatus, TicketCategory } from "../types";
import {
  getStatusBadgeClass,
  getCategoryBadgeClass,
  formatCategoryLabel,
  formatDate,
} from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

function AiPanel({ ticket, onUpdate }: { ticket: Ticket; onUpdate: (t: Ticket) => void }) {
  const [loading, setLoading] = useState<"classify" | "summarize" | "suggest" | null>(null);

  const runAi = async (action: "classify" | "summarize" | "suggest") => {
    setLoading(action);
    try {
      const endpoint =
        action === "classify"
          ? "/ai/classify"
          : action === "summarize"
          ? "/ai/summarize"
          : "/ai/suggest-reply";

      const { data } = await api.post<{ ticket: Ticket }>(endpoint, {
        ticketId: ticket.id,
      });
      onUpdate(data.ticket);
    } catch (err) {
      console.error("AI action failed", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontWeight: 600,
        }}
      >
        <Bot size={16} color="var(--color-primary)" />
        AI Assistant
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <button
          id="ai-classify-btn"
          className="btn btn-secondary btn-sm"
          style={{ justifyContent: "flex-start" }}
          disabled={loading !== null}
          onClick={() => runAi("classify")}
        >
          {loading === "classify" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Auto-classify
        </button>
        <button
          id="ai-summarize-btn"
          className="btn btn-secondary btn-sm"
          style={{ justifyContent: "flex-start" }}
          disabled={loading !== null}
          onClick={() => runAi("summarize")}
        >
          {loading === "summarize" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          Generate Summary
        </button>
        <button
          id="ai-suggest-btn"
          className="btn btn-secondary btn-sm"
          style={{ justifyContent: "flex-start" }}
          disabled={loading !== null}
          onClick={() => runAi("suggest")}
        >
          {loading === "suggest" ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
          Suggest Reply
        </button>
      </div>

      {ticket.aiSummary && (
        <div
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "0.875rem",
          }}
        >
          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--color-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "0.375rem",
            }}
          >
            Summary
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text)", lineHeight: 1.6 }}>
            {ticket.aiSummary}
          </p>
        </div>
      )}

      {ticket.aiSuggestedReply && (
        <div
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "0.875rem",
          }}
        >
          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--color-resolved)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "0.375rem",
            }}
          >
            Suggested Reply
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {ticket.aiSuggestedReply}
          </p>
        </div>
      )}
    </div>
  );
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [agents, setAgents] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ ticket: Ticket }>(`/tickets/${id}`),
      user?.role === "ADMIN"
        ? api.get<{ users: UserType[] }>("/users")
        : Promise.resolve({ data: { users: [] } }),
    ])
      .then(([tRes, uRes]) => {
        setTicket(tRes.data.ticket);
        setAgents(uRes.data.users.filter((u) => u.role === "AGENT"));
      })
      .finally(() => setIsLoading(false));
  }, [id, user]);

  const handleUpdate = async (patch: Partial<Ticket>) => {
    if (!ticket) return;
    setIsUpdating(true);
    try {
      const { data } = await api.patch<{ ticket: Ticket }>(
        `/tickets/${ticket.id}`,
        patch
      );
      setTicket(data.ticket);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!ticket || !replyBody.trim()) return;
    setIsSending(true);
    try {
      await api.post(`/tickets/${ticket.id}/messages`, {
        body: replyBody,
        fromName: user!.name,
        fromEmail: user!.email,
        isAgent: true,
      });
      // Refresh ticket with messages
      const { data } = await api.get<{ ticket: Ticket }>(`/tickets/${ticket.id}`);
      setTicket(data.ticket);
      setReplyBody("");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
    );
  }

  if (!ticket) {
    return (
      <div className="empty-state">
          <p>Ticket not found</p>
          <Link to="/tickets" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Back to Tickets
          </Link>
        </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 1100 }}>
        {/* Back button */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
          style={{ marginBottom: "1.25rem" }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }}>
          {/* Main content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Header card */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <h1
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    lineHeight: 1.4,
                    flex: 1,
                  }}
                >
                  {ticket.subject}
                </h1>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <span className={getStatusBadgeClass(ticket.status)}>
                    {ticket.status}
                  </span>
                  <span className={getCategoryBadgeClass(ticket.category)}>
                    {formatCategoryLabel(ticket.category)}
                  </span>
                </div>
              </div>

              {ticket.fromEmail && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "var(--color-text-muted)",
                    fontSize: "0.8125rem",
                    marginBottom: "1rem",
                  }}
                >
                  <User size={14} />
                  {ticket.fromName} &lt;{ticket.fromEmail}&gt;
                </div>
              )}

              <div
                style={{
                  background: "var(--color-surface-2)",
                  borderRadius: "var(--radius-sm)",
                  padding: "1rem",
                  color: "var(--color-text)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  fontSize: "0.9375rem",
                }}
              >
                {ticket.body}
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  fontSize: "0.75rem",
                  color: "var(--color-text-subtle)",
                }}
              >
                Created {formatDate(ticket.createdAt)} · Updated {formatDate(ticket.updatedAt)}
              </div>
            </div>

            {/* Messages / Thread */}
            {(ticket.messages?.length ?? 0) > 0 && (
              <div className="card">
                <h2
                  style={{ fontWeight: 600, marginBottom: "1rem", fontSize: "0.9375rem" }}
                >
                  Conversation Thread
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {ticket.messages!.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: msg.isAgent ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "85%",
                          background: msg.isAgent
                            ? "rgba(99,102,241,0.15)"
                            : "var(--color-surface-2)",
                          border: msg.isAgent
                            ? "1px solid rgba(99,102,241,0.25)"
                            : "1px solid var(--color-border)",
                          borderRadius: "var(--radius-md)",
                          padding: "0.75rem 1rem",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: msg.isAgent
                              ? "var(--color-primary)"
                              : "var(--color-text-muted)",
                            marginBottom: "0.375rem",
                          }}
                        >
                          {msg.fromName}
                          {msg.isAgent && " (Agent)"}
                        </div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {msg.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply box */}
            <div className="card">
              <h2 style={{ fontWeight: 600, marginBottom: "0.875rem", fontSize: "0.9375rem" }}>
                <Send size={14} style={{ marginRight: "0.5rem", display: "inline" }} />
                Send Reply
              </h2>
              <textarea
                id="reply-body"
                className="input"
                style={{ minHeight: 120 }}
                placeholder="Write your reply…"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                <button
                  id="send-reply-btn"
                  className="btn btn-primary"
                  disabled={isSending || !replyBody.trim()}
                  onClick={handleSendReply}
                >
                  {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {isSending ? "Sending…" : "Send Reply"}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Properties */}
            <div className="card">
              <h2
                style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Properties
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {/* Status */}
                <div>
                  <label className="label">Status</label>
                  <div style={{ position: "relative" }}>
                    <select
                      id="ticket-status"
                      className="input"
                      value={ticket.status}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleUpdate({ status: e.target.value as TicketStatus })
                      }
                    >
                      <option value="OPEN">Open</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <ChevronDown
                      size={14}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "var(--color-text-muted)",
                      }}
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="label">Category</label>
                  <div style={{ position: "relative" }}>
                    <select
                      id="ticket-category"
                      className="input"
                      value={ticket.category}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleUpdate({ category: e.target.value as TicketCategory })
                      }
                    >
                      <option value="GENERAL_QUESTION">General Question</option>
                      <option value="TECHNICAL_QUESTION">Technical Question</option>
                      <option value="REFUND_REQUEST">Refund Request</option>
                    </select>
                    <ChevronDown
                      size={14}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "var(--color-text-muted)",
                      }}
                    />
                  </div>
                </div>

                {/* Assign Agent (Admin only) */}
                {user?.role === "ADMIN" && (
                  <div>
                    <label className="label">Assigned Agent</label>
                    <div style={{ position: "relative" }}>
                      <select
                        id="ticket-agent"
                        className="input"
                        value={ticket.assignedAgentId ?? ""}
                        disabled={isUpdating}
                        onChange={(e) =>
                          handleUpdate({
                            assignedAgentId: e.target.value || null,
                          } as Partial<Ticket>)
                        }
                      >
                        <option value="">Unassigned</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "var(--color-text-muted)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Panel */}
            <AiPanel ticket={ticket} onUpdate={setTicket} />
          </div>
        </div>
      </div>
  );
}
