import { NextResponse } from "next/server";

import { generateFollowUp } from "@/lib/agents/email-agent";
import { getStore, isDemoMode } from "@/lib/storage";

/**
 * Drafts polite follow-ups for sent emails that got no reply after the
 * user's configured delay. Drafts only — the user still approves every send.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!isDemoMode()) {
    if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const store = await getStore();
  const due = await store.dueFollowUps(new Date());
  const results: { draftId: string; ok: boolean; action: string }[] = [];

  for (const { userId, draft } of due.slice(0, 25)) {
    try {
      const settings = await store.getSettings(userId);
      const contact = await store.getContact(userId, draft.contactId);
      if (!contact) continue;
      await generateFollowUp(store, userId, settings, contact, draft);
      results.push({ draftId: draft.id, ok: true, action: "follow-up drafted" });
    } catch (err) {
      console.error("[cron/followups]", err);
      results.push({ draftId: draft.id, ok: false, action: "failed" });
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    due: due.length,
    processed: results.length,
    results,
  });
}
