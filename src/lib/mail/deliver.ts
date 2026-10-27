// One source of truth for putting an approved draft in someone's inbox.
// Used by the manual send route and the cold-email autopilot so both behave
// identically (unsubscribe header, from-name, token refresh, transport pick).

import { buildEmailHtml, buildEmailText, listUnsubscribeHeader, unsubscribeUrlFor } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/transport";
import { ensureFreshAccessToken } from "@/lib/mail/oauth";
import { sendViaMailbox } from "@/lib/mail/send";
import { signUnsubscribeToken } from "@/lib/tokens";
import { Contact, EmailDraft, MailConnection, Settings, Storage, User } from "@/lib/storage/types";

export interface DeliverResult {
  messageId: string;
  transport: string;
}

/**
 * Sends `draft` to `contact` using the user's configured transport.
 * Throws when the transport is misconfigured (caller decides how to surface).
 */
export async function deliverDraft(
  store: Storage,
  user: User,
  draft: EmailDraft,
  contact: Contact,
  settings: Settings,
): Promise<DeliverResult> {
  const useMailbox = settings.sendVia === "mailbox";
  const connections = useMailbox
    ? await store.listMailConnections(user.id)
    : [];
  if (useMailbox && connections.length === 0) {
    throw new Error(
      "Send-via mailbox is selected but no mailbox is connected — connect one in Settings or switch send-via back to Resend.",
    );
  }
  const connection: MailConnection | undefined = connections[0];

  // Prefer the user's configured display name, then the mailbox address.
  const fallbackName = useMailbox
    ? connection!.email.split("@")[0]
    : user.email.split("@")[0];
  const fromName = settings.fromName || fallbackName;
  const fromEmail = useMailbox ? connection!.email : settings.fromEmail || "onboarding@resend.dev";
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const token = await signUnsubscribeToken(user.id, contact.id);
  const unsubUrl = unsubscribeUrlFor(token);
  const html = buildEmailHtml({
    subject: draft.subject,
    body: draft.body,
    fromName,
    unsubscribeUrl: unsubUrl,
  });
  const text = buildEmailText({
    subject: draft.subject,
    body: draft.body,
    fromName,
    unsubscribeUrl: unsubUrl,
  });

  const result = useMailbox
    ? await (async () => {
        const freshAccessToken = await ensureFreshAccessToken(
          connection!,
          async (patch) => {
            await store.upsertMailConnection({
              userId: user.id,
              provider: connection!.provider,
              providerAccountId: connection!.providerAccountId,
              email: connection!.email,
              accessToken: patch.accessToken,
              refreshToken: patch.refreshToken,
              expiresAt: patch.expiresAt,
              scope: connection!.scope,
            });
          },
        );
        return sendViaMailbox({
          to: contact.email,
          subject: draft.subject,
          html,
          text,
          from,
          replyTo: settings.replyTo || undefined,
          listUnsubscribe: listUnsubscribeHeader(unsubUrl),
          connection: connection!,
          freshAccessToken,
        });
      })()
    : await sendEmail({
        to: contact.email,
        subject: draft.subject,
        html,
        text,
        from,
        replyTo: settings.replyTo || undefined,
        listUnsubscribe: listUnsubscribeHeader(unsubUrl),
      });

  return { messageId: result.id, transport: result.transport };
}

/** Schedules the next follow-up check for an "initial" email, if enabled. */
export function followUpDueAtFor(settings: Settings, kind: string, sentAt: Date): Date | null {
  return settings.followUpAfterDays > 0 && kind === "initial"
    ? new Date(sentAt.getTime() + settings.followUpAfterDays * 86_400_000)
    : null;
}
