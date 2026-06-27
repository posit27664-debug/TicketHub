import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReplyBox } from "./ReplyBox";
import { renderWithQuery } from "../../test/utils";
import api from "../../lib/api";

vi.mock("../../lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function render() {
  return renderWithQuery(<ReplyBox ticketId="1" />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    user: { id: "2", name: "Agent User", email: "agent@example.com", role: "AGENT" },
  });
});

describe("ReplyBox", () => {
  it("disables polish button when textarea is empty", () => {
    render();
    const btn = screen.getByRole("button", { name: /polish/i });
    expect(btn).toBeDisabled();
  });

  it("enables polish button when textarea has text", async () => {
    render();
    const textarea = screen.getByPlaceholderText(/type your response/i);
    await userEvent.type(textarea, "Hello world");
    const btn = screen.getByRole("button", { name: /polish/i });
    expect(btn).toBeEnabled();
  });

  it("calls /ai/polish-reply with reply body on click", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { polished: "Polished text" } });
    render();
    const textarea = screen.getByPlaceholderText(/type your response/i);
    await userEvent.type(textarea, "My draft reply");
    const btn = screen.getByRole("button", { name: /polish/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/ai/polish-reply", { body: "My draft reply" });
    });
  });

  it("updates textarea with polished text on success", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { polished: "Polished text" } });
    render();
    const textarea = screen.getByPlaceholderText(/type your response/i);
    await userEvent.type(textarea, "My draft reply");
    const btn = screen.getByRole("button", { name: /polish/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(textarea).toHaveValue("Polished text");
    });
  });

  it("shows error message when polish fails", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("API error"));
    render();
    const textarea = screen.getByPlaceholderText(/type your response/i);
    await userEvent.type(textarea, "My draft reply");
    const btn = screen.getByRole("button", { name: /polish/i });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText(/polishing failed/i)).toBeInTheDocument();
    });
  });

  it("shows Polishing... while request is pending", async () => {
    vi.mocked(api.post).mockImplementation(
      () => new Promise(() => {})
    );
    render();
    const textarea = screen.getByPlaceholderText(/type your response/i);
    await userEvent.type(textarea, "My draft reply");
    const btn = screen.getByRole("button", { name: /polish/i });
    await userEvent.click(btn);
    expect(await screen.findByText("Polishing...")).toBeInTheDocument();
  });
});
