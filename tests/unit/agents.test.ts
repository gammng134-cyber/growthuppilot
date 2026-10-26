import { describe, expect, it } from "vitest";

import { extractJson } from "@/lib/ai";
import { fakeGenerate } from "@/lib/demo-ai";

describe("fakeGenerate", () => {
  it("returns a keyword plan for TASK:KEYWORD_PLAN", async () => {
    const plan = extractJson<{ keywords: { keyword: string }[] }>(
      await fakeGenerate("", "TASK:KEYWORD_PLAN\nPRODUCT BRIEF: x"),
    );
    expect(plan.keywords.length).toBeGreaterThan(0);
    expect(typeof plan.keywords[0].keyword).toBe("string");
  });

  it("returns an article for TASK:ARTICLE", async () => {
    const article = extractJson<{
      title: string;
      slug: string;
      metaDescription: string;
      markdown: string;
      faqs: { q: string; a: string }[];
    }>(
      await fakeGenerate(
        "",
        "TASK:ARTICLE\nKEYWORD: crm\nPRODUCT BRIEF: a crm",
      ),
    );
    expect(typeof article.title).toBe("string");
    expect(article.title).toContain("crm");
    expect(article.markdown.length).toBeGreaterThan(100);
    expect(article.faqs).toHaveLength(2);
  });

  it("returns a follow-up draft for TASK:FOLLOWUP", async () => {
    const draft = extractJson<{ subject: string; body: string }>(
      await fakeGenerate(
        "",
        "TASK:FOLLOWUP\nCONTACT NAME: Dana\nCOMPANY: Acme",
      ),
    );
    expect(draft.subject).toBeTruthy();
    expect(draft.body.length).toBeGreaterThan(10);
  });

  it("returns an email draft for TASK:EMAIL_DRAFT", async () => {
    const draft = extractJson<{ subject: string; body: string }>(
      await fakeGenerate(
        "",
        "TASK:EMAIL_DRAFT\nCONTACT NAME: Dana\nCOMPANY: Acme\nWHAT THEY SAID: their post",
      ),
    );
    expect(draft.subject).toBeTruthy();
    expect(draft.body.length).toBeGreaterThan(10);
  });
});

describe("extractJson", () => {
  it("strips fences and returns parsed JSON", () => {
    const raw = "```json\n{ \"ok\": true }\n```";
    expect(extractJson<{ ok: boolean }>(raw)).toEqual({ ok: true });
  });
});
