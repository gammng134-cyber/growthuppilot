import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  exchangeCode,
  fetchProfile,
  isMailProvider,
} from "@/lib/mail/oauth";
import { verifyMailStateToken } from "@/lib/tokens";
import { getStore } from "@/lib/storage";

function fail(reqUrl: string, message: string): NextResponse {
  const redirect = new URL("/app/settings", new URL(reqUrl).origin);
  redirect.searchParams.set("mail_error", message);
  return NextResponse.redirect(redirect);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const url = new URL(req.url);

  const user = await getCurrentUser();
  if (!user) return fail(req.url, "Session expired — log in and try again.");

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    const desc = url.searchParams.get("error_description") ?? oauthError;
    return fail(req.url, desc.slice(0, 200));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return fail(req.url, "Missing code or state.");

  const stateData = await verifyMailStateToken(state);
  if (!stateData || stateData.userId !== user.id) {
    return fail(req.url, "Invalid OAuth state — start the connection again.");
  }
  if (!isMailProvider(provider)) {
    return fail(req.url, "Unknown provider.");
  }

  try {
    const tokens = await exchangeCode(provider, code, url.origin);
    const profile = await fetchProfile(provider, tokens.accessToken);
    const store = await getStore();
    await store.upsertMailConnection({
      userId: user.id,
      provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      scope: tokens.scope,
    });
  } catch (err) {
    console.error("[mail/callback]", err);
    const message = err instanceof Error ? err.message : "Token exchange failed";
    return fail(req.url, message.slice(0, 200));
  }

  const redirect = new URL("/app/settings", url.origin);
  redirect.searchParams.set("mail_connected", provider);
  return NextResponse.redirect(redirect);
}
