// Tiny, safe markdown → HTML renderer for AI-generated articles.
// Escapes all HTML first, then applies a small whitelist of formatting.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string): string {
  let out = text;
  // links [text](url) — only http(s) and relative
  out = out.replace(
    /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g,
    (_m, label: string, url: string) =>
      `<a href="${url}"${
        url.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""
      }>${label}</a>`,
  );
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // inline code
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  // italics (single asterisk, not part of bold)
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = escapeHtml(md.replace(/\r\n?/g, "\n")).split("\n");
  const out: string[] = [];
  let inList = false;
  let inParagraph = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  const closeParagraph = () => {
    if (inParagraph) {
      out.push("</p>");
      inParagraph = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (trimmed === "") {
      closeList();
      closeParagraph();
      continue;
    }
    const h2 = trimmed.match(/^##\s+(.*)$/);
    const h3 = trimmed.match(/^###\s+(.*)$/);
    const li = trimmed.match(/^[-*]\s+(.*)$/);

    if (h2) {
      closeList();
      closeParagraph();
      out.push(`<h2>${inline(h2[1])}</h2>`);
      continue;
    }
    if (h3) {
      closeList();
      closeParagraph();
      out.push(`<h3>${inline(h3[1])}</h3>`);
      continue;
    }
    if (li) {
      closeParagraph();
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    closeList();
    if (!inParagraph) {
      out.push("<p>");
      inParagraph = true;
      out.push(inline(trimmed));
    } else {
      out[out.length - 1] += " " + inline(trimmed);
    }
  }
  closeList();
  closeParagraph();
  return out.join("\n");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function readingTime(md: string): number {
  const words = md.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
