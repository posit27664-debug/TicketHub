
import { User, Mail, Clock } from "lucide-react";
import type { Ticket } from "../../types";
import {
  getStatusBadgeClass,
  getCategoryBadgeClass,
  formatCategoryLabel,
  formatDate,
} from "../../lib/utils";

import DOMPurify from "dompurify";

export function TicketHeader({ ticket }: { ticket: Ticket }) {
  return (
    <div className="card-glass" style={{ padding: "2rem", borderTop: "4px solid var(--color-primary)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "var(--color-primary-glow)", borderRadius: "50%", filter: "blur(30px)", zIndex: 0 }}></div>
      
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="flex justify-between" style={{ gap: "1.5rem", marginBottom: "1.25rem", alignItems: "flex-start" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.3, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
            {ticket.subject}
          </h1>
          <div className="flex" style={{ gap: "0.5rem", flexShrink: 0 }}>
            <span className={getStatusBadgeClass(ticket.status)} style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem" }}>
              {ticket.status}
            </span>
            <span className={getCategoryBadgeClass(ticket.category)} style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem" }}>
              {formatCategoryLabel(ticket.category)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.9375rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center" style={{ gap: "0.5rem", fontWeight: 500 }}>
            <User size={16} color="var(--color-primary)" />
            <span style={{ color: "var(--color-text)" }}>{ticket.fromName}</span>
          </div>
          <div className="flex items-center" style={{ gap: "0.5rem" }}>
            <Mail size={16} color="var(--color-text-subtle)" />
            <a href={`mailto:${ticket.fromEmail}`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>{ticket.fromEmail}</a>
          </div>
          <div className="flex items-center" style={{ gap: "0.5rem" }}>
            <Clock size={16} color="var(--color-text-subtle)" />
            {formatDate(ticket.createdAt)}
          </div>
        </div>

        <div 
          style={{ color: "var(--color-text)", lineHeight: 1.7, whiteSpace: "pre-wrap", fontSize: "1rem" }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticket.body) }}
        />
      </div>
    </div>
  );
}
