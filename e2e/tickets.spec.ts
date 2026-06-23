import { test, expect } from "@playwright/test";

test.describe("Tickets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@example.com");
    await page.fill("#password", "password123");
    await page.click("#login-submit");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("navigates to tickets page from dashboard", async ({ page }) => {
    await page.goto("/tickets");
    await expect(page.locator("h1")).toHaveText("Tickets");
  });

  test("displays seeded tickets", async ({ page }) => {
    await page.goto("/tickets");
    await expect(page.getByText("Refund request for React course").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Question about course certificate").first()).toBeVisible();
  });

  test("filters tickets by status", async ({ page }) => {
    await page.goto("/tickets");
    await page.click('button:has-text("OPEN")');
    await expect(page).toHaveURL(/status=OPEN/);
    await page.click('button:has-text("All")');
    await expect(page).not.toHaveURL(/status=/);
  });

  test("opens ticket detail page", async ({ page }) => {
    await page.goto("/tickets");
    await page.locator("a:has-text('course')").first().click();
    await expect(page.locator("text=Properties")).toBeVisible({ timeout: 10000 });
  });

  test("changes ticket status from detail page", async ({ page }) => {
    await page.goto("/tickets");
    await page.locator("a:has-text('course')").first().click();
    await expect(page.locator("#ticket-status")).toBeVisible({ timeout: 10000 });
    await page.selectOption("#ticket-status", "RESOLVED");
    await expect(page.getByText("RESOLVED", { exact: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test("creates a new ticket", async ({ page }) => {
    await page.goto("/tickets/new");
    await expect(page.locator("h1")).toHaveText("New Ticket");

    await page.fill("#subject", "Test ticket from e2e");
    await page.fill("#body", "This is a test ticket created by Playwright");
    await page.click("#create-ticket-btn");

    await expect(page).toHaveURL(/\/tickets\//, { timeout: 10000 });
  });
});
