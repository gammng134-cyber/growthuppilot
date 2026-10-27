import { NextResponse } from "next/server";

import { readJson, withUser } from "@/lib/api";
import { getStore } from "@/lib/storage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  return withUser(async (user) => {
    const store = await getStore();
    return NextResponse.json(await store.getSettings(user.id));
  });
}

export async function PUT(req: Request) {
  return withUser(async (user) => {
    const body = await readJson<Record<string, unknown>>(req);
    const patch: Record<string, unknown> = {};
    if (typeof body.productBrief === "string") patch.productBrief = body.productBrief.slice(0, 2000);
    if (typeof body.brandVoice === "string") patch.brandVoice = body.brandVoice.slice(0, 1000);
    if (typeof body.fromName === "string") patch.fromName = body.fromName.slice(0, 100);
    if (typeof body.fromEmail === "string") {
      const fromEmail = body.fromEmail.trim();
      if (fromEmail && !EMAIL_RE.test(fromEmail)) {
        return NextResponse.json({ error: "fromEmail must be a valid email" }, { status: 400 });
      }
      patch.fromEmail = fromEmail;
    }
    if (typeof body.replyTo === "string") {
      const replyTo = body.replyTo.trim();
      if (replyTo && !EMAIL_RE.test(replyTo)) {
        return NextResponse.json({ error: "replyTo must be a valid email" }, { status: 400 });
      }
      patch.replyTo = replyTo;
    }
    if (body.followUpAfterDays !== undefined) {
      const days = Number(body.followUpAfterDays);
      if (!Number.isFinite(days) || days < 0 || days > 30) {
        return NextResponse.json({ error: "followUpAfterDays must be 0-30" }, { status: 400 });
      }
      patch.followUpAfterDays = Math.round(days);
    }
    if (typeof body.autopilot === "boolean") patch.autopilot = body.autopilot;
    if (typeof body.autoPublish === "boolean") patch.autoPublish = body.autoPublish;
    if (typeof body.outreachAutopilot === "boolean") {
      patch.outreachAutopilot = body.outreachAutopilot;
    }
    if (body.dailySendCap !== undefined) {
      const cap = Number(body.dailySendCap);
      if (!Number.isInteger(cap) || cap < 1 || cap > 100) {
        return NextResponse.json({ error: "dailySendCap must be 1-100" }, { status: 400 });
      }
      patch.dailySendCap = cap;
    }
    if (body.sendVia !== undefined) {
      if (body.sendVia !== "resend" && body.sendVia !== "mailbox") {
        return NextResponse.json(
          { error: "sendVia must be 'resend' or 'mailbox'" },
          { status: 400 },
        );
      }
      patch.sendVia = body.sendVia;
    }

    const store = await getStore();
    return NextResponse.json(await store.updateSettings(user.id, patch));
  });
}
