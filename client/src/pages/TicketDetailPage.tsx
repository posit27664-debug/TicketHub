import { useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { SkeletonBox, SkeletonDetailPage } from "../components/Skeleton";
import { ArrowLeft, Tag } from "lucide-react";
import api from "../lib/api";
import type { Ticket } from "../types";

// Extracted Components
import { AiPanel } from "../components/Ticket/AiPanel";
import { TicketHeader } from "../components/Ticket/TicketHeader";
import { ConversationThread } from "../components/Ticket/ConversationThread";
import { ReplyBox } from "../components/Ticket/ReplyBox";
import { TicketProperties } from "../components/Ticket/TicketProperties";

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const autoClassified = useRef(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["tickets", id],
    queryFn: async () => {
      const { data } = await api.get<{ ticket: Ticket }>(`/tickets/${id}`);
      return data.ticket;
    },
    enabled: !!id,
  });

  const classifyMutation = useMutation({
    mutationFn: () => api.post("/ai/classify", { ticketId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  useEffect(() => {
    if (ticket && !autoClassified.current) {
      autoClassified.current = true;
      classifyMutation.mutate();
    }
  }, [ticket?.id]);

  if (isLoading) {
    return (
      <div className="animate-fade-in" style={{ padding: "1rem" }}>
        <SkeletonBox style={{ width: "100px", height: "36px", marginBottom: "1.5rem", borderRadius: "10px" }} />
        <SkeletonDetailPage />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 2rem", color: "var(--color-text-muted)" }}>
        <div style={{ background: "var(--color-surface-2)", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <Tag size={32} color="var(--color-text-subtle)" />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem" }}>Ticket Not Found</h2>
        <p style={{ fontSize: "1rem", marginBottom: "1.5rem" }}>The ticket you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/tickets"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "10px",
            fontSize: "0.9375rem",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            background: "var(--color-primary)",
            color: "white",
            textDecoration: "none",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px var(--color-primary-glow)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
        >
          <ArrowLeft size={16} /> Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "2rem" }}>
      <button
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          borderRadius: "10px",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
          border: "1px solid transparent",
          background: "var(--color-surface)",
          color: "var(--color-text-muted)",
          transition: "all 0.2s ease",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-sm)",
        }}
        onMouseEnter={(e) => { 
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.color = "var(--color-text)"; 
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
        }}
        onMouseLeave={(e) => { 
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.color = "var(--color-text-muted)"; 
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        }}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} /> Back to List
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>
        {/* Main Content Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <TicketHeader ticket={ticket} />
          <ConversationThread messages={ticket.messages || []} />
          <ReplyBox ticketId={ticket.id} />
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <AiPanel ticket={ticket} />
          <TicketProperties ticket={ticket} />
        </div>
      </div>
    </div>
  );
}
