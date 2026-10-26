import { NextResponse } from "next/server";

import { withUser } from "@/lib/api";
import { generateFollowUp } from "@/lib/agents/email-agent";
import { getStore } from "@/lib/storage";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(async (user) => {
    const { id } = await params;
    const store = await getStore();
    const parent = await store.getDraft(user.id, id);
    if (!parent || parent.kind !== "initial") {
      return NextResponse.json(
        { error: "Parent email not found" },
        { status: 404 },
      );
    }
    const contact = await store.getContact(user.id, parent.contactId);
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    if (parent.status === "replied") {
      return NextResponse.json(
        { error: "They replied — no follow-up needed" },
        { status: 400 },
      );
    }
    const settings = await store.getSettings(user.id);
    const draft = await generateFollowUp(store, user.id, settings, contact, parent);
    await store.addEvent({
      userId: user.id,
      draftId: draft.id,
      contactId: contact.id,
      type: "queued",
      meta: "follow-up draft",
    });
    return NextResponse.json(draft, { status: 201 });
  });
}
