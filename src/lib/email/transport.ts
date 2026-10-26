import { Resend } from "resend";

import { SendResultInfo } from "@/lib/storage/types";

export interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: string;
  replyTo?: string;
  listUnsubscribe?: string;
}

export function emailTransportReady(): boolean {
  return !!process.env.RESEND_API_KEY && process.env.DEMO_MODE !== "1";
}

export function describeTransport(): "resend" | "mock" {
  return emailTransportReady() ? "resend" : "mock";
}

/** Sends via Resend when configured; otherwise records a mock send. */
export async function sendEmail(opts: SendEmailOpts): Promise<SendResultInfo> {
  if (!emailTransportReady()) {
    return { id: `mock_${crypto.randomUUID()}`, transport: "mock" };
  }
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { data, error } = await resend.emails.send({
    from: opts.from,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    headers: {
      ...(opts.listUnsubscribe
        ? { "List-Unsubscribe": opts.listUnsubscribe }
        : {}),
    },
  });
  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
  return { id: data?.id ?? `resend_unknown`, transport: "resend" };
}
