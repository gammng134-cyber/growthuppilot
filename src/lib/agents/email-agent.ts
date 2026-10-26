import { generateJson } from "@/lib/ai";
import {
  Contact,
  EmailDraft,
  Settings,
  Storage,
} from "@/lib/storage/types";

interface DraftPayload {
  subject: string;
  body: string;
}

const DRAFT_TASK = "TASK:EMAIL_DRAFT";
const FOLLOWUP_TASK = "TASK:FOLLOWUP";

const SYSTEM = `You are an elite one-to-one outreach copywriter. You write emails that sound like a real founder typed them: lowercase-friendly, specific, zero buzzwords, zero "I hope this email finds you well".
Hard rules:
- Reference what the person actually said (their exact words when possible).
- 60-110 words. Short paragraphs. One soft, easy-to-answer question at the end.
- Never invent facts about the sender's product beyond the brief.
- No emojis, no links, no attachments, no "just following up" energy.
Return ONLY valid JSON: {"subject": string (max 70 chars, human, lowercase-friendly), "body": string}`;

export function buildDraftPrompt(
  settings: Settings,
  contact: Contact,
): string {
  return `${DRAFT_TASK}
PRODUCT BRIEF: ${settings.productBrief || "an early-stage SaaS tool"}
BRAND VOICE: ${settings.brandVoice || "friendly, direct, founder-to-founder"}
CONTACT NAME: ${contact.name || "unknown"}
COMPANY: ${contact.company || "unknown"}
ROLE: ${contact.role || "unknown"}
WHAT THEY SAID: ${contact.sourceContext || contact.notes || "no public context"}
INBOX CONTEXT: ${contact.notes || "none"}
Write a first-touch email personalized to them.`;
}

export function buildFollowUpPrompt(
  settings: Settings,
  contact: Contact,
  original: EmailDraft,
): string {
  return `${FOLLOWUP_TASK}
PRODUCT BRIEF: ${settings.productBrief || "an early-stage SaaS tool"}
BRAND VOICE: ${settings.brandVoice || "friendly, direct, founder-to-founder"}
CONTACT NAME: ${contact.name || "unknown"}
COMPANY: ${contact.company || "unknown"}
ORIGINAL SUBJECT: ${original.subject}
ORIGINAL BODY: ${original.body}
Write ONE short, polite bump email (30-60 words). Offer an easy out. No guilt.`;
}

export function parseDraftJson(raw: unknown): DraftPayload {
  const p = raw as Partial<DraftPayload>;
  const subject = (p.subject ?? "").toString().trim();
  const body = (p.body ?? "").toString().trim();
  if (!subject || !body) {
    throw new Error("AI draft missing subject or body");
  }
  return {
    subject: subject.slice(0, 120),
    body: body.slice(0, 4000),
  };
}

export async function generateDraft(
  store: Storage,
  userId: string,
  settings: Settings,
  contact: Contact,
): Promise<EmailDraft> {
  const payload = parseDraftJson(
    await generateJson(SYSTEM, buildDraftPrompt(settings, contact)),
  );
  return store.createDraft({
    userId,
    contactId: contact.id,
    kind: "initial",
    subject: payload.subject,
    body: payload.body,
  });
}

export async function generateFollowUp(
  store: Storage,
  userId: string,
  settings: Settings,
  contact: Contact,
  parent: EmailDraft,
): Promise<EmailDraft> {
  const payload = parseDraftJson(
    await generateJson(
      SYSTEM,
      buildFollowUpPrompt(settings, contact, parent),
    ),
  );
  return store.createDraft({
    userId,
    contactId: contact.id,
    kind: "followup",
    parentDraftId: parent.id,
    subject: payload.subject,
    body: payload.body,
  });
}
