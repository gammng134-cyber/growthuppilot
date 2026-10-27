import { NextResponse } from "next/server";

import { runOutreachPilotForUser } from "@/lib/agents/outreach-pilot";
import { getStore, isDemoMode } from "@/lib/storage";

/**
 * Cold-email autopilot: sends due follow-ups, then first-touch emails for
 * undrafted contacts — bounded by each user's daily cap. Triggered by the
 * platform cron (see vercel.json) or manually via POST /api/automation/run.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!isDemoMode()) {
    if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const store = await getStore();
  const now = new Date();
  const targets = await store.outreachTargets(now);
  const runs = [];
  for (const { userId } of targets) {
    try {
      const user = await store.getUserById(userId);
      if (!user) continue; // settings row for a deleted/unknown user
      runs.push(await runOutreachPilotForUser(store, user, now));
    } catch (err) {
      console.error("[cron/outreach]", err);
      runs.push({
        userId,
        enabled: true,
        sent: 0,
        failed: 1,
        items: [
          { kind: "initial", draftId: null, contactId: null, ok: false, detail: errorMessageP(err) },
        ],
      });
    }
  }

  return NextResponse.json({
    ranAt: now.toISOString(),
    users: targets.length,
    sent: runs.reduce((n, r) => n + r.sent, 0),
    failed: runs.reduce((n, r) => n + r.failed, 0),
    runs,
  });
}

function errorMessageP(err: unknown): string {
  return (err instanceof Error ? err.message : "Unexpected error").slice(0, 200);
}
