
import { Bot, User } from "lucide-react";
import type { Message } from "../../types";
import { formatDate } from "../../lib/utils";

import DOMPurify from "dompurify";

export function ConversationThread({ messages }: { messages: Message[] }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ height: "1px", background: "var(--color-border)", flex: 1 }}></div>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Conversation History</span>
        <div style={{ height: "1px", background: "var(--color-border)", flex: 1 }}></div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: msg.isAgent ? "flex-end" : "flex-start",
              animation: "fadeIn 0.3s ease"
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", maxWidth: "85%", flexDirection: msg.isAgent ? "row-reverse" : "row" }}>
              <div style={{ 
                width: "32px", 
                height: "32px", 
                borderRadius: "50%", 
                background: msg.isAgent ? "linear-gradient(135deg, var(--color-primary), #818cf8)" : "var(--color-surface-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "var(--shadow-sm)"
              }}>
                {msg.isAgent ? <Bot size={16} color="white" /> : <User size={16} color="var(--color-text-muted)" />}
              </div>
              <div
                style={{
                  borderRadius: "16px",
                  borderBottomLeftRadius: !msg.isAgent ? "4px" : "16px",
                  borderBottomRightRadius: msg.isAgent ? "4px" : "16px",
                  padding: "1rem 1.25rem",
                  background: msg.isAgent ? "linear-gradient(to right, #eff6ff, #e0e7ff)" : "var(--color-surface)",
                  border: msg.isAgent ? "1px solid rgba(199, 210, 254, 0.6)" : "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: msg.isAgent ? "var(--color-primary)" : "var(--color-text)" }}>
                    {msg.fromName}
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                    {formatDate(msg.sentAt)}
                  </span>
                </div>
                <div 
                  style={{ fontSize: "0.9375rem", lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--color-text)" }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.body) }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
