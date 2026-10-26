import { NextResponse } from "next/server";

import { getStore } from "@/lib/storage";
import { verifyUnsubscribeToken } from "@/lib/tokens";

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{background:#05060b;color:#cbd5e1;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}.c{max-width:420px;padding:40px;border:1px solid #232840;border-radius:16px;background:#0a0c14}h1{color:#fff;font-size:20px}p{line-height:1.6}</style></head><body><div class="c"><h1>${title}</h1><p>${body}</p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function unsubscribe(token: string): Promise<NextResponse | null> {
  const verified = await verifyUnsubscribeToken(token);
  if (!verified) return null;
  const store = await getStore();
  const contact = await store.getContact(verified.userId, verified.contactId);
  if (!contact) return null;
  await store.updateContact(verified.userId, contact.id, {
    unsubscribed: true,
  });
  return null; // We never need the Contact here — only the bool. Remove the leaking return.
  // Returning void typed value to satisfy route.
  void contact;
}

/** RFC 8058 one-click unsubscribe. */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });
  const result = await unsubscribe(token);
  return NextResponse.json({ ok: true, known: !!result });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  if (!token) return page("Invalid link", "This unsubscribe link is malformed.");
  const result = await unsubscribe(token);
  if (!result) {
    return page(
      "Already unsubscribed",
      "This address isn't on any list, or the link expired. You won't hear from us.",
    );
  }
  return page(
    "You're unsubscribed",
    "Done — one click, no questions. This address has been blocked from all future sends in this workspace.",
  );
}
