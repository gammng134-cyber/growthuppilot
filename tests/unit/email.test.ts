import { describe, expect, it } from "vitest";

import {
  buildEmailHtml,
  buildEmailText,
  unsubscribeUrlFor,
} from "@/lib/email/templates";

describe("buildEmailHtml", () => {
  it("renders paragraphs and an unsubscribe link", () => {
    const html = buildEmailHtml({
      subject: "hi",
      body: "line one\n\nline two",
      fromName: "GrowthPilot",
      unsubscribeUrl: "https://example.com/unsub",
    });
    expect(html).toContain("line one");
    expect(html).toContain("line two");
    expect(html).toContain("Unsubscribe");
  });
});

describe("buildEmailText", () => {
  it("includes subject, from and unsubscribe in plain text", () => {
    const text = buildEmailText({
      subject: "hi",
      body: "body",
      fromName: "GrowthPilot",
      unsubscribeUrl: "https://example.com/unsub",
    });
    expect(text).toContain("body");
    expect(text).toContain("— GrowthPilot");
    expect(text).toContain("Unsubscribe: https://example.com/unsub");
  });
});

describe("unsubscribeUrlFor", () => {
  it("encodes the token", () => {
    expect(unsubscribeUrlFor("abc=123")).toContain("t=abc%3D123");
  });
});
