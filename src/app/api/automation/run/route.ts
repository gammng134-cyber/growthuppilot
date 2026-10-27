import { NextResponse } from "next/server";

import { withUser } from "@/lib/api";
import { runOutreachPilotForUser } from "@/lib/agents/outreach-pilot";
import { getStore } from "@/lib/storage";

/**
 * Manual trigger for the cold-email autopilot ("Run once now" in Settings).
 * Runs the same logic as /api/cron/outreach, but only for the signed-in user.
 */
export async function POST() {
  return withUser(async (user) => {
    const store = await getStore();
    const run = await runOutreachPilotForUser(store, user, new Date());
    return NextResponse.json(run);
  });
}
