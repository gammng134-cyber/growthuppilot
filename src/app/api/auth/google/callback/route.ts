import { NextResponse } from "next/server";

import {
  exchangeGoogleCode,
  fetchGoogleProfile,
} from "@/lib/auth-google";
import { createSession, hashPassword } from "@/lib/auth";
import { getStore } from "@/lib/storage";
import { verifyAuthStateToken } from "@/lib/tokens";

function fail(reqUrl: string, message: string): NextResponse {
  const redirect = new URL("/login", new URL(reqUrl).origin);
  redirect.searchParams.set("google_error", message);
  return NextResponse.redirect(redirect);
}

/** Google sign-in callback — find-or-create the workspace, then sign in. */
export async function GET(req: Request) {
  const url = new URL(req.url);

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    const desc =
      url.searchParams.get("error_description") ?? oauthError;
    return fail(req.url, desc.slice(0, 200));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return fail(req.url, "Missing code or state — try again.");
  }
  if (!(await verifyAuthStateToken(state))) {
    return fail(req.url, "Sign-in expired — please try again.");
  }

  try {
    const accessToken = await exchangeGoogleCode(code, url.origin);
    const profile = await fetchGoogleProfile(accessToken);
    const store = await getStore();

    // 1) Existing Google-linked account.
    let user = await store.getUserByGoogleId(profile.googleAccountId);

    // 2) Existing account with the same email — auto-link it.
    if (!user) {
      const byEmail = await store.getUserByEmail(profile.email);
      if (byEmail) {
        user = await store.linkGoogleAccount(
          byEmail.id,
          profile.googleAccountId,
        );
      }
    }

    // 3) First time — create a workspace. The password is random;
    // the user signs in with Google from here on.
    if (!user) {
      user = await store.createUser(
        profile.email,
        await hashPassword(crypto.randomUUID()),
        profile.googleAccountId,
      );
    }

    if (!user) {
      return fail(req.url, "Could not sign you in — try again.");
    }

    await createSession(user.id);
    return NextResponse.redirect(new URL("/app", url.origin));
  } catch (err) {
    console.error("[auth/google/callback]", err);
    const message =
      err instanceof Error ? err.message : "Google sign-in failed";
    return fail(req.url, message.slice(0, 200));
  }
}
