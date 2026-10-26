import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { generateKeywordPlan } from "@/lib/agents/seo-agent";
import { getStore } from "@/lib/storage";

export async function GET() {
  return withUser(async (user) => {
    const store = await getStore();
    return NextResponse.json(await store.listKeywords(user.id));
  });
}

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { seeds } = await readJson<{ seeds?: string }>(req);
    const store = await getStore();
    const settings = await store.getSettings(user.id);
    try {
      const keywords = await generateKeywordPlan(
        store,
        user.id,
        settings,
        seeds?.slice(0, 300),
      );
      return NextResponse.json(keywords, { status: 201 });
    } catch (err) {
      console.error("[keywords/generate]", err);
      return NextResponse.json(
        { error: "Keyword plan generation failed" },
        { status: 500 },
      );
    }
  });
}
