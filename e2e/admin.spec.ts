import { test, expect } from "@playwright/test";

test.describe("Admin", () => {
  test("admin can see Users in sidebar", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@example.com");
    await page.fill("#password", "password123");
    await page.click("#login-submit");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await expect(page.locator("aside")).toContainText("Users");
  });

  test("admin can navigate to users page", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@example.com");
    await page.fill("#password", "password123");
    await page.click("#login-submit");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await page.click("a:has-text('Users')");
    await expect(page.locator("h1")).toHaveText("Users");
  });
});

test.describe("Agent Role Restrictions", () => {
  test("agent cannot see Users in sidebar", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "agent@tickethub.com");
    await page.fill("#password", "agent123");
    await page.click("#login-submit");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await expect(page.locator("aside")).not.toContainText("Users");
  });
});
