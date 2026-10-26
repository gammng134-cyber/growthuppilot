import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { isDemoMode, getStore } from "@/lib/storage";
import { EmailEvent } from "@/lib/storage/types";

const ALLOWED = ["opened", "clicked", "replied", "delivered", "bounced"];

/** Demo-mode only: simulate a tracking webhook so the pipeline is testable. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(async (user) => {
    if (!isDemoMode()) {
      return NextResponse.json(
        { error: "Only available in demo mode" },
        { status: 403 },
      );
    }
    const { id } = await params;
    const { type } = await readJson<{ type?: string }>(req);
    if (!type || !ALLOWED.includes(type)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }
    const store = await getStore();
    const draft = await store.getDraft(user.id, id);
    if (!draft || draft.status !== "sent") {
      return NextResponse.json(
        { error: "Draft not found or not sent yet" },
        { status: 404 },
      );
    }
    await store.addEvent({
      userId: user.id,
      draftId: draft.id,
      contactId: draft.contactId,
      type: type as EmailEvent["type"],
      meta: "simulated",
    });
    if (type === "replied") {
      await store.updateDraft(user.id, id, { status: "replied" });
    } else if (type === "bounced") {
      await store.updateDraft(user.id, id, { status: "bounced" });
    }
    return NextResponse.json({ ok: true });
  });
}
