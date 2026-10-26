import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  buildAuthorizeUrl,
  isMailProvider,
  providerConfigured,
} from "@/lib/mail/oauth";
import { signMailStateToken } from "@/lib/tokens";

/** This route is a plain link target, so failures land on Settings as a toast
 * (same pattern as the callback) instead of raw JSON on a blank page. */
function fail(reqUrl: string, message: string): NextResponse {
  const redirect = new URL("/app/settings", new URL(reqUrl).origin);
  redirect.searchParams.set("mail_error", message);
  return NextResponse.redirect(redirect);
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return fail(req.url, "Session expired — log in and try again.");
  }
  const provider = new URL(req.url).searchParams.get("provider") ?? "";
  if (!isMailProvider(provider)) {
    return fail(req.url, "Unknown provider.");
  }
  if (!providerConfigured(provider)) {
    const vars =
      provider === "gmail"
        ? "GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET"
        : "OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET";
    return fail(
      req.url,
      `${provider === "gmail" ? "Gmail" : "Outlook"} isn't configured on this server — set ${vars} in .env.local (or Vercel env vars) and restart.`,
    );
  }
  const state = await signMailStateToken(user.id);
  const url = buildAuthorizeUrl(provider, state, new URL(req.url).origin);
  return NextResponse.redirect(url);
}
