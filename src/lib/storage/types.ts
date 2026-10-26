// Core entity types shared by both storage backends.

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  /** Google account id when the account was created/linked via Google sign-in. */
  googleAccountId: string | null;
  createdAt: Date;
}

export interface Settings {
  userId: string;
  productBrief: string;
  brandVoice: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  /** Days to wait after a sent email before generating a follow-up draft. 0 = disabled. */
  followUpAfterDays: number;
  autopilot: boolean;
  autoPublish: boolean;
  /** "resend" (deliverability platform) or "mailbox" (connected Gmail/Outlook). */
  sendVia: "resend" | "mailbox";
}

export function defaultSettings(userId: string): Settings {
  return {
    userId,
    productBrief: "",
    brandVoice: "",
    fromName: "",
    fromEmail: process.env.EMAIL_FROM || "onboarding@resend.dev",
    replyTo: "",
    followUpAfterDays: 3,
    autopilot: false,
    autoPublish: false,
    sendVia: "resend",
  };
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string;
  company: string;
  role: string;
  notes: string;
  /** What the lead said in public (post/comment text) — used for personalization. */
  sourceContext: string;
  unsubscribed: boolean;
  createdAt: Date;
}

export type DraftStatus =
  | "draft"
  | "approved"
  | "sent"
  | "replied"
  | "bounced"
  | "rejected";

export type DraftKind = "initial" | "followup";

export interface EmailDraft {
  id: string;
  userId: string;
  contactId: string;
  kind: DraftKind;
  parentDraftId: string | null;
  subject: string;
  body: string;
  status: DraftStatus;
  sentAt: Date | null;
  messageId: string | null;
  followUpDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type EventType =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "replied"
  | "note";

export interface EmailEvent {
  id: string;
  userId: string;
  draftId: string;
  contactId: string;
  type: EventType;
  meta: string | null;
  createdAt: Date;
}

export interface Keyword {
  id: string;
  userId: string;
  keyword: string;
  /** e.g. "informational" | "commercial" | "comparison" */
  intent: string;
  cluster: string;
  /** AI-estimated monthly searches in v1 — not live SERP data. */
  estVolume: number;
  /** 1 (easy) – 10 (brutal), AI-estimated. */
  difficulty: number;
  angle: string;
  status: "planned" | "written";
  createdAt: Date;
}

export interface Faq {
  q: string;
  a: string;
}

export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  userId: string;
  keywordId: string | null;
  keyword: string;
  title: string;
  slug: string;
  metaDescription: string;
  markdown: string;
  faqs: Faq[];
  status: ArticleStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stats {
  contacts: number;
  pendingDrafts: number;
  sent: number;
  replies: number;
  keywords: number;
  published: number;
}

export interface SendResultInfo {
  id: string;
  transport: "resend" | "mock" | "gmail" | "outlook";
}

/** A connected personal mailbox used as the send transport. */
export interface MailConnection {
  id: string;
  userId: string;
  provider: "gmail" | "outlook";
  providerAccountId: string;
  email: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Public (token-free) view of a connection for API/UI. */
export type MailConnectionPublic = Pick<
  MailConnection,
  "id" | "provider" | "email" | "createdAt" | "updatedAt"
> & {
  /** True when the stored access token is past its expiry (needs refresh on next send). */
  tokenExpired: boolean;
};

export interface NewDraft {
  userId: string;
  contactId: string;
  kind: DraftKind;
  parentDraftId?: string | null;
  subject: string;
  body: string;
  status?: DraftStatus;
}

export interface Storage {
  // Users
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(
    email: string,
    passwordHash: string,
    googleAccountId?: string | null,
  ): Promise<User>;
  /** Find the account a Google sign-in belongs to (if any). */
  getUserByGoogleId(googleAccountId: string): Promise<User | null>;
  /** Attach a Google account id to an existing user (auto-link by email). */
  linkGoogleAccount(
    userId: string,
    googleAccountId: string,
  ): Promise<User | null>;

  // Settings
  getSettings(userId: string): Promise<Settings>;
  updateSettings(userId: string, patch: Partial<Settings>): Promise<Settings>;

  // Contacts
  listContacts(userId: string): Promise<Contact[]>;
  getContact(userId: string, id: string): Promise<Contact | null>;
  createContact(
    data: Omit<Contact, "id" | "createdAt" | "unsubscribed"> & {
      unsubscribed?: boolean;
    },
  ): Promise<Contact>;
  updateContact(
    userId: string,
    id: string,
    patch: Partial<Contact>,
  ): Promise<Contact | null>;
  deleteContact(userId: string, id: string): Promise<boolean>;

  // Drafts
  /** Webhook lookup by provider message id (not user-scoped). */
  findDraftByMessageId(messageId: string): Promise<EmailDraft | null>;
  listDrafts(userId: string): Promise<EmailDraft[]>;
  getDraft(userId: string, id: string): Promise<EmailDraft | null>;
  createDraft(data: NewDraft): Promise<EmailDraft>;
  updateDraft(
    userId: string,
    id: string,
    patch: Partial<EmailDraft>,
  ): Promise<EmailDraft | null>;

  // Events
  addEvent(ev: {
    userId: string;
    draftId: string;
    contactId: string;
    type: EventType;
    meta?: string;
  }): Promise<EmailEvent>;
  listDraftEvents(userId: string, draftId: string): Promise<EmailEvent[]>;

  // Keywords
  listKeywords(userId: string): Promise<Keyword[]>;
  getKeyword(userId: string, id: string): Promise<Keyword | null>;
  createKeywords(
    userId: string,
    items: Omit<Keyword, "id" | "userId" | "status" | "createdAt">[],
  ): Promise<Keyword[]>;
  updateKeyword(
    userId: string,
    id: string,
    patch: Partial<Keyword>,
  ): Promise<Keyword | null>;

  // Articles
  listArticles(userId: string): Promise<Article[]>;
  listPublishedArticles(): Promise<
    Pick<
      Article,
      "title" | "slug" | "metaDescription" | "keyword" | "publishedAt" | "updatedAt"
    >[]
  >;
  getArticleBySlug(slug: string): Promise<Article | null>;
  getArticle(userId: string, id: string): Promise<Article | null>;
  createArticle(data: {
    userId: string;
    keywordId: string | null;
    keyword: string;
    title: string;
    slug: string;
    metaDescription: string;
    markdown: string;
    faqs: Faq[];
    status?: ArticleStatus;
  }): Promise<Article>;
  updateArticle(
    userId: string,
    id: string,
    patch: Partial<Article>,
  ): Promise<Article | null>;
  slugExists(slug: string): Promise<boolean>;

  // Cross-user automation (cron)
  dueFollowUps(now: Date): Promise<{ userId: string; draft: EmailDraft }[]>;
  autopilotTargets(): Promise<
    { userId: string; keyword: Keyword | null; hasPlan: boolean }[]
  >;

  // Mail connections (OAuth Gmail/Outlook send transport)
  listMailConnections(userId: string): Promise<MailConnection[]>;
  /** Upsert keyed by (userId, provider, providerAccountId) — reconnects refresh tokens. */
  upsertMailConnection(conn: {
    userId: string;
    provider: MailConnection["provider"];
    providerAccountId: string;
    email: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
    scope: string;
  }): Promise<MailConnection>;
  getMailConnection(
    userId: string,
    id: string,
  ): Promise<MailConnection | null>;
  deleteMailConnection(userId: string, id: string): Promise<boolean>;

  stats(userId: string): Promise<Stats>;
}
