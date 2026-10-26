import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { generateArticle } from "@/lib/agents/seo-agent";
import { getStore } from "@/lib/storage";

export async function GET() {
  return withUser(async (user) => {
    const store = await getStore();
    return NextResponse.json(await store.listArticles(user.id));
  });
}

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { keywordId } = await readJson<{ keywordId?: string }>(req);
    if (!keywordId) {
      return NextResponse.json({ error: "keywordId required" }, { status: 400 });
    }
    const store = await getStore();
    const keyword = await store.getKeyword(user.id, keywordId);
    if (!keyword) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }
    const settings = await store.getSettings(user.id);
    try {
      const article = await generateArticle(store, user.id, settings, keyword);
      return NextResponse.json(article, { status: 201 });
    } catch (err) {
      console.error("[articles/generate]", err);
      return NextResponse.json(
        { error: "Article generation failed" },
        { status: 500 },
      );
    }
  });
}
