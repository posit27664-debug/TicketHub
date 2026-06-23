import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@example.com");
    await page.fill("#password", "password123");
    await page.click("#login-submit");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("displays stats cards", async ({ page }) => {
    await expect(page.getByText("Open Tickets")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Resolved").first()).toBeVisible();
    await expect(page.getByText("Closed").first()).toBeVisible();
    await expect(page.getByText("Total Tickets")).toBeVisible();
  });

  test("shows recent tickets table", async ({ page }) => {
    await expect(page.locator("text=Recent Tickets")).toBeVisible({ timeout: 10000 });
  });

  test("displays category breakdown", async ({ page }) => {
    await expect(page.locator("text=By Category")).toBeVisible({ timeout: 10000 });
  });
});
