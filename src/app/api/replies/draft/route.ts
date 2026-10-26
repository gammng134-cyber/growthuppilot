import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { generateJson } from "@/lib/ai";
import { getStore } from "@/lib/storage";

const SYSTEM = `You are a sharp, helpful public-replies writer. You turn a pasted post or comment into a public reply that gets the author noticed for being genuinely helpful — never sycophantic, never salesy.
Hard rules:
- Answer or engage with the actual content of POST. Specific beats generic.
- 40-90 words. Plain language, lowercase-friendly, one insight max.
- Mention the sender's product only when it naturally fits, using the brief.
- No emojis, no links, no "great post!" energy.
Return ONLY valid JSON: {"reply": string}`;

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { post } = await readJson<{ post?: string }>(req);
    const text = (post || "").trim();
    if (!text) {
      return NextResponse.json({ error: "post required" }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json(
        { error: "Post too long — keep it under 4000 characters" },
        { status: 400 },
      );
    }
    const store = await getStore();
    const settings = await store.getSettings(user.id);
    const prompt = `TASK:REPLY_DRAFT
PRODUCT BRIEF: ${settings.productBrief || "an early-stage SaaS tool"}
BRAND VOICE: ${settings.brandVoice || "friendly, direct, founder-to-founder"}
POST: ${text.replace(/\s+/g, " ").slice(0, 3000)}
Write a helpful public reply.`;
    const data = await generateJson<{ reply?: string }>(SYSTEM, prompt);
    const reply = (data.reply || "").trim();
    if (!reply) throw new Error("AI reply came back empty");
    return NextResponse.json({ reply: reply.slice(0, 2000) });
  });
}
