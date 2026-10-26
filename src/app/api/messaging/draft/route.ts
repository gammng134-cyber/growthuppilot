import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { generateJson } from "@/lib/ai";
import { getStore } from "@/lib/storage";
import { Contact, Settings } from "@/lib/storage/types";

const SYSTEM = `You are a elite one-to-one DM copywriter. You write short, human direct messages that reference what the person actually said — their exact words when possible.
Hard rules:
- Reference their exact words from WHAT THEY SAID.
- 40-80 words. Casual, lowercase-friendly, zero buzzwords.
- Never invent facts about the sender's product beyond the brief.
- One easy-to-answer question or soft offer at the end. No emojis, no links.
Return ONLY valid JSON: {"message": string}`;

function buildDmPrompt(settings: Settings, contact: Contact): string {
  return `TASK:DM_DRAFT
PRODUCT BRIEF: ${settings.productBrief || "an early-stage SaaS tool"}
BRAND VOICE: ${settings.brandVoice || "friendly, direct, founder-to-founder"}
CONTACT NAME: ${contact.name || "unknown"}
COMPANY: ${contact.company || "unknown"}
ROLE: ${contact.role || "unknown"}
WHAT THEY SAID: ${(contact.sourceContext || contact.notes || "no public context").replace(/\s+/g, " ").slice(0, 500)}
Write a personalized DM to them.`;
}

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { contactId } = await readJson<{ contactId?: string }>(req);
    if (!contactId) {
      return NextResponse.json({ error: "contactId required" }, { status: 400 });
    }
    const store = await getStore();
    const contact = await store.getContact(user.id, contactId);
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    if (contact.unsubscribed) {
      return NextResponse.json(
        { error: "Contact unsubscribed" },
        { status: 400 },
      );
    }
    const settings = await store.getSettings(user.id);
    const data = await generateJson<{ message?: string }>(
      SYSTEM,
      buildDmPrompt(settings, contact),
    );
    const message = (data.message || "").trim();
    if (!message) throw new Error("AI DM draft came back empty");
    return NextResponse.json({
      contactId: contact.id,
      name: contact.name,
      message: message.slice(0, 2000),
    });
  });
}
