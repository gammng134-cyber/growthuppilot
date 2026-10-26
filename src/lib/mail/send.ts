// Sending through connected personal mailboxes. Gmail uses the Gmail API with
// base64url MIME; Outlook uses Microsoft Graph's sendMail with a nested
// message payload. Both attach a List-Unsubscribe header for compliance.

import { MailConnection } from "@/lib/storage/types";
import { SendResultInfo } from "@/lib/storage/types";
import { ensureFreshAccessToken } from "./oauth";

export interface MailboxSendOpts {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Formatted "Name <email>" header value; falls back to the mailbox address. */
  from: string;
  replyTo?: string;
  listUnsubscribe?: string;
  connection: MailConnection;
}

function base64UrlEncode(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}

function addressEmails(values: string[]): string[] {
  return values
    .map((v) => v.match(/<([^>]+)>/)?.[1] ?? v)
    .map((v) => v.trim())
    .filter(Boolean);
}

function extractEmail(formatted: string): string {
  return addressEmails([formatted])[0] ?? formatted;
}

/** Parses a List-Unsubscribe header value into its URLs. */
export function unsubscribeUrls(header?: string): string[] {
  if (!header) return [];
  return [...header.matchAll(/<(https?:\/\/[^>]+)>/g)].map((m) => m[1]);
}

async function sendViaGmail(opts: MailboxSendOpts): Promise<SendResultInfo> {
  const conn = opts.connection;
  const lines: string[] = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: multipart/alternative; boundary="gp_boundary"',
  ];
  if (opts.replyTo) lines.push(`Reply-To: ${opts.replyTo}`);
  if (opts.listUnsubscribe) {
    lines.push(`List-Unsubscribe: ${opts.listUnsubscribe}`);
    lines.push(`List-Unsubscribe-Post: List-Unsubscribe=One-Click`);
  }

  const textPart = [
    "--gp_boundary",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    opts.text,
  ].join("\r\n");
  const htmlPart = [
    "--gp_boundary",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    opts.html,
  ].join("\r\n");

  const mime = [...lines, "", [textPart, htmlPart].join("\r\n")].join("\r\n");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.connection.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64UrlEncode(mime) }),
    },
  );
  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(
      `Gmail send failed: ${json.error?.message ?? `HTTP ${res.status}`}`,
    );
  }
  return { id: json.id ?? "gmail_unknown", transport: "gmail" };
}

async function sendViaOutlook(opts: MailboxSendOpts): Promise<SendResultInfo> {
  const conn = opts.connection;
  const body: Record<string, unknown> = {
    message: {
      subject: opts.subject,
      body: { contentType: "HTML", content: opts.html },
      toRecipients: [
        {
          emailAddress: { address: extractEmail(opts.to) },
        },
      ],
    },
    saveToSentItems: true,
  };
  if (opts.replyTo) {
    (body.message as Record<string, unknown>).replyTo = [
      { emailAddress: { address: extractEmail(opts.replyTo) } },
    ];
  }
  if (opts.listUnsubscribe) {
    const urls = unsubscribeUrls(opts.listUnsubscribe);
    // Graph has no List-Unsubscribe-Post; set the standard header so clients
    // can offer one-click unsub via the http mailto/url entries.
    (body.message as Record<string, unknown>).internetMessageHeaders = [
      { name: "List-Unsubscribe", value: opts.listUnsubscribe },
      ...(urls.length
        ? [{ name: "List-Unsubscribe-Post", value: "List-Unsubscribe=One-Click" }]
        : []),
    ];
  }

  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.connection.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(text) as { error?: { message?: string } };
      if (j.error?.message) msg = j.error.message;
    } catch {
      /* keep status-only message */
    }
    throw new Error(`Outlook send failed: ${msg}`);
  }
  // Graph sendMail returns 202 Accepted with no body — synthesize an id.
  return {
    id: `outlook_${opts.connection.providerAccountId}_${Date.now()}`,
    transport: "outlook",
  };
}

export async function sendViaMailbox(
  opts: Omit<MailboxSendOpts, "connection"> & {
    connection: MailConnection;
    freshAccessToken: string;
  },
): Promise<SendResultInfo> {
  const withToken: MailboxSendOpts = {
    ...opts,
    connection: { ...opts.connection, accessToken: opts.freshAccessToken },
  };
  return opts.connection.provider === "gmail"
    ? sendViaGmail(withToken)
    : sendViaOutlook(withToken);
}
