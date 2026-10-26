import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { generateJson } from "@/lib/ai";
import { getStore } from "@/lib/storage";

const SYSTEM = `You are the front-desk chatbot for a product. You answer visitor questions strictly from the owner's PRODUCT BRIEF and BRAND VOICE.
Hard rules:
- Ground every answer in the brief. If the brief doesn't cover it, say you don't know — never invent features, pricing or timelines.
- If you can't answer, offer to have a human follow up.
- Short answers: 1-3 sentences. Warm, direct, on-voice.
Return ONLY valid JSON: {"answer": string}`;

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { question, history } = await readJson<{
      question?: string;
      history?: { role: string; content: string }[];
    }>(req);
    const text = (question || "").trim();
    if (!text) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }
    if (text.length > 1000) {
      return NextResponse.json(
        { error: "Question too long" },
        { status: 400 },
      );
    }
    const store = await getStore();
    const settings = await store.getSettings(user.id);
    const recent = (Array.isArray(history) ? history : [])
      .slice(-6)
      .map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${(m.content || "").replace(/\s+/g, " ").slice(0, 300)}`)
      .join("\n");
    const prompt = `TASK:CHAT_ASK
PRODUCT BRIEF: ${settings.productBrief || ""}
BRAND VOICE: ${settings.brandVoice || "friendly, direct"}
${recent ? `CHAT HISTORY:\n${recent}\n` : ""}QUESTION: ${text}
Answer from the brief only.`;
    const data = await generateJson<{ answer?: string }>(SYSTEM, prompt);
    const answer = (data.answer || "").trim();
    if (!answer) throw new Error("Chatbot answer came back empty");
    return NextResponse.json({ answer: answer.slice(0, 2000) });
  });
}
