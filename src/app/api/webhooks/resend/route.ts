import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { isDemoMode, getStore } from "@/lib/storage";
import { EmailEvent } from "@/lib/storage/types";

interface SvixMessage {
  type: string;
  data: { email_id: string };
}

const EVENT_MAP: Record<string, EmailEvent["type"]> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const payload = await req.text();

  if (secret) {
    const headers = {
      id: req.headers.get("svix-id") ?? "",
      timestamp: req.headers.get("svix-timestamp") ?? "",
      signature: req.headers.get("svix-signature") ?? "",
    };
    try {
      const wh = new Webhook(secret);
      wh.verify(payload, headers);
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else if (!isDemoMode()) {
    return NextResponse.json(
      { error: "RESEND_WEBHOOK_SECRET not configured" },
      { status: 400 },
    );
  }

  let msg: SvixMessage;
  try {
    msg = JSON.parse(payload) as SvixMessage;
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const mapped = EVENT_MAP[msg.type];
  if (!mapped || !msg.data?.email_id) {
    return NextResponse.json({ ok: true, ignored: msg.type });
  }

  try {
    const store = await getStore();
    // Find the draft by Resend message id across users (webhooks are unscoped).
    const draft = await findDraftByMessageId(store, msg.data.email_id);
    if (!draft) return NextResponse.json({ ok: true, ignored: "unknown message" });

    await store.addEvent({
      userId: draft.userId,
      draftId: draft.id,
      contactId: draft.contactId,
      type: mapped,
    });
    if (mapped === "bounced") {
      await store.updateDraft(draft.userId, draft.id, { status: "bounced" });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-webhook]", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function findDraftByMessageId(
  store: Awaited<ReturnType<typeof getStore>>,
  messageId: string,
) {
  // Resend gives us the email id; we stored it as messageId at send time.
  // Storage interface is user-scoped, so scan users' drafts in small apps;
  // a dedicated index can be added when volume grows.
  return store.findDraftByMessageId(messageId);
}
