import { siteUrl } from "@/lib/utils";

export interface BuildEmailOpts {
  subject: string;
  body: string; // plain text with \n\n paragraphs
  fromName: string;
  unsubscribeUrl: string;
}

function paragraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px">${escapeAndLinkify(p)}</p>`)
    .join("");
}

function escapeAndLinkify(p: string): string {
  const escaped = p
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#6366f1">$1</a>',
  );
}

export function buildEmailHtml(opts: BuildEmailOpts): string {
  const preheader = opts.body.split("\n")[0].slice(0, 90);
  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;">
<tr><td style="padding:32px 32px 8px;color:#18181b;font-size:15px;line-height:1.6;">
${paragraphs(opts.body)}
</td></tr>
<tr><td style="padding:8px 32px 28px;color:#71717a;font-size:12px;line-height:1.5;border-top:1px solid #f0f0f2;">
— ${opts.fromName || "GrowthPilot"}<br /><br />
You're receiving this one-to-one note because of a public conversation we crossed paths in. <a href="${opts.unsubscribeUrl}" style="color:#71717a">Unsubscribe</a> — one click, no questions, honored instantly.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildEmailText(opts: BuildEmailOpts): string {
  return `${opts.body}\n\n— ${opts.fromName || "GrowthPilot"}\n\nUnsubscribe: ${opts.unsubscribeUrl}`;
}

export function unsubscribeUrlFor(token: string): string {
  return `${siteUrl()}/api/unsubscribe?t=${encodeURIComponent(token)}`;
}

export function listUnsubscribeHeader(unsubscribeUrl: string): string {
  return `<${unsubscribeUrl}>`;
}
