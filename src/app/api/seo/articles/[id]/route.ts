import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { getStore } from "@/lib/storage";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(async (user) => {
    const { id } = await params;
    const body = await readJson<{
      status?: string;
      title?: string;
      metaDescription?: string;
      markdown?: string;
    }>(req);
    const store = await getStore();
    const patch: {
      status?: "draft" | "published";
      publishedAt?: Date | null;
      title?: string;
      metaDescription?: string;
      markdown?: string;
    } = {};
    if (body.status === "published" || body.status === "draft") {
      patch.status = body.status;
      patch.publishedAt = body.status === "published" ? new Date() : null;
    }
    if (typeof body.title === "string" && body.title.trim()) {
      patch.title = body.title.trim().slice(0, 120);
    }
    if (typeof body.metaDescription === "string") {
      patch.metaDescription = body.metaDescription.trim().slice(0, 160);
    }
    if (typeof body.markdown === "string" && body.markdown.trim()) {
      patch.markdown = body.markdown.slice(0, 60000);
    }
    const article = await store.updateArticle(user.id, id, patch);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(article);
  });
}
