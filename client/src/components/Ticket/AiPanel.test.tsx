import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AiPanel } from "./AiPanel";
import { renderWithQuery } from "../../test/utils";
import api from "../../lib/api";
import type { Ticket } from "../../types";

vi.mock("../../lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const baseTicket: Ticket = {
  id: "1",
  subject: "Test ticket",
  body: "Customer needs help",
  status: "OPEN",
  category: "GENERAL_QUESTION",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  messages: [],
};

function renderTicket(overrides: Partial<Ticket> = {}) {
  return renderWithQuery(<AiPanel ticket={{ ...baseTicket, ...overrides }} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AiPanel", () => {
  it("renders the Generate Summary button", () => {
    renderTicket();
    expect(screen.getByRole("button", { name: /generate summary/i })).toBeInTheDocument();
  });

  it("calls /ai/summarize with ticketId on click", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ticket: baseTicket } });
    renderTicket();
    await userEvent.click(screen.getByRole("button", { name: /generate summary/i }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/ai/summarize", { ticketId: "1" });
    });
  });

  it("disables all buttons while summarize is pending", async () => {
    vi.mocked(api.post).mockImplementation(() => new Promise(() => {}));
    renderTicket();
    await userEvent.click(screen.getByRole("button", { name: /generate summary/i }));
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("shows AI Summary section when ticket has aiSummary", () => {
    renderTicket({ aiSummary: "Customer needs help with login issue." });
    expect(screen.getByText("AI Summary")).toBeInTheDocument();
    expect(screen.getByText("Customer needs help with login issue.")).toBeInTheDocument();
  });

  it("regenerates summary on second click (calls API again)", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ticket: baseTicket } });
    renderTicket({ aiSummary: "Old summary" });
    await userEvent.click(screen.getByRole("button", { name: /generate summary/i }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });
    vi.mocked(api.post).mockResolvedValue({ data: { ticket: { ...baseTicket, aiSummary: "New summary" } } });
    await userEvent.click(screen.getByRole("button", { name: /generate summary/i }));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2);
    });
  });

  it("does not show AI Summary section when ticket has no aiSummary", () => {
    renderTicket({ aiSummary: undefined });
    expect(screen.queryByText("AI Summary")).not.toBeInTheDocument();
  });
});
