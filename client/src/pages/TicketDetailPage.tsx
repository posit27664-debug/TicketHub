import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkeletonBox, SkeletonDetailPage } from "../components/Skeleton";
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

function AiPanel({ ticket }: { ticket: Ticket }) {
  const queryClient = useQueryClient();
  const ticketId = ticket.id;

  const mutation = useMutation({
    mutationFn: async (action: "classify" | "summarize" | "suggest") => {
      const endpoint =
        action === "classify"
          ? "/ai/classify"
          : action === "summarize"
          ? "/ai/summarize"
          : "/ai/suggest-reply";

      await api.post<{ ticket: Ticket }>(endpoint, { ticketId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", ticketId] });
    },
  });

  const aiBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.375rem 0.75rem",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid var(--color-border)",
    background: "var(--color-surface-2)",
    color: "var(--color-text)",
    justifyContent: "flex-start",
    transition: "all 0.15s ease",
  };

  return (
    <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="flex items-center" style={{ gap: "0.5rem", fontWeight: 600 }}>
        <Bot size={16} color="var(--color-primary)" />
        AI Assistant
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <button
          id="ai-classify-btn"
          style={aiBtn}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("classify")}
          onMouseEnter={(e) => {
            if (!mutation.isPending) { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = "var(--color-border-strong)"; }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-surface-2)"; e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          {mutation.isPending && mutation.variables === "classify" ? <Loader2 size={14} style={{ animation: "spin 0.6s linear infinite" }} /> : <Sparkles size={14} />}
          Auto-classify
        </button>
        <button
          id="ai-summarize-btn"
          style={aiBtn}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("summarize")}
          onMouseEnter={(e) => {
            if (!mutation.isPending) { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = "var(--color-border-strong)"; }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-surface-2)"; e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          {mutation.isPending && mutation.variables === "summarize" ? <Loader2 size={14} style={{ animation: "spin 0.6s linear infinite" }} /> : <FileText size={14} />}
          Generate Summary
        </button>
        <button
          id="ai-suggest-btn"
          style={aiBtn}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("suggest")}
          onMouseEnter={(e) => {
            if (!mutation.isPending) { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.borderColor = "var(--color-border-strong)"; }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-surface-2)"; e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          {mutation.isPending && mutation.variables === "suggest" ? <Loader2 size={14} style={{ animation: "spin 0.6s linear infinite" }} /> : <MessageCircle size={14} />}
          Suggest Reply
        </button>
      </div>

      {ticket.aiSummary && (
        <div style={{ background: "rgba(238, 242, 255, 0.5)", border: "1px solid rgba(199, 210, 254, 0.6)", borderRadius: "6px", padding: "0.875rem" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.025em", marginBottom: "0.375rem" }}>
            Summary
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-text)", lineHeight: 1.625 }}>
            {ticket.aiSummary}
          </p>
        </div>
      )}

      {ticket.aiSuggestedReply && (
        <div style={{ background: "rgba(236, 253, 245, 0.5)", border: "1px solid rgba(167, 243, 208, 0.6)", borderRadius: "6px", padding: "0.875rem" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-resolved)", textTransform: "uppercase", letterSpacing: "0.025em", marginBottom: "0.375rem" }}>
            Suggested Reply
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-text)", lineHeight: 1.625, whiteSpace: "pre-wrap" }}>
            {ticket.aiSuggestedReply}
          </p>
        </div>
      )}
    </div>
  );
}

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

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [replyBody, setReplyBody] = useState("");

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["tickets", id],
    queryFn: async () => {
      const { data } = await api.get<{ ticket: Ticket }>(`/tickets/${id}`);
      return data.ticket;
    },
    enabled: !!id,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["users", "agents"],
    queryFn: async () => {
      const { data } = await api.get<{ users: UserType[] }>("/users");
      return data.users.filter((u) => u.role === "AGENT");
    },
    enabled: user?.role === "ADMIN" && !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<Ticket>) => {
      const { data } = await api.patch<{ ticket: Ticket }>(`/tickets/${id}`, patch);
      return data.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", id] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/tickets/${id}/messages`, {
        body: replyBody,
        fromName: user!.name,
        fromEmail: user!.email,
        isAgent: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", id] });
      setReplyBody("");
    },
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <SkeletonBox style={{ width: "80px", height: "14px", marginBottom: "1.25rem" }} />
        <SkeletonDetailPage />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
        <p>Ticket not found</p>
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
            border: "none",
            background: "var(--color-primary)",
            color: "white",
            textDecoration: "none",
            marginTop: "1rem",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-primary)"; }}
        >
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
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
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "var(--color-text)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="flex justify-between" style={{ gap: "1rem", marginBottom: "1rem", alignItems: "flex-start" }}>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.625, flex: 1 }}>
                {ticket.subject}
              </h1>
              <div className="flex" style={{ gap: "0.5rem", flexShrink: 0 }}>
                <span className={getStatusBadgeClass(ticket.status)}>
                  {ticket.status}
                </span>
                <span className={getCategoryBadgeClass(ticket.category)}>
                  {formatCategoryLabel(ticket.category)}
                </span>
              </div>
            </div>

            {ticket.fromEmail && (
              <div className="flex items-center" style={{ gap: "0.5rem", color: "var(--color-text-muted)", fontSize: "13px", marginBottom: "1rem" }}>
                <User size={14} />
                {ticket.fromName} &lt;{ticket.fromEmail}&gt;
              </div>
            )}

            <div style={{ background: "var(--color-surface-2)", borderRadius: "6px", padding: "1rem", color: "var(--color-text)", lineHeight: 1.625, whiteSpace: "pre-wrap", fontSize: "15px" }}>
              {ticket.body}
            </div>

            <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--color-text-subtle)" }}>
              Created {formatDate(ticket.createdAt)} &middot; Updated {formatDate(ticket.updatedAt)}
            </div>
          </div>

          {(ticket.messages?.length ?? 0) > 0 && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontWeight: 600, fontSize: "15px", marginBottom: "1rem" }}>
                Conversation Thread
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {ticket.messages!.map((msg) => (
                  <div
                    key={msg.id}
                    style={{ display: "flex", flexDirection: "column", alignItems: msg.isAgent ? "flex-end" : "flex-start" }}
                  >
                    <div
                      style={{
                        maxWidth: "85%",
                        borderRadius: "10px",
                        padding: "0.875rem",
                        background: msg.isAgent ? "rgba(224, 231, 255, 0.5)" : "var(--color-surface-2)",
                        border: msg.isAgent ? "1px solid rgba(199, 210, 254, 0.6)" : "1px solid var(--color-border)",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.375rem", color: msg.isAgent ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                        {msg.fromName}
                        {msg.isAgent && " (Agent)"}
                      </div>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.625, whiteSpace: "pre-wrap" }}>
                        {msg.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontWeight: 600, fontSize: "15px", marginBottom: "0.875rem" }}>
              <Send size={14} style={{ display: "inline", marginRight: "0.5rem" }} />
              Send Reply
            </h2>
            <textarea
              id="reply-body"
              style={{ ...inputBase, minHeight: "120px", resize: "vertical" }}
              placeholder="Write your reply\u2026"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <div className="flex justify-end" style={{ marginTop: "0.75rem" }}>
              <button
                id="send-reply-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: replyMutation.isPending || !replyBody.trim() ? "not-allowed" : "pointer",
                  border: "none",
                  background: "var(--color-primary)",
                  color: "white",
                  transition: "all 0.15s ease",
                  opacity: replyMutation.isPending || !replyBody.trim() ? 0.5 : 1,
                }}
                disabled={replyMutation.isPending || !replyBody.trim()}
                onClick={() => replyMutation.mutate()}
                onMouseEnter={(e) => {
                  if (!replyMutation.isPending && replyBody.trim()) {
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
                {replyMutation.isPending ? <Loader2 size={14} style={{ animation: "spin 0.6s linear infinite" }} /> : <Send size={14} />}
                {replyMutation.isPending ? "Sending\u2026" : "Send Reply"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.025em", marginBottom: "1rem" }}>
              Properties
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>Status</label>
                <div className="relative">
                  <select
                    id="ticket-status"
                    style={{ ...inputBase, cursor: "pointer", appearance: "none", WebkitAppearance: "none", paddingRight: "1.5rem" }}
                    value={ticket.status}
                    disabled={updateMutation.isPending}
                    onChange={(e) => updateMutation.mutate({ status: e.target.value as TicketStatus })}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <option value="OPEN">Open</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-muted)" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>Category</label>
                <div className="relative">
                  <select
                    id="ticket-category"
                    style={{ ...inputBase, cursor: "pointer", appearance: "none", WebkitAppearance: "none", paddingRight: "1.5rem" }}
                    value={ticket.category}
                    disabled={updateMutation.isPending}
                    onChange={(e) => updateMutation.mutate({ category: e.target.value as TicketCategory })}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <option value="GENERAL_QUESTION">General Question</option>
                    <option value="TECHNICAL_QUESTION">Technical Question</option>
                    <option value="REFUND_REQUEST">Refund Request</option>
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-muted)" }} />
                </div>
              </div>

              {user?.role === "ADMIN" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>Assigned Agent</label>
                  <div className="relative">
                    <select
                      id="ticket-agent"
                      style={{ ...inputBase, cursor: "pointer", appearance: "none", WebkitAppearance: "none", paddingRight: "1.5rem" }}
                      value={ticket.assignedAgentId ?? ""}
                      disabled={updateMutation.isPending}
                      onChange={(e) => updateMutation.mutate({ assignedAgentId: e.target.value || null } as Partial<Ticket>)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-glow)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <option value="">Unassigned</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} style={{ position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-muted)" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <AiPanel ticket={ticket} />
        </div>
      </div>
    </div>
  );
}
