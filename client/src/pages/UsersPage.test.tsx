import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UsersPage } from "./UsersPage";
import { renderWithQuery } from "../test/utils";

const mockUsers = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: "ADMIN" as const,
    createdAt: "2026-01-15T10:00:00Z",
    _count: { assignedTickets: 3 },
  },
  {
    id: "2",
    email: "agent@tickethub.com",
    name: "Agent User",
    role: "AGENT" as const,
    createdAt: "2026-02-20T14:30:00Z",
    _count: { assignedTickets: 5 },
  },
  {
    id: "3",
    email: "newagent@example.com",
    name: "New Agent",
    role: "AGENT" as const,
    createdAt: "2026-03-10T09:15:00Z",
    _count: { assignedTickets: 0 },
  },
];

vi.mock("../lib/api", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockUseAuth = vi.fn();
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

import api from "../lib/api";

function renderPage() {
  return renderWithQuery(<UsersPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: "1", name: "Admin User", email: "admin@example.com", role: "ADMIN" } });
});

describe("UsersPage", () => {
  it("shows skeleton while loading", () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector("table")).toBeInTheDocument();
  });

  it("shows empty state when no users", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { users: [] } });
    renderPage();
    expect(await screen.findByText("No users found")).toBeInTheDocument();
    expect(screen.getByText("0 users")).toBeInTheDocument();
  });

  it("shows correct user count for single user", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { users: [mockUsers[0]] } });
    renderPage();
    expect(await screen.findByText("1 user")).toBeInTheDocument();
  });

  it("renders all users in the table", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { users: mockUsers } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("Agent User")).toBeInTheDocument();
      expect(screen.getByText("New Agent")).toBeInTheDocument();
    });
  });

  it("displays user emails", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { users: mockUsers } });
    renderPage();
    expect(await screen.findByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("agent@tickethub.com")).toBeInTheDocument();
    expect(screen.getByText("newagent@example.com")).toBeInTheDocument();
  });

  it("displays role badges", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { users: mockUsers } });
    renderPage();
    await screen.findByText("Admin User");
    const adminBadge = screen.getByText("ADMIN");
    expect(adminBadge.className).toContain("bg-purple-50");
    const agentBadges = screen.getAllByText("AGENT");
    expect(agentBadges[0].className).toContain("bg-sky-50");
  });

  it("shows assigned ticket counts", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { users: mockUsers } });
    renderPage();
    await screen.findByText("Admin User");
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows 0 for users without _count", async () => {
    const usersWithoutCount = [{ ...mockUsers[0], _count: undefined }];
    vi.mocked(api.get).mockResolvedValue({ data: { users: usersWithoutCount } });
    renderPage();
    expect(await screen.findByText("0")).toBeInTheDocument();
  });

  it("shows formatted creation dates", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { users: mockUsers } });
    renderPage();
    await screen.findByText("Admin User");
    expect(screen.getByText(/^Jan 15, 2026,/)).toBeInTheDocument();
    expect(screen.getByText(/^Feb 20, 2026,/)).toBeInTheDocument();
  });

  it("hides delete button for current user", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "1", name: "Admin User", email: "admin@example.com", role: "ADMIN" } });
    vi.mocked(api.get).mockResolvedValue({ data: { users: mockUsers } });
    renderPage();
    await screen.findByText("Admin User");
    const deleteButtons = screen.getAllByTitle("Delete user");
    expect(deleteButtons).toHaveLength(2);
    expect(deleteButtons[0]).toBeInTheDocument();
  });

  it("shows delete button for other users", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "1", name: "Admin User", email: "admin@example.com", role: "ADMIN" } });
    vi.mocked(api.get).mockResolvedValue({ data: { users: mockUsers } });
    renderPage();
    await screen.findByText("Admin User");
    expect(screen.getAllByTitle("Delete user")).toHaveLength(2);
  });

  it("deletes a user on confirm", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { users: mockUsers } });
    vi.mocked(api.delete).mockResolvedValue({ data: {} });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();
    await screen.findByText("Admin User");
    const deleteBtn = screen.getAllByTitle("Delete user")[0];
    await userEvent.click(deleteBtn);
    expect(confirmSpy).toHaveBeenCalledWith("Are you sure you want to delete this user? This action cannot be undone.");
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/users/2");
    });
    confirmSpy.mockRestore();
  });

  it("does not delete when confirm is cancelled", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { users: mockUsers } });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderPage();
    await screen.findByText("Admin User");
    const deleteBtn = screen.getAllByTitle("Delete user")[0];
    await userEvent.click(deleteBtn);
    expect(api.delete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
