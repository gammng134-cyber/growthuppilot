import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { generateJson } from "@/lib/ai";
import { getStore } from "@/lib/storage";
import { Contact, Settings } from "@/lib/storage/types";

interface ScoredContact {
  contactId: string;
  name: string;
  score: number;
  tier: "hot" | "warm" | "cold";
  rationale: string;
}

const SYSTEM = `You are a ruthless B2B buying-intent analyst. You score leads 0-100 on how likely they are to buy soon, based only on what they said in public and their role.
Hard rules:
- Score ONLY from evidence in the contact data. Never invent interest.
- Buying signals: stated pain, hiring, budget, timing, "looking for", competitor mentions.
- Hot >= 70, warm 45-69, cold < 45.
Return ONLY valid JSON: {"contacts": [{"contactId": string, "name": string, "score": number 0-100, "tier": "hot"|"warm"|"cold", "rationale": string (max 140 chars)}]}`;

function buildScorePrompt(settings: Settings, contacts: Contact[]): string {
  const list = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    role: c.role,
    context: (c.sourceContext || c.notes || "").replace(/\s+/g, " ").slice(0, 500),
  }));
  return `TASK:LEAD_SCORE
PRODUCT BRIEF: ${settings.productBrief || "an early-stage SaaS tool"}
BRAND VOICE: ${settings.brandVoice || "friendly, direct, founder-to-founder"}
CONTACTS: ${JSON.stringify(list)}
Score every contact for buying intent.`;
}

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { contactIds } = await readJson<{ contactIds?: string[] }>(req);
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: "contactIds required" }, { status: 400 });
    }
    if (contactIds.length > 50) {
      return NextResponse.json(
        { error: "Max 50 contacts per batch — score in waves" },
        { status: 400 },
      );
    }
    const store = await getStore();
    const settings = await store.getSettings(user.id);
    const contacts: Contact[] = [];
    const missing: string[] = [];
    for (const id of contactIds) {
      const c = await store.getContact(user.id, id);
      if (c) contacts.push(c);
      else missing.push(id);
    }
    if (contacts.length === 0) {
      return NextResponse.json({ error: "No valid contacts" }, { status: 400 });
    }
    const data = await generateJson<{ contacts?: ScoredContact[] }>(
      SYSTEM,
      buildScorePrompt(settings, contacts),
    );
    const scored = (data.contacts ?? [])
      .map((s) => ({
        ...s,
        score: Math.max(0, Math.min(100, Math.round(Number(s.score) || 0))),
        tier: s.tier === "hot" || s.tier === "warm" ? s.tier : "cold",
      }))
      .sort((a, b) => b.score - a.score);
    return NextResponse.json({ contacts: scored, missing });
  });
}
