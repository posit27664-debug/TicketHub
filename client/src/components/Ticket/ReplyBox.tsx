import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CornerDownRight, CheckCircle2, Send, Loader2, Sparkles } from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-text)",
  fontSize: "0.9375rem",
  padding: "0.75rem 1rem",
  outline: "none",
  transition: "all 0.2s ease",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
};

export function ReplyBox({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");
  const [polishError, setPolishError] = useState("");

  const replyMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/tickets/${ticketId}/messages`, {
        body: replyBody,
        fromName: user!.name,
        fromEmail: user!.email,
        isAgent: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", ticketId] });
      setReplyBody("");
    },
  });

  const polishMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/ai/polish-reply", { body: replyBody });
      return data.polished as string;
    },
    onSuccess: (polished) => {
      setReplyBody(polished);
      setPolishError("");
    },
    onError: () => {
      setPolishError("Polishing failed — check your API key or quota.");
    },
  });

  return (
    <div className="card-glass" style={{ padding: "1.5rem", marginTop: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ background: "var(--color-primary-glow)", padding: "0.5rem", borderRadius: "10px" }}>
          <CornerDownRight size={18} color="var(--color-primary)" />
        </div>
        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text)" }}>
          Write a Reply
        </h2>
      </div>
      
      <textarea
        id="reply-body"
        style={{ 
          ...inputBase, 
          minHeight: "140px", 
          resize: "vertical", 
          background: "rgba(255, 255, 255, 0.5)",
          fontSize: "0.9375rem",
          padding: "1rem",
          lineHeight: 1.6
        }}
        placeholder="Type your response here... Markdown is supported."
        value={replyBody}
        onChange={(e) => setReplyBody(e.target.value)}
        onFocus={(e) => { 
          e.currentTarget.style.background = "var(--color-surface)";
          e.currentTarget.style.borderColor = "var(--color-primary)"; 
          e.currentTarget.style.boxShadow = "0 0 0 4px var(--color-primary-glow)"; 
        }}
        onBlur={(e) => { 
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
          e.currentTarget.style.borderColor = "var(--color-border)"; 
          e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.02)"; 
        }}
      />
      {polishError && (
        <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: "6px", backgroundColor: "var(--color-red-50, #fef2f2)", border: "1px solid var(--color-red-200, #fecaca)", color: "var(--color-red-700, #b91c1c)", fontSize: "0.8125rem" }}>
          {polishError}
        </div>
      )}
      <div className="flex justify-between items-center" style={{ marginTop: "1rem" }}>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle2 size={14} color="var(--color-success)" /> Replying as {user?.name}
        </div>
        <button
          id="polish-reply-btn"
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "10px",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: polishMutation.isPending || !replyBody.trim() ? "not-allowed" : "pointer",
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-text-muted)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: polishMutation.isPending || !replyBody.trim() ? 0.5 : 1,
          }}
          disabled={polishMutation.isPending || !replyBody.trim()}
          onClick={() => polishMutation.mutate()}
          onMouseEnter={(e) => {
            if (!polishMutation.isPending && replyBody.trim()) {
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.color = "var(--color-primary)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          {polishMutation.isPending ? <Loader2 size={15} style={{ animation: "spin 0.6s linear infinite" }} /> : <Sparkles size={15} />}
          {polishMutation.isPending ? "Polishing..." : "Polish"}
        </button>
        <button
          id="send-reply-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "10px",
            fontSize: "0.9375rem",
            fontWeight: 600,
            cursor: replyMutation.isPending || !replyBody.trim() ? "not-allowed" : "pointer",
            border: "none",
            background: "linear-gradient(135deg, var(--color-primary), #818cf8)",
            color: "white",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: replyMutation.isPending || !replyBody.trim() ? 0.6 : 1,
            boxShadow: !replyMutation.isPending && replyBody.trim() ? "0 4px 12px var(--color-primary-glow)" : "none",
          }}
          disabled={replyMutation.isPending || !replyBody.trim()}
          onClick={() => replyMutation.mutate()}
          onMouseEnter={(e) => {
            if (!replyMutation.isPending && replyBody.trim()) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px var(--color-primary-glow)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = !replyMutation.isPending && replyBody.trim() ? "0 4px 12px var(--color-primary-glow)" : "none";
          }}
        >
          {replyMutation.isPending ? <Loader2 size={16} style={{ animation: "spin 0.6s linear infinite" }} /> : <Send size={16} />}
          {replyMutation.isPending ? "Sending..." : "Send Reply"}
        </button>
      </div>
    </div>
  );
}
