import { NextResponse } from "next/server";

import { createSession, hashPassword } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { getStore } from "@/lib/storage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const { email, password } = await readJson<{
    email?: string;
    password?: string;
  }>(req);
  const addr = (email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(addr)) return jsonError("Enter a valid email address");
  if (!password || password.length < 8) {
    return jsonError("Password must be at least 8 characters");
  }
  try {
    const store = await getStore();
    const existing = await store.getUserByEmail(addr);
    if (existing) return jsonError("That email already has a workspace", 409);
    const user = await store.createUser(addr, await hashPassword(password));
    await store.getSettings(user.id); // create default settings row
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "email_taken") {
      return jsonError("That email already has a workspace", 409);
    }
    console.error("[signup]", err);
    return jsonError(
      "Could not create the workspace. If you're out of demo mode, check DATABASE_URL.",
      500,
    );
  }
}
