// Cold-email autopilot. For each user who opted in:
//   1. Sends follow-up emails that are due (no reply after followUpAfterDays).
//   2. Generates and sends first-touch cold emails to contacts without one.
// Guardrails: unsubscribed contacts are never emailed, a per-user daily cap
// bounds volume, and follow-ups always go out before new first-touches.

import { generateDraft, generateFollowUp } from "@/lib/agents/email-agent";
import { deliverDraft, followUpDueAtFor } from "@/lib/mail/deliver";
import { Contact, EmailDraft, Settings, Storage, User } from "@/lib/storage/types";

const DAILY_CAP_CEILING = 100;
const FOLLOWUP_BATCH_MAX = 50;

export type PilotItem =
  | { kind: "followup"; draftId: string; contactId: string; ok: true; detail: string }
  | { kind: "followup"; draftId: string | null; contactId: string | null; ok: false; detail: string }
  | { kind: "initial"; draftId: string; contactId: string; ok: true; detail: string }
  | { kind: "initial"; draftId: string | null; contactId: string | null; ok: false; detail: string };

export interface PilotRun {
  userId: string;
  enabled: boolean;
  skippedReason?: string;
  sent: number;
  failed: number;
  items: PilotItem[];
}

export async function runOutreachPilotForUser(
  store: Storage,
  user: User,
  now: Date = new Date(),
): Promise<PilotRun> {
  const run: PilotRun = { userId: user.id, enabled: true, sent: 0, failed: 0, items: [] };

  const settings = await store.getSettings(user.id);
  if (!settings.outreachAutopilot) {
    run.enabled = false;
    run.skippedReason = "outreachAutopilot is off";
    return run;
  }

  if (settings.sendVia === "mailbox") {
    const conns = await store.listMailConnections(user.id);
    if (conns.length === 0) {
      run.skippedReason = "send-via mailbox but no mailbox connected";
      return run;
    }
  }

  const dailyCap = Math.min(Math.max(Math.round(settings.dailySendCap), 1), DAILY_CAP_CEILING);
  const { sentToday } = (await store.outreachTargets(now)).find(
    (t) => t.userId === user.id,
  ) ?? { sentToday: 0 };
  let budget = dailyCap - sentToday;
  if (budget <= 0) {
    run.skippedReason = `daily cap reached (${sentToday}/${dailyCap} sent today)`;
    return run;
  }

  // ── Phase 1: due follow-ups ─────────────────────────────
  const due = (await store.dueFollowUps(now))
    .filter((t) => t.userId === user.id)
    .slice(0, FOLLOWUP_BATCH_MAX);
  for (const { draft: parent } of due) {
    if (budget <= 0) {
      run.items.push({
        kind: "followup",
        draftId: null,
        contactId: parent.contactId,
        ok: false,
        detail: "daily cap reached",
      });
      continue;
    }
    try {
      const contact = await store.getContact(user.id, parent.contactId);
      if (!contact) continue; // contact deleted since the initial send
      const fresh = await generateFollowUp(store, user.id, settings, contact, parent);
      await sendPilotDraft(store, user, fresh, contact, settings, run, "followup");
      budget -= 1;
    } catch (err) {
      run.failed += 1;
      run.items.push({
        kind: "followup",
        draftId: null,
        contactId: parent.contactId,
        ok: false,
        detail: errorMessage(err),
      });
    }
  }

  // ── Phase 2: first-touch emails for contacts without one ──
  if (budget > 0) {
    const contacts = await store.listContacts(user.id);
    const drafts = await store.listDrafts(user.id);
    const hasInitial = new Set(
      drafts
        .filter((d) => d.kind === "initial" && d.status !== "rejected")
        .map((d) => d.contactId),
    );
    for (const contact of contacts) {
      if (budget <= 0) break;
      if (contact.unsubscribed || hasInitial.has(contact.id)) continue;
      try {
        const fresh = await generateDraft(store, user.id, settings, contact);
        await sendPilotDraft(store, user, fresh, contact, settings, run, "initial");
        hasInitial.add(contact.id);
        budget -= 1;
      } catch (err) {
        run.failed += 1;
        run.items.push({
          kind: "initial",
          draftId: null,
          contactId: contact.id,
          ok: false,
          detail: errorMessage(err),
        });
      }
    }
  }

  return run;
}

async function sendPilotDraft(
  store: Storage,
  user: User,
  draft: EmailDraft,
  contact: Contact,
  settings: Settings,
  run: PilotRun,
  kind: "initial" | "followup",
): Promise<void> {
  if (contact.unsubscribed) {
    run.items.push({
      kind,
      draftId: draft.id,
      contactId: contact.id,
      ok: false,
      detail: "contact unsubscribed",
    });
    return;
  }
  const result = await deliverDraft(store, user, draft, contact, settings);
  const sentAt = new Date();
  const updated = await store.updateDraft(user.id, draft.id, {
    status: "sent",
    sentAt,
    messageId: result.messageId,
    followUpDueAt: followUpDueAtFor(settings, draft.kind, sentAt),
  });
  if (!updated) throw new Error("draft disappeared before send");
  await store.addEvent({
    userId: user.id,
    draftId: draft.id,
    contactId: contact.id,
    type: "sent",
    meta: `via ${result.transport} (autopilot)`,
  });
  run.sent += 1;
  run.items.push({
    kind,
    draftId: draft.id,
    contactId: contact.id,
    ok: true,
    detail: result.transport,
  });
}

function errorMessage(err: unknown): string {
  return (err instanceof Error ? err.message : "Unexpected error").slice(0, 200);
}
