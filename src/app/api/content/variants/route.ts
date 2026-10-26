import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { generateJson } from "@/lib/ai";
import { getStore } from "@/lib/storage";

const SYSTEM = `You are a multi-platform content writer. Given one topic, you produce platform-ready variants for X, LinkedIn, a newsletter and a blog — same core idea, each in the platform's native shape.
Hard rules:
- X: thread opener, punchy, under 280 chars.
- LinkedIn: short post with a line break and a closing question.
- Newsletter: one section, warm and direct.
- Blog: one paragraph, substantive.
- Stay inside the product brief. No invented features, pricing or timelines.
Return ONLY valid JSON: {"variants": {"x": string, "linkedin": string, "newsletter": string, "blog": string}}`;

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { topic } = await readJson<{ topic?: string }>(req);
    const text = (topic || "").trim();
    if (!text) {
      return NextResponse.json({ error: "topic required" }, { status: 400 });
    }
    if (text.length > 500) {
      return NextResponse.json(
        { error: "Topic too long — one sentence works best" },
        { status: 400 },
      );
    }
    const store = await getStore();
    const settings = await store.getSettings(user.id);
    const prompt = `TASK:CONTENT_VARIANTS
PRODUCT BRIEF: ${settings.productBrief || "an early-stage SaaS tool"}
BRAND VOICE: ${settings.brandVoice || "friendly, direct, founder-to-founder"}
TOPIC: ${text}
Create one variant per platform.`;
    const data = await generateJson<{
      variants?: Record<string, string>;
    }>(SYSTEM, prompt);
    const variants = data.variants ?? {};
    const cleaned: Record<string, string> = {};
    for (const key of ["x", "linkedin", "newsletter", "blog"] as const) {
      const v = (variants[key] || "").trim();
      if (!v) throw new Error(`Missing ${key} variant`);
      cleaned[key] = v.slice(0, 4000);
    }
    return NextResponse.json({ topic: text, variants: cleaned });
  });
}
