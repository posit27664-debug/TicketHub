import React from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Tag, ChevronDown } from "lucide-react";
import api from "../../lib/api";
import type { Ticket, TicketStatus, TicketCategory, User as UserType } from "../../types";

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

export function TicketProperties({ ticket }: { ticket: Ticket }) {
  const queryClient = useQueryClient();

  const { data: agents = [] } = useQuery({
    queryKey: ["users", "agents"],
    queryFn: async () => {
      const { data } = await api.get<{ users: UserType[] }>("/users/agents");
      return data.users;
    },
    enabled: !!ticket.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<Ticket>) => {
      const { data } = await api.patch<{ ticket: Ticket }>(`/tickets/${ticket.id}`, patch);
      return data.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", ticket.id] });
    },
  });

  return (
    <div className="card-glass" style={{ padding: "1.5rem" }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)", marginBottom: "1.25rem" }}>
        <Tag size={16} color="var(--color-primary)" /> Ticket Properties
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Status</label>
          <div className="relative">
            <select
              id="ticket-status"
              style={{ ...inputBase, cursor: "pointer", appearance: "none", WebkitAppearance: "none", paddingRight: "2.5rem", fontWeight: 500 }}
              value={ticket.status}
              disabled={updateMutation.isPending}
              onChange={(e) => updateMutation.mutate({ status: e.target.value as TicketStatus })}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 4px var(--color-primary-glow)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.02)"; }}
            >
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", background: "var(--color-surface-2)", borderRadius: "6px" }}>
              <ChevronDown size={14} color="var(--color-text-muted)" />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Category</label>
          <div className="relative">
            <select
              id="ticket-category"
              style={{ ...inputBase, cursor: "pointer", appearance: "none", WebkitAppearance: "none", paddingRight: "2.5rem", fontWeight: 500 }}
              value={ticket.category}
              disabled={updateMutation.isPending}
              onChange={(e) => updateMutation.mutate({ category: e.target.value as TicketCategory })}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 4px var(--color-primary-glow)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.02)"; }}
            >
              <option value="GENERAL_QUESTION">General Question</option>
              <option value="TECHNICAL_QUESTION">Technical Question</option>
              <option value="REFUND_REQUEST">Refund Request</option>
            </select>
            <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", background: "var(--color-surface-2)", borderRadius: "6px" }}>
              <ChevronDown size={14} color="var(--color-text-muted)" />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Assigned Agent</label>
          <div className="relative">
            <select
              id="ticket-agent"
              style={{ ...inputBase, cursor: "pointer", appearance: "none", WebkitAppearance: "none", paddingRight: "2.5rem", fontWeight: 500 }}
              value={ticket.assignedAgentId ?? ""}
              disabled={updateMutation.isPending}
              onChange={(e) => updateMutation.mutate({ assignedAgentId: e.target.value || null } as Partial<Ticket>)}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 0 0 4px var(--color-primary-glow)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.02)"; }}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", background: "var(--color-surface-2)", borderRadius: "6px" }}>
              <ChevronDown size={14} color="var(--color-text-muted)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
