import { chromium } from "@playwright/test";

const BASE = "http://localhost:57340";
const email = `repro${Date.now()}@example.com`;

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  // Sign up
  await page.goto("/signup");
  await page.locator('input[placeholder="you@company.com"]').fill(email);
  await page.locator('input[placeholder="8+ characters"]').fill("password123");
  await page.locator('button:has-text("Create workspace")').click();
  await page.waitForURL(/\\/app/);
  console.log("Signed up, title:", await page.title());

  // Go to settings
  await page.goto("/app/settings");
  await page.waitForSelector('h1:has-text("Settings")');
  console.log("Settings page loaded, title:", await page.title());

  // Fill brief
  const briefInput = page.locator('textarea[placeholder*="lightweight CRM"]');
  console.log("Brief input count:", await briefInput.count());
  await briefInput.fill(
    "I built a lightweight CRM for small SaaS teams with 2-10 people. We replace spreadsheets with one shared inbox of deals, built-in sequences, and a 30-second onboarding."
  );
  await page.locator('textarea[placeholder*="Friendly, direct"]').fill(
    "Friendly, direct, founder-to-founder. Lowercase-first is fine. No buzzwords, no 'hope this finds you well', no follow-up guilt."
  );
  console.log("Filled textareas");

  // Click save
  const btn = page.locator('button:has-text("Save settings")');
  console.log("Save button count:", await btn.count());
  await btn.click();
  console.log("Clicked save");

  // Wait and check
  await page.waitForTimeout(2000);
  const briefState = await page.textContent('text=Brief is set');
  console.log("Brief is set text:", briefState);
  const briefEmpty = await page.textContent('text=Brief is empty');
  console.log("Brief is empty text:", briefEmpty);

  const header = await page.locator('text=Brief is set').first().isVisible();
  console.log("text=Brief is set visible:", header);
} catch (e) {
  console.error("ERROR:", e.message);
} finally {
  await browser.close();
}
