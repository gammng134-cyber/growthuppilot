import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildAuthorizeUrl,
  gmailConfigured,
  isMailProvider,
  outlookConfigured,
  providerConfigured,
  redirectUriFor,
} from "@/lib/mail/oauth";
import { unsubscribeUrls } from "@/lib/mail/send";

describe("mail oauth", () => {
  beforeEach(() => {
    process.env.GMAIL_CLIENT_ID = "gmail-id";
    process.env.GMAIL_CLIENT_SECRET = "gmail-secret";
    process.env.OUTLOOK_CLIENT_ID = "ms-id";
    process.env.OUTLOOK_CLIENT_SECRET = "ms-secret";
  });

  afterEach(() => {
    delete process.env.GMAIL_CLIENT_ID;
    delete process.env.GMAIL_CLIENT_SECRET;
    delete process.env.OUTLOOK_CLIENT_ID;
    delete process.env.OUTLOOK_CLIENT_SECRET;
  });

  it("detects configured providers", () => {
    expect(gmailConfigured()).toBe(true);
    expect(outlookConfigured()).toBe(true);
    expect(providerConfigured("gmail")).toBe(true);
    expect(providerConfigured("outlook")).toBe(true);
    delete process.env.OUTLOOK_CLIENT_SECRET;
    expect(outlookConfigured()).toBe(false);
    expect(providerConfigured("outlook")).toBe(false);
  });

  it("rejects unknown providers", () => {
    expect(isMailProvider("gmail")).toBe(true);
    expect(isMailProvider("outlook")).toBe(true);
    expect(isMailProvider("smtp")).toBe(false);
    expect(isMailProvider("")).toBe(false);
  });

  it("builds a gmail authorize url with consent + offline access", () => {
    const url = new URL(
      buildAuthorizeUrl("gmail", "state-123", "http://localhost:3200"),
    );
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.pathname).toBe("/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("gmail-id");
    expect(url.searchParams.get("state")).toBe("state-123");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3200/api/mail/callback/gmail",
    );
    expect(url.searchParams.get("scope")).toContain("gmail.send");
  });

  it("builds an outlook authorize url on the common tenant", () => {
    const url = new URL(
      buildAuthorizeUrl("outlook", "s2", "https://growthpilot.vercel.app"),
    );
    expect(url.hostname).toBe("login.microsoftonline.com");
    expect(url.pathname).toContain("/common/oauth2/v2.0/authorize");
    expect(url.searchParams.get("client_id")).toBe("ms-id");
    expect(url.searchParams.get("scope")).toContain("Mail.Send");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://growthpilot.vercel.app/api/mail/callback/outlook",
    );
  });

  it("derives redirect uris from request origin and strips trailing slashes", () => {
    expect(redirectUriFor("gmail", "http://localhost:3200/")).toBe(
      "http://localhost:3200/api/mail/callback/gmail",
    );
    expect(redirectUriFor("outlook", "https://x.vercel.app")).toBe(
      "https://x.vercel.app/api/mail/callback/outlook",
    );
  });

  it("parses List-Unsubscribe header URLs", () => {
    expect(
      unsubscribeUrls('<https://a.example/unsub>, <https://b.example/unsub>'),
    ).toEqual(["https://a.example/unsub", "https://b.example/unsub"]);
    expect(unsubscribeUrls(undefined)).toEqual([]);
  });
});
