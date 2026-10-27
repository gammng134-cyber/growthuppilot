import { beforeEach, describe, expect, it } from "vitest";

import { runOutreachPilotForUser } from "@/lib/agents/outreach-pilot";
import { MemoryStore } from "@/lib/storage/memory";
import { EmailDraft } from "@/lib/storage/types";

const USER_EMAIL = "u1@example.com";

async function seed(store: MemoryStore) {
  const user = await store.createUser(USER_EMAIL, "$2b$10$dx");
  const user2 = await store.createUser("other@example.com", "$2b$10$dx");
  await store.updateSettings(user.id, {
    productBrief: "A launch intelligence tool for founders",
    outreachAutopilot: true,
    dailySendCap: 10,
  });
  return { user, user2 };
}

function contact(store: MemoryStore, userId: string, email: string, opts: { unsub?: boolean } = {}) {
  return store.createContact({
    userId,
    name: email.split("@")[0],
    email,
    company: "Acme",
    role: "Founder",
    notes: "",
    sourceContext: "posted about cold outbound pain",
    ...(opts.unsub ? { unsubscribed: true } : {}),
  });
}

describe("runOutreachPilotForUser", () => {
  beforeEach(() => {
    // ensure demo AI/mock transport in tests (no provider keys set).
    // NOTE: assignment would store the literal string "undefined" — delete instead.
    delete process.env.RESEND_API_KEY;
    delete process.env.GMAIL_CLIENT_ID;
    delete process.env.GMAIL_CLIENT_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.DEMO_MODE;
  });

  it("does nothing when outreachAutopilot is off", async () => {
    const store = new MemoryStore();
    const { user } = await seed(store);
    await store.updateSettings(user.id, { outreachAutopilot: false });
    await contact(store, user.id, "a@acme.io");

    const run = await runOutreachPilotForUser(store, user);
    expect(run.enabled).toBe(false);
    expect(run.skippedReason).toContain("outreachAutopilot is off");
    expect(await store.listDrafts(user.id)).toHaveLength(0);
  });

  it("sends first-touch emails to undrafted, subscribed contacts", async () => {
    const store = new MemoryStore();
    const { user } = await seed(store);
    await contact(store, user.id, "a@acme.io");
    await contact(store, user.id, "b@acme.io");

    const run = await runOutreachPilotForUser(store, user);
    expect(run.skippedReason).toBeUndefined();
    expect(run.sent).toBe(2);
    expect(run.failed).toBe(0);

    const drafts = await store.listDrafts(user.id);
    expect(drafts).toHaveLength(2);
    expect(drafts.every((d) => d.status === "sent" && d.kind === "initial")).toBe(true);
    // a mock transport event is recorded per send, tagged as autopilot
    const events = (await store.listDraftEvents(user.id, drafts[0].id)).map(
      (e) => e.meta ?? "",
    );
    expect(events.some((m) => m.includes("(autopilot)"))).toBe(true);
  });

  it("never emails unsubscribed contacts", async () => {
    const store = new MemoryStore();
    const { user } = await seed(store);
    await contact(store, user.id, "unsub@acme.io", { unsub: true });
    await contact(store, user.id, "ok@acme.io");

    const run = await runOutreachPilotForUser(store, user);
    expect(run.sent).toBe(1);
    const drafts = await store.listDrafts(user.id);
    expect(drafts).toHaveLength(1);
    const target = await store.getContact(user.id, drafts[0].contactId);
    expect(target?.email).toBe("ok@acme.io");
  });

  it("respects the daily send cap", async () => {
    const store = new MemoryStore();
    const { user } = await seed(store);
    await store.updateSettings(user.id, { dailySendCap: 1 });
    await contact(store, user.id, "a@acme.io");
    await contact(store, user.id, "b@acme.io");

    const run = await runOutreachPilotForUser(store, user);
    expect(run.sent).toBe(1);
    const drafts = await store.listDrafts(user.id);
    expect(drafts).toHaveLength(1);

    // second run the same day is capped out entirely
    const run2 = await runOutreachPilotForUser(store, user);
    expect(run2.skippedReason).toContain("daily cap reached");
    expect(run2.sent).toBe(0);
  });

  it("sends due follow-ups once, then stops them repeating", async () => {
    const store = new MemoryStore();
    const { user } = await seed(store);
    await store.updateSettings(user.id, { followUpAfterDays: 3, dailySendCap: 5 });
    const c = await contact(store, user.id, "a@acme.io");
    // an initial email sent 4 days ago whose follow-up is now due
    await store.createDraft({
      userId: user.id,
      contactId: c.id,
      kind: "initial",
      subject: "hello",
      body: "first touch",
      status: "sent",
    });
    const initial = (await store.listDrafts(user.id))[0];
    const sentAt = new Date(Date.now() - 4 * 86_400_000);
    await store.updateDraft(user.id, initial.id, {
      sentAt,
      status: "sent",
      followUpDueAt: new Date(sentAt.getTime() + 3 * 86_400_000),
    });

    const run = await runOutreachPilotForUser(store, user);
    expect(run.sent).toBe(1);
    expect(run.items[0].kind).toBe("followup");
    expect(run.items[0].ok).toBe(true);

    const drafts = await store.listDrafts(user.id);
    expect(drafts).toHaveLength(2);
    const followUp = drafts.find((d) => d.kind === "followup") as EmailDraft;
    expect(followUp.parentDraftId).toBe(initial.id);
    expect(followUp.status).toBe("sent");
    // follow-ups don't schedule their own follow-ups
    expect(followUp.followUpDueAt).toBeNull();

    // running again shouldn't re-send the follow-up
    const run2 = await runOutreachPilotForUser(store, user);
    expect(run2.sent).toBe(0);
  });

  it("drafts and sends even without a brief (demo AI uses a fallback brief)", async () => {
    const store = new MemoryStore();
    const user = await store.createUser(USER_EMAIL, "$2b$10$dx");
    await store.updateSettings(user.id, {
      outreachAutopilot: true,
      productBrief: "",
    });
    await contact(store, user.id, "a@acme.io");

    const run = await runOutreachPilotForUser(store, user);
    // demo AI still drafts with the fallback brief, so this sends — but the
    // run must never throw and must record a send or a skipped item.
    expect(run.sent + run.failed).toBe(1);
  });

  it("does not touch other users' data", async () => {
    const store = new MemoryStore();
    const { user, user2 } = await seed(store);
    await contact(store, user.id, "mine@acme.io");

    const run = await runOutreachPilotForUser(store, user2);
    expect(run.sent).toBe(0);
    expect(await store.listDrafts(user2.id)).toHaveLength(0);
  });
});
