import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { getStore } from "@/lib/storage";
import { User } from "@/lib/storage/types";

const COOKIE = "gp_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret(): Uint8Array {
  const s =
    process.env.AUTH_SECRET ?? "dev-only-secret-change-me-32chars-minimum!!";
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Call from route handlers / server actions only (sets a cookie). */
export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  // Do not force Secure when running in development or demo mode, so the
  // session cookie is still sent over http://localhost (used for local dev
  // and the demo-mode E2E smoke server) while staying secure in production.
  const secure = process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "1";
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const uid = await getSessionUserId();
  if (!uid) return null;
  const store = await getStore();
  return store.getUserById(uid);
}
