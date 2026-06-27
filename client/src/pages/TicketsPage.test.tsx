import { waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TicketsPage } from "./TicketsPage";
import { renderWithQuery } from "../test/utils";
import { MemoryRouter } from "react-router-dom";
import api from "../lib/api";

vi.mock("../lib/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

function renderPage() {
  return renderWithQuery(
    <MemoryRouter>
      <TicketsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketsPage", () => {
  it("requests 10 tickets per page", async () => {
    vi.mocked(api.get).mockResolvedValue({ 
      data: { 
        tickets: [], 
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } 
      } 
    });
    
    renderPage();
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/tickets?page=1&limit=10&sortBy=createdAt&sortOrder=desc");
    });
  });
});
