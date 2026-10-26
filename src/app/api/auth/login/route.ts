import { NextResponse } from "next/server";

import { createSession, verifyPassword } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { getStore } from "@/lib/storage";

export async function POST(req: Request) {
  const { email, password } = await readJson<{
    email?: string;
    password?: string;
  }>(req);
  if (!email || !password) return jsonError("Email and password required");
  const store = await getStore();
  const user = await store.getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("Invalid email or password", 401);
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
