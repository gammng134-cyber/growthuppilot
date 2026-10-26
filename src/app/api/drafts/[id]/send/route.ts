import { NextResponse } from "next/server";

import { withUser } from "@/lib/api";
import {
  buildEmailHtml,
  buildEmailText,
  listUnsubscribeHeader,
  unsubscribeUrlFor,
} from "@/lib/email/templates";
import { emailTransportReady, sendEmail } from "@/lib/email/transport";
import { ensureFreshAccessToken } from "@/lib/mail/oauth";
import { sendViaMailbox } from "@/lib/mail/send";
import { signUnsubscribeToken } from "@/lib/tokens";
import { getStore } from "@/lib/storage";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(async (user) => {
    const { id } = await params;
    const store = await getStore();
    const draft = await store.getDraft(user.id, id);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    if (draft.status === "sent" || draft.status === "replied") {
      return NextResponse.json(
        { error: "This email was already sent" },
        { status: 400 },
      );
    }
    const contact = await store.getContact(user.id, draft.contactId);
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    if (contact.unsubscribed) {
      return NextResponse.json(
        { error: "This contact unsubscribed — sending is blocked" },
        { status: 400 },
      );
    }
    const settings = await store.getSettings(user.id);
    const useMailbox = settings.sendVia === "mailbox";
    const connections = useMailbox
      ? await store.listMailConnections(user.id)
      : [];
    if (useMailbox && connections.length === 0) {
      return NextResponse.json(
        {
          error:
            "Send-via mailbox is selected but no mailbox is connected — connect one in Settings or switch send-via back to Resend.",
        },
        { status: 400 },
      );
    }
    const connection = connections[0];

    const fromName = useMailbox
      ? connection.email.split("@")[0]
      : settings.fromName || user.email.split("@")[0];
    const fromEmail = useMailbox
      ? connection.email
      : settings.fromEmail || "onboarding@resend.dev";
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
            connection,
            async (patch) => {
              await store.upsertMailConnection({
                userId: user.id,
                provider: connection.provider,
                providerAccountId: connection.providerAccountId,
                email: connection.email,
                accessToken: patch.accessToken,
                refreshToken: patch.refreshToken,
                expiresAt: patch.expiresAt,
                scope: connection.scope,
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
            connection,
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

    const sentAt = new Date();
    const followUpDueAt =
      settings.followUpAfterDays > 0 && draft.kind === "initial"
        ? new Date(sentAt.getTime() + settings.followUpAfterDays * 86_400_000)
        : null;

    await store.updateDraft(user.id, id, {
      status: "sent",
      sentAt,
      messageId: result.id,
      followUpDueAt,
    });
    await store.addEvent({
      userId: user.id,
      draftId: draft.id,
      contactId: contact.id,
      type: "sent",
      meta: `via ${result.transport}`,
    });

    const transport = useMailbox
      ? result.transport
      : emailTransportReady()
        ? "resend"
        : "mock";

    return NextResponse.json({
      ok: true,
      messageId: result.id,
      transport,
    });
  });
}
