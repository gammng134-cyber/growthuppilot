import { NextResponse } from "next/server";

import { withUser } from "@/lib/api";
import { deliverDraft, followUpDueAtFor } from "@/lib/mail/deliver";
import { getStore } from "@/lib/storage";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(async (user) => {
    const { id } = await params;
    const store = await getStore();
    const draft = await store.getDraft(user.id, id);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    if (draft.status === "sent" || draft.status === "replied") {
      return NextResponse.json(
        { error: "This email was already sent" },
        { status: 400 },
      );
    }
    const contact = await store.getContact(user.id, draft.contactId);
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    if (contact.unsubscribed) {
      return NextResponse.json(
        { error: "This contact unsubscribed — sending is blocked" },
        { status: 400 },
      );
    }
    const settings = await store.getSettings(user.id);

    const result = await deliverDraft(store, user, draft, contact, settings);

    const sentAt = new Date();
    await store.updateDraft(user.id, id, {
      status: "sent",
      sentAt,
      messageId: result.messageId,
      followUpDueAt: followUpDueAtFor(settings, draft.kind, sentAt),
    });
    await store.addEvent({
      userId: user.id,
      draftId: draft.id,
      contactId: contact.id,
      type: "sent",
      meta: `via ${result.transport}`,
    });

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
      transport: result.transport,
    });
  });
}
