// OAuth for personal-mailbox send transports: Gmail (Google) and Outlook
// (Microsoft). Tokens are exchanged server-side and stored per user in
// mail_connections; access tokens are refreshed transparently on send.

import { MailConnection } from "@/lib/storage/types";

export type MailProvider = "gmail" | "outlook";

export function isMailProvider(v: string): v is MailProvider {
  return v === "gmail" || v === "outlook";
}

interface ProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  /** Extra params merged into the authorize URL. */
  extraAuthorizeParams?: Record<string, string>;
}

const GMAIL: ProviderConfig = {
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  // gmail.send is the narrowest scope that can send as the user.
  scopes: ["https://www.googleapis.com/auth/gmail.send", "openid", "email"],
  extraAuthorizeParams: {
    // Force a refresh token on re-consent; Google omits it otherwise.
    prompt: "consent",
    access_type: "offline",
  },
};

const OUTLOOK: ProviderConfig = {
  authorizeUrl:
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  // Mail.Send (delegated) sends as the signed-in user; offline_access yields a
  // refresh token; User.Read resolves the mailbox address.
  scopes: [
    "https://graph.microsoft.com/Mail.Send",
    "https://graph.microsoft.com/User.Read",
    "offline_access",
  ],
};

function config(provider: MailProvider): ProviderConfig {
  return provider === "gmail" ? GMAIL : OUTLOOK;
}

export function gmailConfigured(): boolean {
  return !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET);
}

export function outlookConfigured(): boolean {
  return !!(process.env.OUTLOOK_CLIENT_ID && process.env.OUTLOOK_CLIENT_SECRET);
}

export function providerConfigured(provider: MailProvider): boolean {
  return provider === "gmail" ? gmailConfigured() : outlookConfigured();
}

function clientCreds(provider: MailProvider): { id: string; secret: string } {
  if (provider === "gmail") {
    return {
      id: process.env.GMAIL_CLIENT_ID ?? "",
      secret: process.env.GMAIL_CLIENT_SECRET ?? "",
    };
  }
  return {
    id: process.env.OUTLOOK_CLIENT_ID ?? "",
    secret: process.env.OUTLOOK_CLIENT_SECRET ?? "",
  };
}

/**
 * Callback URL for a provider. Prefers the incoming request origin so it works
 * on localhost, preview deployments, and production without extra config.
 */
export function redirectUriFor(provider: MailProvider, reqOrigin: string): string {
  const origin = (reqOrigin || siteUrlBase()).replace(/\/$/, "");
  return `${origin}/api/mail/callback/${provider}`;
}

function siteUrlBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

export function buildAuthorizeUrl(
  provider: MailProvider,
  state: string,
  reqOrigin: string,
): string {
  const cfg = config(provider);
  const { id } = clientCreds(provider);
  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", redirectUriFor(provider, reqOrigin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scopes.join(" "));
  url.searchParams.set("state", state);
  for (const [k, v] of Object.entries(cfg.extraAuthorizeParams ?? {})) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string | null;
  expires_in: number;
  scope?: string;
}

export interface MailTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string;
}

async function postToken(
  provider: MailProvider,
  params: URLSearchParams,
): Promise<TokenResponse> {
  const cfg = config(provider);
  const { id, secret } = clientCreds(provider);
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const desc =
      typeof json.error_description === "string"
        ? json.error_description
        : typeof json.error === "string"
          ? json.error
          : `HTTP ${res.status}`;
    throw new Error(`OAuth token request failed (${provider}): ${desc}`);
  }
  return json as unknown as TokenResponse;
}

function toMailTokens(provider: MailProvider, t: TokenResponse): MailTokens {
  return {
    accessToken: t.access_token,
    // Microsoft re-issues refresh tokens on refresh; Google does not — keep the old one when absent.
    refreshToken: t.refresh_token ?? null,
    expiresAt: new Date(Date.now() + t.expires_in * 1000),
    scope: t.scope ?? config(provider).scopes.join(" "),
  };
}

export async function exchangeCode(
  provider: MailProvider,
  code: string,
  reqOrigin: string,
): Promise<MailTokens> {
  const params = new URLSearchParams({
    client_id: clientCreds(provider).id,
    client_secret: clientCreds(provider).secret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUriFor(provider, reqOrigin),
  });
  return toMailTokens(provider, await postToken(provider, params));
}

export async function refreshAccessToken(
  provider: MailProvider,
  refreshToken: string,
): Promise<MailTokens> {
  const params = new URLSearchParams({
    client_id: clientCreds(provider).id,
    client_secret: clientCreds(provider).secret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  return toMailTokens(provider, await postToken(provider, params));
}

export interface MailProfile {
  providerAccountId: string;
  email: string;
}

/** Resolves the connected account's id and email address. */
export async function fetchProfile(
  provider: MailProvider,
  accessToken: string,
): Promise<MailProfile> {
  if (provider === "gmail") {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Google userinfo failed: HTTP ${res.status}`);
    const j = (await res.json()) as { sub?: string; email?: string };
    if (!j.sub || !j.email) throw new Error("Google profile missing sub/email");
    return { providerAccountId: j.sub, email: j.email.toLowerCase() };
  }
  const res = await fetch("https://graph.microsoft.com/oidc/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Microsoft userinfo failed: HTTP ${res.status}`);
  const j = (await res.json()) as { oid?: string; email?: string; mail?: string; upn?: string };
  const email = j.email ?? j.mail ?? j.upn;
  if (!j.oid || !email) throw new Error("Microsoft profile missing oid/email");
  return { providerAccountId: j.oid, email: email.toLowerCase() };
}

/**
 * Returns a usable access token for a connection, refreshing (and persisting)
 * when the stored one is expired. Throws when a refresh is required but the
 * connection has no refresh token (user must reconnect).
 */
export async function ensureFreshAccessToken(
  conn: MailConnection,
  persist: (patch: { accessToken: string; expiresAt: Date; refreshToken: string | null }) => Promise<void>,
): Promise<string> {
  // Refresh 60s early to absorb clock skew and in-flight request time.
  if (conn.expiresAt.getTime() > Date.now() + 60_000) {
    return conn.accessToken;
  }
  if (!conn.refreshToken) {
    throw new Error(
      "Mailbox token expired and no refresh token stored — reconnect the mailbox in Settings.",
    );
  }
  const t = await refreshAccessToken(conn.provider, conn.refreshToken);
  await persist({
    accessToken: t.accessToken,
    expiresAt: t.expiresAt,
    refreshToken: t.refreshToken ?? conn.refreshToken,
  });
  return t.accessToken;
}
