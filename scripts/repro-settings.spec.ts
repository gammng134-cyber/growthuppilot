import { test, expect } from "@playwright/test";

test("repro settings save", async ({ page }) => {
  const email = `repro${Date.now()}@example.com`;
  await page.goto("/signup");
  await page.locator('input[placeholder="you@company.com"]').fill(email);
  await page.locator('input[placeholder="8+ characters"]').fill("password123");
  await page.locator('button:has-text("Create workspace")').click();
  await page.waitForURL(/\/app/);

  await page.goto("/app/settings");
  await page.waitForSelector('h1:has-text("Settings")');

  await page.locator('textarea[placeholder*="lightweight CRM"]').fill(
    "I built a lightweight CRM for small SaaS teams with 2-10 people. We replace spreadsheets with one shared inbox of deals, built-in sequences, and a 30-second onboarding."
  );
  await page.locator('textarea[placeholder*="Friendly, direct"]').fill(
    "Friendly, direct, founder-to-founder. Lowercase-first is fine. No buzzwords, no 'hope this finds you well', no follow-up guilt."
  );

  const btn = page.locator('button:has-text("Save settings")');
  await btn.click();

  await page.waitForTimeout(3000);

  const briefSet = await page.isVisible("text=Brief is set");
  console.log("Brief is set visible:", briefSet);
  const briefEmpty = await page.isVisible("text=Brief is empty");
  console.log("Brief is empty visible:", briefEmpty);

  expect(briefSet).toBe(true);
});
