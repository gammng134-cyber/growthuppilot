import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { getStore } from "@/lib/storage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  return withUser(async (user) => {
    const store = await getStore();
    return NextResponse.json(await store.listContacts(user.id));
  });
}

export async function POST(req: Request) {
  return withUser(async (user) => {
    const body = await readJson<Record<string, string>>(req);
    const email = (body.email ?? "").trim();
    if (!EMAIL_RE.test(email)) return json(400, "A valid email is required");
    const store = await getStore();
    const contact = await store.createContact({
      userId: user.id,
      name: (body.name ?? "").trim().slice(0, 120),
      email,
      company: (body.company ?? "").trim().slice(0, 120),
      role: (body.role ?? "").trim().slice(0, 120),
      notes: (body.notes ?? "").trim().slice(0, 2000),
      sourceContext: (body.sourceContext ?? "").trim().slice(0, 2000),
    });
    return NextResponse.json(contact, { status: 201 });
  });
}

export async function DELETE(req: Request) {
  return withUser(async (user) => {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return json(400, "id query param required");
    const store = await getStore();
    const ok = await store.deleteContact(user.id, id);
    return NextResponse.json({ ok });
  });
}

function json(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
