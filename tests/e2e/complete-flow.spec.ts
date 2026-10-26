import { test, expect } from "@playwright/test";

test("complete demo flow: signup -> brief -> contacts -> email drafts", async ({
  page,
}) => {
  const ts = Date.now();

  // ── Landing ─────────────────────────────────────────────────────────────────
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/GrowthPilot/);
  await expect(page.locator("h1")).toContainText("The marketing team that works while you build");
  await expect(
    page.locator("text=SEO Agent").locator("..").locator("text=indexed on Google"),
  ).toBeVisible();
  await expect(
    page.locator("text=Email Agent").locator("..").locator("text=waiting for your approval"),
  ).toBeVisible();

  // ── Sign up ─────────────────────────────────────────────────────────────────
  await page.goto("/signup");
  await page.locator('input[placeholder="you@company.com"]').fill(
    `e2e${ts}@example.com`,
  );
  await page.locator('input[placeholder="8+ characters"]').fill("password123");
  await page.locator('button:has-text("Create workspace")').click();
  await page.waitForURL(/\/app/);
  await expect(page.locator("h1")).toContainText("Overview");

  // ── Brief the agents (needed for drafting) ───────────────────────────────────
  await page.goto("/app/settings");
  await expect(
    page.locator("h1", { hasText: "Settings" }),
  ).toBeVisible();
  // Wait for the initial load() to finish and the Save button to be enabled;
  // otherwise the button is disabled (loading=true) and the save never triggers.
  await expect(
    page.locator('button:has-text("Save settings")'),
  ).toBeEnabled();
  await page.locator('textarea[placeholder*="lightweight CRM"]').fill(
    "I built a lightweight CRM for small SaaS teams with 2-10 people. We replace spreadsheets with one shared inbox of deals, built-in sequences, and a 30-second onboarding.",
  );
  await page.locator('textarea[placeholder*="Friendly, direct"]').fill(
    "Friendly, direct, founder-to-founder. Lowercase-first is fine. No buzzwords, no 'hope this finds you well', no follow-up guilt.",
  );
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(
    page.locator("text=Brief is set"),
  ).toBeVisible();

  // ── Contacts ────────────────────────────────────────────────────────────────
  await page.goto("/app/contacts");
  await expect(
    page.locator("h1", { hasText: "Contacts" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add contact" }).click();
  await page.locator('input[placeholder="Dana Reyes"]').fill("Dana Reyes");
  await page.locator('input[placeholder="dana@acme.io"]').fill("dana@acme.io");
  await page.locator('input[placeholder="Acme"]').fill("Acme");
  await page.locator('input[placeholder="Founder"]').fill("Founder");
  await page.locator('textarea[placeholder*="Met at a meetup"]').fill(
    "Met at a meetup, runs a 6-person team",
  );
  await page.locator(
    'textarea[placeholder*="Their post/comment"]',
  ).fill("cold email isn't working for us anymore");
  // Two buttons share this name once the form is open; target the form's submit.
  await page.locator("form").getByRole("button", { name: "Add contact" }).click();
  // Wait for the contact list to refresh (the row count changes on POST).
  await expect(page.locator("tbody tr")).toHaveCount(1, { timeout: 10000 });

  // ── Outreach: draft, approve, send ───────────────────────────────────────────
  await page.goto("/app/outreach");
  await expect(
    page.locator("h1", { hasText: "Outreach" }),
  ).toBeVisible();
  await expect(
    page.locator('button:has-text("Draft with AI")'),
  ).toBeVisible();
  await page.getByRole("button", { name: "Draft with AI" }).click();
  await expect(
    page.locator('button:has-text("Approve")'),
  ).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(
    page.locator('button:has-text("Send now")'),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send now" }).click();
  await expect(
    page.locator("text=Sent (simulated — demo mode)"),
  ).toBeVisible({ timeout: 9000 });

  // The send() already expanded the sent card, so the "Draft follow-up" button
  // (rendered only on sent cards) is visible. Drafting a follow-up creates a
  // pending card; the sent card stays expanded, so its sim controls remain.
  await page.locator('button:has-text("Draft follow-up")').click();

  await expect(
    page.locator("text=Follow-up draft ready"),
  ).toBeVisible({ timeout: 9000 });

  // Drafting the follow-up auto-expands the follow-up card, collapsing the sent
  // card. Re-expand the sent card so its sim controls (opened / replied) are
  // visible again.
  await page.locator('button:has-text("· sent")').first().click();
  await page.locator('button:has-text("sim: opened")').click();
  await expect(
    page.locator("text=Simulated: opened"),
  ).toBeVisible({ timeout: 9000 });

  await page.locator('button:has-text("sim: replied")').click();
  await page.locator("text=Simulated: replied").waitFor({ timeout: 9000 });
  await expect(
    page.locator("text=Simulated: replied"),
  ).toBeVisible();

  // ── SEO: keyword plan -> article -> publish ──────────────────────────────────
  await page.goto("/app/seo");
  await expect(
    page.locator("h1", { hasText: "SEO Agent" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Generate keyword plan" }).click();
  await expect(
    page.locator("text=Keyword plan ready"),
  ).toBeVisible();
  const firstRow = page.locator("table tbody tr").first();
  await firstRow.locator("button", { hasText: "Write article" }).click();
  await expect(
    page.locator("text=Article drafted"),
  ).toBeVisible();
  await page.locator('button:has-text("Publish")').click();
  await expect(
    page.locator("text=Published to your blog"),
  ).toBeVisible({ timeout: 9000 });

  // Blog page
  await page.goto("/blog");
  await expect(
    page.locator("h1", { hasText: "Blog" }),
  ).toBeVisible();

  // ── Blog: the published article is live ──────────────────────────────────────
  await page.goto("/blog");
  await expect(
    page.locator("h1", { hasText: "Blog" }),
  ).toBeVisible();
  await expect(
    page.locator("text=No articles published yet."),
  ).not.toBeVisible();

  const slug = page
    .locator("a")
    .filter({ hasText: /^The founder/ })
    .first();
  const href = await slug.getAttribute("href");
  const articleSlug = href?.replace("/blog/", "");
  await slug.click();
  await expect(
    page.locator("h1", { hasText: /^The founder/ }),
  ).toBeVisible();
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('property', 'og:title');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('name', 'twitter:card');

  // OG image route returns 200 and a real PNG (check over the network)
  // page.goto() to a /api route returns a Playwright Response; assert its
  // status and Content-Type through the proper async API surface.
  const ogResponse = await page.goto(
    "/api/blog/og?slug=" + (articleSlug || ""),
    { waitUntil: "networkidle" },
  );
  if (!ogResponse) throw new Error("OG image request returned no response");
  const ogStatus = ogResponse.status();
  // headers() returns a plain object with lowercase keys, not a Headers instance
  const contentType = ogResponse.headers()["content-type"];
  expect(ogStatus).toBe(200);
  expect(contentType).toMatch(/image\//);
});


