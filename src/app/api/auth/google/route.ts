import { NextResponse } from "next/server";

import {
  buildGoogleAuthorizeUrl,
  googleSignInConfigured,
} from "@/lib/auth-google";
import { signAuthStateToken } from "@/lib/tokens";

/** "Continue with Google" — starts the OAuth round-trip. */
export async function GET(req: Request) {
  if (!googleSignInConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google sign-in is not configured on this server — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      },
      { status: 503 },
    );
  }
  const state = await signAuthStateToken();
  const url = buildGoogleAuthorizeUrl(state, new URL(req.url).origin);
  return NextResponse.redirect(url);
}
