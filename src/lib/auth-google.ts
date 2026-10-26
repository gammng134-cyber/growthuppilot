// Google sign-in OAuth ("Continue with Google"). The code is exchanged
// server-side; only a session cookie is kept. The same Google Cloud
// OAuth client used by the Gmail mailbox connector can serve this flow
// — just register /api/auth/google/callback as an extra redirect URI.

export function googleSignInConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Callback URL for Google sign-in. Prefers the incoming request origin
 * so it works on localhost, preview deployments, and production.
 */
export function googleRedirectUri(reqOrigin: string): string {
  const origin = (reqOrigin || siteUrlBase()).replace(/\/$/, "");
  return `${origin}/api/auth/google/callback`;
}

function siteUrlBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function buildGoogleAuthorizeUrl(
  state: string,
  reqOrigin: string,
): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", googleRedirectUri(reqOrigin));
  url.searchParams.set("response_type", "code");
  // openid+email+profile: identify the user, nothing more.
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

/** Exchanges the authorization code for a short-lived access token. */
export async function exchangeGoogleCode(
  code: string,
  reqOrigin: string,
): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    code,
    grant_type: "authorization_code",
    redirect_uri: googleRedirectUri(reqOrigin),
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const json = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !json.access_token) {
    const desc =
      typeof json.error_description === "string"
        ? json.error_description
        : typeof json.error === "string"
          ? json.error
          : `HTTP ${res.status}`;
    throw new Error(`Google sign-in failed: ${desc}`);
  }
  return json.access_token;
}

export interface GoogleProfile {
  /** Google's stable account id (the "sub" claim). */
  googleAccountId: string;
  email: string;
  name: string;
}

/** Resolves the signed-in Google account's id, email and display name. */
export async function fetchGoogleProfile(
  accessToken: string,
): Promise<GoogleProfile> {
  const res = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Google userinfo failed: HTTP ${res.status}`);
  const j = (await res.json()) as {
    sub?: string;
    email?: string;
    name?: string;
  };
  if (!j.sub || !j.email) throw new Error("Google profile missing sub/email");
  return {
    googleAccountId: j.sub,
    email: j.email.toLowerCase(),
    name: j.name ?? "",
  };
}
