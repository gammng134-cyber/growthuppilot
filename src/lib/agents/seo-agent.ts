import { generateJson } from "@/lib/ai";
import { slugify } from "@/lib/markdown";
import {
  Article,
  Faq,
  Keyword,
  Settings,
  Storage,
} from "@/lib/storage/types";

const PLAN_TASK = "TASK:KEYWORD_PLAN";
const ARTICLE_TASK = "TASK:ARTICLE";

const SYSTEM = `You are a senior SEO strategist and long-form writer for early-stage B2B SaaS.
You favor specific, low-competition, founder-audience keywords over vanity head terms.
You write clear, genuinely useful articles — no AI slop, no filler paragraphs, no "in today's fast-paced world".
Always return ONLY valid JSON in exactly the shape requested.`;

export interface KeywordPlanItem {
  keyword: string;
  intent: string;
  cluster: string;
  estVolume: number;
  difficulty: number;
  angle: string;
}

export async function generateKeywordPlan(
  store: Storage,
  userId: string,
  settings: Settings,
  seeds?: string,
): Promise<Keyword[]> {
  const prompt = `${PLAN_TASK}
PRODUCT BRIEF: ${settings.productBrief || "an early-stage SaaS tool"}
AUDIENCE: founders and small marketing teams
${seeds ? `SEED KEYWORDS: ${seeds}` : ""}
Find 8-10 keywords we should own. They must be realistic for a new domain (difficulty <= 6).
Return ONLY valid JSON: {"keywords":[{"keyword":string,"intent":"informational"|"commercial"|"comparison","cluster":string,"estVolume":number (monthly searches, best estimate),"difficulty":number 1-10,"angle":string (the specific POV we'll take)}]}`;
  const raw = await generateJson<{ keywords: KeywordPlanItem[] }>(SYSTEM, prompt);
  const items = (raw.keywords ?? [])
    .filter((k) => k && typeof k.keyword === "string" && k.keyword.trim())
    .slice(0, 12)
    .map((k) => ({
      keyword: k.keyword.trim().slice(0, 120),
      intent: (k.intent || "informational").slice(0, 30),
      cluster: (k.cluster || "General").slice(0, 60),
      estVolume: Math.max(0, Math.round(Number(k.estVolume) || 0)),
      difficulty: Math.min(10, Math.max(1, Math.round(Number(k.difficulty) || 5))),
      angle: (k.angle || "").slice(0, 300),
    }));
  if (items.length === 0) throw new Error("AI returned no keywords");
  return store.createKeywords(userId, items);
}

export async function generateArticle(
  store: Storage,
  userId: string,
  settings: Settings,
  keyword: Keyword,
): Promise<Article> {
  const prompt = `${ARTICLE_TASK}
PRODUCT BRIEF: ${settings.productBrief || "an early-stage SaaS tool"}
BRAND VOICE: ${settings.brandVoice || "friendly, direct, practical"}
KEYWORD: ${keyword.keyword}
ANGLE: ${keyword.angle}
Write a 900-1300 word article targeting this keyword.
Rules: start with a hook paragraph (no H1). Use ## for main sections and ### for subsections. Include at least one bulleted list. Be specific: numbers, steps, mistakes. Mention the product only where it naturally fits (max twice).
Return ONLY valid JSON: {"title":string,"slug":string,"metaDescription":string (max 155 chars),"markdown":string,"faqs":[{"q":string,"a":string}]} with 2-4 faqs.`;
  const raw = await generateJson<{
    title: string;
    slug?: string;
    metaDescription?: string;
    markdown?: string;
    faqs?: Faq[];
  }>(SYSTEM, prompt);

  const title = (raw.title || keyword.keyword).toString().slice(0, 120);
  const markdown = (raw.markdown || "").toString().replace(/^#\s+.*$/m, "").trim();
  if (!markdown) throw new Error("AI returned an empty article");

  let slug = slugify(raw.slug || title) || slugify(keyword.keyword);
  if (await store.slugExists(slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const faqs = (raw.faqs ?? [])
    .filter((f) => f && f.q && f.a)
    .slice(0, 4)
    .map((f) => ({ q: String(f.q).slice(0, 200), a: String(f.a).slice(0, 600) }));

  return store.createArticle({
    userId,
    keywordId: keyword.id,
    keyword: keyword.keyword,
    title,
    slug,
    metaDescription: (raw.metaDescription || "").toString().slice(0, 160),
    markdown,
    faqs,
  });
}
