import { NextResponse } from "next/server";

import { withUser } from "@/lib/api";
import { gmailConfigured, outlookConfigured } from "@/lib/mail/oauth";
import { getStore } from "@/lib/storage";
import { MailConnectionPublic } from "@/lib/storage/types";

function toPublic(c: {
  id: string;
  provider: "gmail" | "outlook";
  email: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): MailConnectionPublic {
  return {
    id: c.id,
    provider: c.provider,
    email: c.email,
    tokenExpired: c.expiresAt.getTime() <= Date.now(),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export async function GET() {
  return withUser(async (user) => {
    const store = await getStore();
    const conns = await store.listMailConnections(user.id);
    return NextResponse.json({
      connections: conns.map(toPublic),
      configured: { gmail: gmailConfigured(), outlook: outlookConfigured() },
    });
  });
}

export async function DELETE(req: Request) {
  return withUser(async (user) => {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const store = await getStore();
    const ok = await store.deleteMailConnection(user.id, id);
    if (!ok) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
