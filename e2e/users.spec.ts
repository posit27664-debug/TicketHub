import { test, expect } from "@playwright/test";

test.describe("User Management", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@example.com");
    await page.fill("#password", "password123");
    await page.click("#login-submit");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.click("a:has-text('Users')");
    await expect(page.locator("h1")).toHaveText("Users");
  });

  test("opens create user modal and validates required fields", async ({ page }) => {
    await page.locator("button").filter({ hasText: "Create User" }).first().click();
    await expect(page.locator("h2")).toHaveText("Create User");

    await page.getByRole("button", { name: /Create User/i }).last().click();

    await expect(page.getByText("Name must be at least 3 characters")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Valid email is required")).toBeVisible({ timeout: 3000 });
  });

  test("creates a new user successfully", async ({ page }) => {
    const testEmail = `e2e-create-${Date.now()}@example.com`;

    await page.locator("button").filter({ hasText: "Create User" }).first().click();
    await expect(page.locator("h2")).toHaveText("Create User");

    await page.locator('input[placeholder="Full name"]').fill("E2E Create Test");
    await page.locator('input[placeholder="email@example.com"]').fill(testEmail);
    await page.locator('input[placeholder="Min. 8 characters"]').fill("testpass123");

    await page.locator('form button[type="submit"]').click();

    await expect(page.locator("h2")).not.toBeAttached({ timeout: 5000 });
    await expect(page.getByText(testEmail)).toBeVisible();
  });

  test("shows error when creating duplicate email", async ({ page }) => {
    await page.locator("button").filter({ hasText: "Create User" }).first().click();
    await expect(page.locator("h2")).toHaveText("Create User");

    await page.locator('input[placeholder="Full name"]').fill("Duplicate Email");
    await page.locator('input[placeholder="email@example.com"]').fill("agent@tickethub.com");
    await page.locator('input[placeholder="Min. 8 characters"]').fill("testpass123");

    await page.locator('form button[type="submit"]').click();

    await expect(page.locator("text=Email already in use")).toBeVisible({ timeout: 5000 });
  });

  test("edits user name and email", async ({ page }) => {
    await page.locator('button[title="Edit user"]').first().click();
    await expect(page.locator("h2")).toHaveText("Edit User");

    const nameInput = page.locator('input[placeholder="Full name"]');
    await nameInput.clear();
    await nameInput.fill("E2E Updated Agent");

    const emailInput = page.locator('input[placeholder="email@example.com"]');
    await emailInput.clear();
    await emailInput.fill(`e2e-updated-${Date.now()}@example.com`);

    await page.locator('form button[type="submit"]').click();

    await expect(page.locator("h2")).not.toBeAttached({ timeout: 5000 });
    await expect(page.getByText("E2E Updated Agent").first()).toBeVisible();
  });

  test("updates user password", async ({ page }) => {
    await page.locator('button[title="Edit user"]').first().click();
    await expect(page.locator("h2")).toHaveText("Edit User");

    await page.locator('input[placeholder="New password"]').fill("newpass12345");

    await page.locator('form button[type="submit"]').click();

    await expect(page.locator("h2")).not.toBeAttached({ timeout: 5000 });
  });

  test("cancels delete operation", async ({ page }) => {
    const userRows = page.locator("table tbody tr");
    const countBefore = await userRows.count();

    await page.locator('button[title="Delete user"]').first().click();
    await expect(page.locator("h2")).toHaveText("Delete User");

    await page.locator('button:has-text("Cancel")').click();

    await expect(page.locator("h2")).not.toBeAttached();
    await expect(userRows).toHaveCount(countBefore);
  });

  test("deletes a non-admin user", async ({ page }) => {
    const userRows = page.locator("table tbody tr");
    const countBefore = await userRows.count();

    await page.locator('button[title="Delete user"]').first().click();
    await expect(page.locator("h2")).toHaveText("Delete User");

    await page.locator('button:has-text("Delete")').click();

    await expect(page.locator("h2")).not.toBeAttached({ timeout: 5000 });
    await expect(userRows).toHaveCount(countBefore - 1);
  });

  test("admin user has no delete button", async ({ page }) => {
    const adminRow = page.locator("table tbody tr", { hasText: "admin@example.com" });
    await expect(adminRow).toBeVisible();
    await expect(adminRow.locator('button[title="Delete user"]')).toHaveCount(0);
  });

  test("agent user cannot access users page", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "agent@tickethub.com");
    await page.fill("#password", "agent123");
    await page.click("#login-submit");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await page.goto("/users");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
