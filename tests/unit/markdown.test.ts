import { describe, expect, it } from "vitest";

import { renderMarkdown, readingTime, slugify } from "@/lib/markdown";

describe("slugify", () => {
  it("lowercases and replaces runs of non-alphanumeric", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("  a  b  ")).toBe("a-b");
  });
});

describe("readingTime", () => {
  it("estimates words / 200", () => {
    expect(readingTime("one two three four five six seven eight nine ten")).toBe(1);
    expect(readingTime("")).toBe(1);
  });
});

describe("renderMarkdown", () => {
  it("renders H2, bold, bullets, and inline code", () => {
    const html = renderMarkdown(
      "## Section\n\nSome **bold** and `code`.\n\n- item 1\n- item 2",
    );
    expect(html).toContain("<h2>");
    expect(html).toContain("<strong>");
    expect(html).toContain("<code>");
    expect(html).toContain("<ul>");
  });

  it("escapes raw HTML", () => {
    const html = renderMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
