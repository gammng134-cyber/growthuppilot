import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { getStore } from "@/lib/storage";
import { DraftStatus } from "@/lib/storage/types";

const EDITABLE: DraftStatus[] = ["approved", "rejected", "draft"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(async (user) => {
    const { id } = await params;
    const body = await readJson<{
      subject?: string;
      body?: string;
      status?: string;
    }>(req);
    const store = await getStore();
    const patch: { subject?: string; body?: string; status?: DraftStatus } = {};
    if (typeof body.subject === "string" && body.subject.trim()) {
      patch.subject = body.subject.trim().slice(0, 120);
    }
    if (typeof body.body === "string" && body.body.trim()) {
      patch.body = body.body.trim().slice(0, 4000);
    }
    if (body.status && EDITABLE.includes(body.status as DraftStatus)) {
      patch.status = body.status as DraftStatus;
    }
    const draft = await store.updateDraft(user.id, id, patch);
    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    return NextResponse.json(draft);
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(async (user) => {
    const { id } = await params;
    const store = await getStore();
    const draft = await store.getDraft(user.id, id);
    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (draft.status === "sent" || draft.status === "replied") {
      return NextResponse.json(
        { error: "Sent emails can't be deleted" },
        { status: 400 },
      );
    }
    await store.updateDraft(user.id, id, { status: "rejected" });
    return NextResponse.json({ ok: true });
  });
}
