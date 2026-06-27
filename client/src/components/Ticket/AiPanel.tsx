import React from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Bot, Sparkles, FileText, MessageCircle, Loader2 } from "lucide-react";
import api from "../../lib/api";
import type { Ticket } from "../../types";

export function AiPanel({ ticket }: { ticket: Ticket }) {
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
    gap: "0.625rem",
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#fff",
    justifyContent: "flex-start",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(10px)",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
      borderRadius: "16px",
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      color: "white",
      boxShadow: "0 20px 25px -5px rgba(49, 46, 129, 0.2), 0 10px 10px -5px rgba(49, 46, 129, 0.1)",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(15px)" }}></div>
      <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "180px", height: "180px", background: "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(20px)" }}></div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 700, fontSize: "1.125rem", zIndex: 1 }}>
        <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.625rem", borderRadius: "12px", display: "flex", backdropFilter: "blur(5px)" }}>
          <Bot size={20} color="#a5b4fc" />
        </div>
        AI Assistant
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", zIndex: 1 }}>
        <button
          id="ai-classify-btn"
          style={aiBtn}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("classify")}
          onMouseEnter={(e) => {
            if (!mutation.isPending) { 
              e.currentTarget.style.background = "rgba(255,255,255,0.15)"; 
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)"; 
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          {mutation.isPending && mutation.variables === "classify" ? <Loader2 size={16} style={{ animation: "spin 0.6s linear infinite" }} /> : <Sparkles size={16} color="#c084fc" />}
          Auto-classify Ticket
        </button>
        <button
          id="ai-summarize-btn"
          style={aiBtn}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("summarize")}
          onMouseEnter={(e) => {
            if (!mutation.isPending) { 
              e.currentTarget.style.background = "rgba(255,255,255,0.15)"; 
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)"; 
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          {mutation.isPending && mutation.variables === "summarize" ? <Loader2 size={16} style={{ animation: "spin 0.6s linear infinite" }} /> : <FileText size={16} color="#60a5fa" />}
          Generate Summary
        </button>
        <button
          id="ai-suggest-btn"
          style={aiBtn}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("suggest")}
          onMouseEnter={(e) => {
            if (!mutation.isPending) { 
              e.currentTarget.style.background = "rgba(255,255,255,0.15)"; 
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)"; 
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          {mutation.isPending && mutation.variables === "suggest" ? <Loader2 size={16} style={{ animation: "spin 0.6s linear infinite" }} /> : <MessageCircle size={16} color="#34d399" />}
          Suggest Reply
        </button>
      </div>

      {ticket.aiSummary && (
        <div style={{ background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "12px", padding: "1.25rem", zIndex: 1, backdropFilter: "blur(10px)", animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "11px", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            <FileText size={14} /> AI Summary
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.95)", lineHeight: 1.6 }}>
            {ticket.aiSummary}
          </p>
        </div>
      )}

      {ticket.aiSuggestedReply && (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(52, 211, 153, 0.3)", borderRadius: "12px", padding: "1.25rem", zIndex: 1, backdropFilter: "blur(10px)", animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "11px", fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            <MessageCircle size={14} /> Suggested Reply
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.95)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {ticket.aiSuggestedReply}
          </p>
        </div>
      )}
    </div>
  );
}
