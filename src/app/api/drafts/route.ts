import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { generateDraft } from "@/lib/agents/email-agent";
import { aiConfigured } from "@/lib/ai";
import { getStore } from "@/lib/storage";

export async function GET() {
  return withUser(async (user) => {
    const store = await getStore();
    return NextResponse.json(await store.listDrafts(user.id));
  });
}

/** Generate AI drafts for one or more contacts (approve-queue style). */
export async function POST(req: Request) {
  return withUser(async (user) => {
    const { contactIds } = await readJson<{ contactIds?: string[] }>(req);
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: "contactIds required" }, { status: 400 });
    }
    if (contactIds.length > 10) {
      return NextResponse.json(
        { error: "Max 10 drafts per batch — keep it human-paced" },
        { status: 400 },
      );
    }
    const store = await getStore();
    const settings = await store.getSettings(user.id);
    const created: string[] = [];
    const failed: string[] = [];
    for (const contactId of contactIds) {
      const contact = await store.getContact(user.id, contactId);
      if (!contact || contact.unsubscribed) {
        failed.push(contactId);
        continue;
      }
      try {
        const draft = await generateDraft(store, user.id, settings, contact);
        await store.addEvent({
          userId: user.id,
          draftId: draft.id,
          contactId: contact.id,
          type: "queued",
          meta: aiConfigured() ? "AI draft" : "demo draft",
        });
        created.push(draft.id);
      } catch (err) {
        console.error("[drafts/generate]", err);
        failed.push(contactId);
      }
    }
    return NextResponse.json({ created, failed });
  });
}
