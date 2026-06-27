import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TicketDetailPage } from "./TicketDetailPage";
import { renderWithQuery } from "../test/utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import api from "../lib/api";

vi.mock("../lib/api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockUseAuth = vi.fn();
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const baseTicket = {
  id: "1",
  subject: "Test",
  status: "OPEN",
  category: "GENERAL_QUESTION",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function renderPage() {
  return renderWithQuery(
    <MemoryRouter initialEntries={["/tickets/1"]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ 
    user: { id: "2", name: "Agent User", email: "agent@example.com", role: "AGENT" } 
  });
  vi.mocked(api.post).mockResolvedValue({ data: { ticket: baseTicket, category: "TECHNICAL_QUESTION" } });
});

describe("TicketDetailPage", () => {
  it("fetches agents from /users/agents and displays the Assigned Agent dropdown for agents", async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === "/tickets/1") {
        return { 
          data: { 
            ticket: { 
              id: "1", 
              subject: "Test", 
              status: "OPEN", 
              category: "GENERAL_QUESTION", 
              createdAt: "2026-01-01T00:00:00Z", 
              updatedAt: "2026-01-01T00:00:00Z" 
            } 
          } 
        };
      }
      if (url === "/users/agents") {
        return { data: { users: [{ id: "2", name: "Agent User" }] } };
      }
      return { data: {} };
    });

    renderPage();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/users/agents");
    });

    const label = await screen.findByText("Assigned Agent");
    expect(label).toBeInTheDocument();

    const select = document.getElementById("ticket-agent") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options[1].text).toBe("Agent User");
  });

  it("auto-classifies ticket in the background on load", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ticket: baseTicket } });

    renderPage();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/ai/classify", { ticketId: "1" });
    });
  });

  it("auto-classify does not block rendering", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ticket: baseTicket } });

    renderPage();

    expect(await screen.findByText("Test")).toBeInTheDocument();
  });
});
