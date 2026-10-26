import { jwtVerify, SignJWT } from "jose";

function secret(): Uint8Array {
  const s =
    process.env.AUTH_SECRET ?? "dev-only-secret-change-me-32chars-minimum!!";
  return new TextEncoder().encode(s);
}

export async function signUnsubscribeToken(
  userId: string,
  contactId: string,
): Promise<string> {
  return new SignJWT({ contactId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secret());
}

export async function verifyUnsubscribeToken(
  token: string,
): Promise<{ userId: string; contactId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const contactId = payload.contactId as string | undefined;
    if (!payload.sub || !contactId) return null;
    return { userId: payload.sub, contactId };
  } catch {
    return null;
  }
}

/** Signed, short-lived state for the mailbox OAuth round-trip (CSRF guard). */
export async function signMailStateToken(userId: string): Promise<string> {
  return new SignJWT({ kind: "mail_oauth" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());
}

export async function verifyMailStateToken(
  token: string,
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== "mail_oauth" || !payload.sub) return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

/**
 * Signed, short-lived state for the Google sign-in round-trip (CSRF
 * guard). Unlike the mailbox flow there is no signed-in user yet, so
 * the token carries only its kind.
 */
export async function signAuthStateToken(): Promise<string> {
  return new SignJWT({ kind: "google_auth" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());
}

export async function verifyAuthStateToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.kind === "google_auth";
  } catch {
    return false;
  }
}
