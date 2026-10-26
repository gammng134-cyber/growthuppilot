import { NextResponse } from "next/server";

import { generateArticle, generateKeywordPlan } from "@/lib/agents/seo-agent";
import { getStore, isDemoMode } from "@/lib/storage";

/**
 * Daily SEO autopilot: for every user with autopilot on, ensure a keyword
 * plan exists, then draft the next article (auto-publishing only when the
 * user explicitly enabled it).
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!isDemoMode()) {
    if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const store = await getStore();
  const targets = await store.autopilotTargets();
  const results: { userId: string; action: string; ok: boolean }[] = [];

  for (const target of targets) {
    try {
      const settings = await store.getSettings(target.userId);
      if (!settings.productBrief.trim()) {
        results.push({ userId: target.userId, action: "skipped (no brief)", ok: true });
        continue;
      }
      let keyword = target.keyword;
      if (!keyword) {
        if (target.hasPlan) {
          results.push({
            userId: target.userId,
            action: "plan complete",
            ok: true,
          });
          continue;
        }
        const plan = await generateKeywordPlan(store, target.userId, settings);
        keyword = plan[0] ?? null;
        if (!keyword) continue;
        results.push({ userId: target.userId, action: "keyword plan created", ok: true });
      }
      const article = await generateArticle(store, target.userId, settings, keyword);
      if (settings.autoPublish) {
        await store.updateArticle(target.userId, article.id, {
          status: "published",
          publishedAt: new Date(),
        });
        results.push({ userId: target.userId, action: `published "${article.title}"`, ok: true });
      } else {
        results.push({
          userId: target.userId,
          action: `drafted "${article.title}" (awaiting approval)`,
          ok: true,
        });
      }
    } catch (err) {
      console.error("[cron/autopilot]", err);
      results.push({
        userId: target.userId,
        action: "failed",
        ok: false,
      });
    }
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), processed: results.length, results });
}
