import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows login form with email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toHaveText("TicketHub");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#login-submit")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "wrong@example.com");
    await page.fill("#password", "wrongpass");
    await page.click("#login-submit");
    await expect(page.locator("text=/Invalid|error|failed/i")).toBeVisible({ timeout: 10000 });
  });

  test("logs in as admin and redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@example.com");
    await page.fill("#password", "password123");
    await page.click("#login-submit");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("shows user name in top bar after login", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@example.com");
    await page.fill("#password", "password123");
    await page.click("#login-submit");
    await expect(page.locator("text=Admin User")).toBeVisible({ timeout: 10000 });
  });
});
