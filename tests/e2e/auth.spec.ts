import { test, expect } from "@playwright/test";

test("landing page loads and shows the two live agents", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/GrowthPilot/);
  await expect(
    page.locator("h1"),
  ).toContainText("The marketing team that works while you build");
  // Hero agent mock cards (SEO + Email)
  await expect(
    page.locator("text=SEO Agent").locator("..").locator("text=indexed on Google"),
  ).toBeVisible();
  await expect(
    page.locator("text=Email Agent").locator("..").locator("text=waiting for your approval"),
  ).toBeVisible();
  await expect(
    page.locator("text=you approve every send"),
  ).toBeVisible();
});

test("sign up creates a workspace and lands in the app", async ({ page }) => {
  await page.goto("/signup");
  await expect(page).toHaveTitle(/Create your workspace/);
  await page.locator('input[placeholder="you@company.com"]').fill(
    `e2e${Date.now()}@example.com`,
  );
  await page.locator('input[placeholder="8+ characters"]').fill("password123");
  await page.locator('button:has-text("Create workspace")').click();
  await page.waitForURL("/app");
  await expect(page.locator("h1")).toContainText("Overview");
});

test("login returns to the app with a valid session", async ({ page }) => {
  // Arrange: the account must exist first; create it via the API, then prove
  // the UI login flow with those credentials.
  const email = `e2e${Date.now()}@example.com`;
  const res = await page.request.post("/api/auth/signup", {
    data: { email, password: "password123" },
  });
  expect(res.ok()).toBeTruthy();
  await page.goto("/login");
  await expect(page).toHaveTitle(/Sign in/);
  await expect(page.locator("h1")).toContainText("Welcome back");
  await page.locator('input[placeholder="you@company.com"]').fill(email);
  await page.locator('input[type="password"]').fill("password123");
  await page.locator('button:has-text("Sign in")').click();
  await page.waitForURL("/app");
  await expect(page.locator("h1")).toContainText("Overview");
});

test("logout clears the session and redirects to login", async ({ page }) => {
  await page.goto("/signup");
  await page.locator('input[placeholder="you@company.com"]').fill(
    `e2e${Date.now()}@example.com`,
  );
  await page.locator('input[placeholder="8+ characters"]').fill("password123");
  await page.locator('button:has-text("Create workspace")').click();
  await page.waitForSelector("text=Overview", { timeout: 15000 });
  await expect(page.locator("h1")).toContainText("Overview");
  await page.getByRole("button", { name: "Sign out" }).click();
  // The shell intentionally routes to the landing page after sign-out.
  await page.waitForURL("/", { timeout: 15000 });
  await expect(page.locator("h1")).toContainText(
    "The marketing team that works while you build",
  );
  // And the session is really gone: /app bounces back to login.
  await page.goto("/app");
  await expect(page).toHaveURL(/login/);
});

test("guests are redirected to login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/login/);
});
