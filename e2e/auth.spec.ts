import { test, expect } from "@playwright/test";

const uniqueEmail = () => `test-${Date.now()}@e2e.loop`;

test.describe("Authentication", () => {
  test("user can register, see workspace selector, and log out", async ({ page }) => {
    await page.goto("/register");

    await page.fill('[name="displayName"]', "E2E User");
    await page.fill('[name="email"]', uniqueEmail());
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // After register → workspace selector
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Your workspaces")).toBeVisible();
  });

  test("redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("/some-workspace/articles");
    await expect(page).toHaveURL("/login");
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "nobody@example.com");
    await page.fill('[name="password"]', "wrong");
    await page.click('button[type="submit"]');
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });
});
