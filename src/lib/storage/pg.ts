// Postgres storage — production backend via Drizzle (Vercel Postgres / Neon).

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";

// Lazy-loaded Postgres client. The `any` here is intentional: the `postgres`
// package is only a production dependency used in non-demo mode, and its
// TypeScript types are not needed at build time for the demo path.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let postgres: (url: string, opts?: { prepare?: boolean }) => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadPostgres(): Promise<any> {
  if (!postgres) {
    postgres = (await import("postgres")).default;
  }
  return postgres;
}

import {
  articles,
  contacts,
  emailDrafts,
  emailEvents,
  keywords,
  mailConnections,
  settings as settingsTable,
  users,
} from "./schema";
import {
  Article,
  Contact,
  defaultSettings,
  EmailDraft,
  EmailEvent,
  Keyword,
  MailConnection,
  NewDraft,
  Settings,
  Stats,
  Storage,
  User,
} from "./types";

type UserRow = typeof users.$inferSelect;
type DraftRow = typeof emailDrafts.$inferSelect;
type ContactRow = typeof contacts.$inferSelect;
type KeywordRow = typeof keywords.$inferSelect;
type ArticleRow = typeof articles.$inferSelect;
type MailConnRow = typeof mailConnections.$inferSelect;

function rowToUser(r: UserRow): User {
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.passwordHash,
    googleAccountId: r.googleAccountId ?? null,
    createdAt: r.createdAt,
  };
}

function rowToContact(r: ContactRow): Contact {
  return {
    id: r.id,
    userId: r.userId,
    name: r.name,
    email: r.email,
    company: r.company,
    role: r.role,
    notes: r.notes,
    sourceContext: r.sourceContext,
    unsubscribed: r.unsubscribed,
    createdAt: r.createdAt,
  };
}

function rowToDraft(r: DraftRow): EmailDraft {
  return {
    id: r.id,
    userId: r.userId,
    contactId: r.contactId,
    kind: r.kind as EmailDraft["kind"],
    parentDraftId: r.parentDraftId,
    subject: r.subject,
    body: r.body,
    status: r.status as EmailDraft["status"],
    sentAt: r.sentAt,
    messageId: r.messageId,
    followUpDueAt: r.followUpDueAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function rowToKeyword(r: KeywordRow): Keyword {
  return {
    id: r.id,
    userId: r.userId,
    keyword: r.keyword,
    intent: r.intent,
    cluster: r.cluster,
    estVolume: r.estVolume,
    difficulty: r.difficulty,
    angle: r.angle,
    status: r.status as Keyword["status"],
    createdAt: r.createdAt,
  };
}

function rowToMailConnection(r: MailConnRow): MailConnection {
  return {
    id: r.id,
    userId: r.userId,
    provider: r.provider as MailConnection["provider"],
    providerAccountId: r.providerAccountId,
    email: r.email,
    accessToken: r.accessToken,
    refreshToken: r.refreshToken,
    expiresAt: r.expiresAt,
    scope: r.scope,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function rowToArticle(r: ArticleRow): Article {
  return {
    id: r.id,
    userId: r.userId,
    keywordId: r.keywordId,
    keyword: r.keyword,
    title: r.title,
    slug: r.slug,
    metaDescription: r.metaDescription,
    markdown: r.markdown,
    faqs: (r.faqs as { q: string; a: string }[]) ?? [],
    status: r.status as Article["status"],
    publishedAt: r.publishedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class PgStore implements Storage {
  private db!: PostgresJsDatabase<Record<string, never>>;

  constructor(databaseUrl: string) {
    // NOTE: db is lazily initialized because `postgres` is a production-only
    // dependency that isn't available at build time in demo mode. The real
    // connection is established in getStore() at runtime via connect().
  }

  async connect(databaseUrl: string): Promise<void> {
    const postgresImpl = await loadPostgres();
    const client = postgresImpl(databaseUrl, { prepare: false });
    this.db = drizzle(client) as PostgresJsDatabase<Record<string, never>>;
  }

  // ── Users ──────────────────────────────────────────────
  async getUserByEmail(email: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);
    return rows[0] ? rowToUser(rows[0]) : null;
  }

  async getUserById(uid: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.id, uid))
      .limit(1);
    return rows[0] ? rowToUser(rows[0]) : null;
  }

  async createUser(
    email: string,
    passwordHash: string,
    googleAccountId?: string | null,
  ): Promise<User> {
    const rows = await this.db
      .insert(users)
      .values({
        email: email.trim().toLowerCase(),
        passwordHash,
        googleAccountId: googleAccountId ?? null,
      })
      .returning();
    return rowToUser(rows[0]);
  }
  async getUserByGoogleId(googleAccountId: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.googleAccountId, googleAccountId))
      .limit(1);
    return rows[0] ? rowToUser(rows[0]) : null;
  }
  async linkGoogleAccount(
    userId: string,
    googleAccountId: string,
  ): Promise<User | null> {
    const rows = await this.db
      .update(users)
      .set({ googleAccountId })
      .where(eq(users.id, userId))
      .returning();
    return rows[0] ? rowToUser(rows[0]) : null;
  }

  // ── Settings ───────────────────────────────────────────
  async getSettings(userId: string): Promise<Settings> {
    const rows = await this.db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.userId, userId))
      .limit(1);
    if (!rows[0]) return defaultSettings(userId);
    const r = rows[0];
    return {
      userId: r.userId,
      productBrief: r.productBrief,
      brandVoice: r.brandVoice,
      fromName: r.fromName,
      fromEmail: r.fromEmail,
      replyTo: r.replyTo,
      followUpAfterDays: r.followUpAfterDays,
      autopilot: r.autopilot,
      autoPublish: r.autoPublish,
      sendVia: r.sendVia as Settings["sendVia"],
      outreachAutopilot: r.outreachAutopilot,
      dailySendCap: r.dailySendCap,
    };
  }

  async updateSettings(
    userId: string,
    patch: Partial<Settings>,
  ): Promise<Settings> {
    await this.getSettings(userId); // ensure row exists
    await this.db
      .update(settingsTable)
      .set(patch)
      .where(eq(settingsTable.userId, userId));
    return this.getSettings(userId);
  }

  // ── Contacts ───────────────────────────────────────────
  async listContacts(userId: string): Promise<Contact[]> {
    const rows = await this.db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.createdAt));
    return rows.map(rowToContact);
  }

  async getContact(userId: string, cid: string): Promise<Contact | null> {
    const rows = await this.db
      .select()
      .from(contacts)
      .where(and(eq(contacts.userId, userId), eq(contacts.id, cid)))
      .limit(1);
    return rows[0] ? rowToContact(rows[0]) : null;
  }

  async createContact(
    data: Omit<Contact, "id" | "createdAt" | "unsubscribed"> & {
      unsubscribed?: boolean;
    },
  ): Promise<Contact> {
    const rows = await this.db
      .insert(contacts)
      .values({
        userId: data.userId,
        name: data.name,
        email: data.email.trim().toLowerCase(),
        company: data.company,
        role: data.role,
        notes: data.notes,
        sourceContext: data.sourceContext,
        unsubscribed: data.unsubscribed ?? false,
      })
      .returning();
    return rowToContact(rows[0]);
  }

  async updateContact(
    userId: string,
    cid: string,
    patch: Partial<Contact>,
  ): Promise<Contact | null> {
    const existing = await this.getContact(userId, cid);
    if (!existing) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, userId: _u, createdAt: _c, ...rest } = patch;
    await this.db
      .update(contacts)
      .set(rest)
      .where(eq(contacts.id, cid));
    return this.getContact(userId, cid);
  }

  async deleteContact(userId: string, cid: string): Promise<boolean> {
    const rows = await this.db
      .delete(contacts)
      .where(and(eq(contacts.userId, userId), eq(contacts.id, cid)))
      .returning({ id: contacts.id });
    return rows.length > 0;
  }

  // ── Drafts ─────────────────────────────────────────────
  async findDraftByMessageId(messageId: string): Promise<EmailDraft | null> {
    const rows = await this.db
      .select()
      .from(emailDrafts)
      .where(eq(emailDrafts.messageId, messageId))
      .limit(1);
    return rows[0] ? rowToDraft(rows[0]) : null;
  }

  async listDrafts(userId: string): Promise<EmailDraft[]> {
    const rows = await this.db
      .select()
      .from(emailDrafts)
      .where(eq(emailDrafts.userId, userId))
      .orderBy(desc(emailDrafts.createdAt));
    return rows.map(rowToDraft);
  }

  async getDraft(userId: string, did: string): Promise<EmailDraft | null> {
    const rows = await this.db
      .select()
      .from(emailDrafts)
      .where(and(eq(emailDrafts.userId, userId), eq(emailDrafts.id, did)))
      .limit(1);
    return rows[0] ? rowToDraft(rows[0]) : null;
  }

  async createDraft(data: NewDraft): Promise<EmailDraft> {
    const rows = await this.db
      .insert(emailDrafts)
      .values({
        userId: data.userId,
        contactId: data.contactId,
        kind: data.kind,
        parentDraftId: data.parentDraftId ?? null,
        subject: data.subject,
        body: data.body,
        status: data.status ?? "draft",
      })
      .returning();
    return rowToDraft(rows[0]);
  }

  async updateDraft(
    userId: string,
    did: string,
    patch: Partial<EmailDraft>,
  ): Promise<EmailDraft | null> {
    const existing = await this.getDraft(userId, did);
    if (!existing) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, userId: _u, createdAt: _c, ...rest } = patch;
    await this.db
      .update(emailDrafts)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(emailDrafts.id, did));
    return this.getDraft(userId, did);
  }

  // ── Events ─────────────────────────────────────────────
  async addEvent(ev: {
    userId: string;
    draftId: string;
    contactId: string;
    type: EmailEvent["type"];
    meta?: string;
  }): Promise<EmailEvent> {
    const rows = await this.db
      .insert(emailEvents)
      .values({
        userId: ev.userId,
        draftId: ev.draftId,
        contactId: ev.contactId,
        type: ev.type,
        meta: ev.meta ?? null,
      })
      .returning();
    return {
      id: rows[0].id,
      userId: rows[0].userId,
      draftId: rows[0].draftId,
      contactId: rows[0].contactId,
      type: rows[0].type as EmailEvent["type"],
      meta: rows[0].meta,
      createdAt: rows[0].createdAt,
    };
  }

  async listDraftEvents(
    userId: string,
    draftId: string,
  ): Promise<EmailEvent[]> {
    const rows = await this.db
      .select()
      .from(emailEvents)
      .where(and(eq(emailEvents.userId, userId), eq(emailEvents.draftId, draftId)))
      .orderBy(asc(emailEvents.createdAt));
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      draftId: r.draftId,
      contactId: r.contactId,
      type: r.type as EmailEvent["type"],
      meta: r.meta,
      createdAt: r.createdAt,
    }));
  }

  // ── Keywords ───────────────────────────────────────────
  async listKeywords(userId: string): Promise<Keyword[]> {
    const rows = await this.db
      .select()
      .from(keywords)
      .where(eq(keywords.userId, userId))
      .orderBy(asc(keywords.difficulty));
    return rows.map(rowToKeyword);
  }

  async getKeyword(userId: string, kid: string): Promise<Keyword | null> {
    const rows = await this.db
      .select()
      .from(keywords)
      .where(and(eq(keywords.userId, userId), eq(keywords.id, kid)))
      .limit(1);
    return rows[0] ? rowToKeyword(rows[0]) : null;
  }

  async createKeywords(
    userId: string,
    items: Omit<Keyword, "id" | "userId" | "status" | "createdAt">[],
  ): Promise<Keyword[]> {
    if (items.length === 0) return [];
    const rows = await this.db
      .insert(keywords)
      .values(items.map((i) => ({ ...i, userId })))
      .returning();
    return rows.map(rowToKeyword);
  }

  async updateKeyword(
    userId: string,
    kid: string,
    patch: Partial<Keyword>,
  ): Promise<Keyword | null> {
    const existing = await this.getKeyword(userId, kid);
    if (!existing) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, userId: _u, createdAt: _c, ...rest } = patch;
    await this.db
      .update(keywords)
      .set(rest)
      .where(eq(keywords.id, kid));
    return this.getKeyword(userId, kid);
  }

  // ── Articles ───────────────────────────────────────────
  async listArticles(userId: string): Promise<Article[]> {
    const rows = await this.db
      .select()
      .from(articles)
      .where(eq(articles.userId, userId))
      .orderBy(desc(articles.createdAt));
    return rows.map(rowToArticle);
  }

  async listPublishedArticles(): Promise<
    Pick<
      Article,
      "title" | "slug" | "metaDescription" | "keyword" | "publishedAt" | "updatedAt"
    >[]
  > {
    const rows = await this.db
      .select()
      .from(articles)
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt));
    return rows.map((r) => ({
      title: r.title,
      slug: r.slug,
      metaDescription: r.metaDescription,
      keyword: r.keyword,
      publishedAt: r.publishedAt,
      updatedAt: r.updatedAt,
    }));
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const rows = await this.db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.slug, slug),
          eq(articles.status, "published"),
        ),
      )
      .limit(1);
    return rows[0] ? rowToArticle(rows[0]) : null;
  }

  async getArticle(userId: string, aid: string): Promise<Article | null> {
    const rows = await this.db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.userId, userId),
          eq(articles.id, aid),
        ),
      )
      .limit(1);
    return rows[0] ? rowToArticle(rows[0]) : null;
  }

  async createArticle(data: {
    userId: string;
    keywordId: string | null;
    keyword: string;
    title: string;
    slug: string;
    metaDescription: string;
    markdown: string;
    faqs: { q: string; a: string }[];
    status?: "draft" | "published";
  }): Promise<Article> {
    const rows = await this.db
      .insert(articles)
      .values({
        ...data,
        status: data.status ?? "draft",
        publishedAt: data.status === "published" ? new Date() : null,
      })
      .returning();
    if (data.keywordId) {
      await this.updateKeyword(data.userId, data.keywordId, {
        status: "written",
      });
    }
    return rowToArticle(rows[0]);
  }

  async updateArticle(
    userId: string,
    aid: string,
    patch: Partial<Article>,
  ): Promise<Article | null> {
    const existing = await this.getArticle(userId, aid);
    if (!existing) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, userId: _u, createdAt: _c, ...rest } = patch;
    await this.db
      .update(articles)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(articles.id, aid));
    return this.getArticle(userId, aid);
  }

  async slugExists(slug: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);
    return rows.length > 0;
  }

  // ── Cross-user automation ──────────────────────────────
  async dueFollowUps(
    now: Date,
  ): Promise<{ userId: string; draft: EmailDraft }[]> {
    const out: { userId: string; draft: EmailDraft }[] = [];
    const allUsers = await this.db.select().from(users);
    for (const u of allUsers) {
      const s = await this.getSettings(u.id);
      if (s.followUpAfterDays <= 0) continue;
      const rows = await this.db
        .select()
        .from(emailDrafts)
        .where(
          and(
            eq(emailDrafts.userId, u.id),
            eq(emailDrafts.kind, "initial"),
            eq(emailDrafts.status, "sent"),
            sql`${emailDrafts.followUpDueAt} is not null and ${emailDrafts.followUpDueAt} <= ${now}`,
          ),
        );
      for (const row of rows) {
        const followUps = await this.db
          .select({ id: emailDrafts.id })
          .from(emailDrafts)
          .where(eq(emailDrafts.parentDraftId, row.id))
          .limit(1);
        if (followUps.length > 0) continue;
        const contact = await this.getContact(u.id, row.contactId);
        if (contact && !contact.unsubscribed) {
          out.push({ userId: u.id, draft: rowToDraft(row) });
        }
      }
    }
    return out;
  }

  async autopilotTargets(): Promise<
    { userId: string; keyword: Keyword | null; hasPlan: boolean }[]
  > {
    const out: {
      userId: string;
      keyword: Keyword | null;
      hasPlan: boolean;
    }[] = [];
    const allUsers = await this.db.select().from(users);
    for (const u of allUsers) {
      const s = await this.getSettings(u.id);
      if (!s.autopilot) continue;
      const kw = await this.listKeywords(u.id);
      const writtenIds = new Set(
        (
          await this.db
            .select({ keywordId: articles.keywordId })
            .from(articles)
            .where(
              and(
                eq(articles.userId, u.id),
                sql`${articles.keywordId} is not null`,
              ),
            )
        ).map((r) => r.keywordId),
      );
      const next = kw.find((k) => !writtenIds.has(k.id)) ?? null;
      out.push({ userId: u.id, keyword: next, hasPlan: kw.length > 0 });
    }
    return out;
  }

  async outreachTargets(now: Date): Promise<
    { userId: string; sentToday: number }[]
  > {
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const rows = await this.db
      .select({ userId: settingsTable.userId })
      .from(settingsTable)
      .where(eq(settingsTable.outreachAutopilot, true));
    const out: { userId: string; sentToday: number }[] = [];
    for (const { userId } of rows) {
      const [c] = await this.db
        .select({ n: sql<number>`count(*)::int` })
        .from(emailDrafts)
        .where(
          and(
            eq(emailDrafts.userId, userId),
            eq(emailDrafts.status, "sent"),
            sql`${emailDrafts.sentAt} >= ${startOfDay}`,
          ),
        );
      out.push({ userId, sentToday: c?.n ?? 0 });
    }
    return out;
  }

  // ── Mail connections ───────────────────────────────
  async listMailConnections(userId: string): Promise<MailConnection[]> {
    const rows = await this.db
      .select()
      .from(mailConnections)
      .where(eq(mailConnections.userId, userId))
      .orderBy(asc(mailConnections.createdAt));
    return rows.map(rowToMailConnection);
  }

  async upsertMailConnection(conn: {
    userId: string;
    provider: MailConnection["provider"];
    providerAccountId: string;
    email: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
    scope: string;
  }): Promise<MailConnection> {
    const rows = await this.db
      .insert(mailConnections)
      .values(conn)
      .onConflictDoUpdate({
        target: [
          mailConnections.userId,
          mailConnections.provider,
          mailConnections.providerAccountId,
        ],
        set: {
          email: conn.email,
          accessToken: conn.accessToken,
          refreshToken: conn.refreshToken,
          expiresAt: conn.expiresAt,
          scope: conn.scope,
          updatedAt: new Date(),
        },
      })
      .returning();
    return rowToMailConnection(rows[0]);
  }

  async getMailConnection(
    userId: string,
    id: string,
  ): Promise<MailConnection | null> {
    const rows = await this.db
      .select()
      .from(mailConnections)
      .where(and(eq(mailConnections.userId, userId), eq(mailConnections.id, id)))
      .limit(1);
    return rows[0] ? rowToMailConnection(rows[0]) : null;
  }

  async deleteMailConnection(userId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .delete(mailConnections)
      .where(and(eq(mailConnections.userId, userId), eq(mailConnections.id, id)))
      .returning({ id: mailConnections.id });
    return rows.length > 0;
  }

  // ── Stats ──────────────────────────────────────────────
  async stats(userId: string): Promise<Stats> {
    const [contactCount] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(contacts)
      .where(eq(contacts.userId, userId));
    const [pending] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(emailDrafts)
      .where(
        and(
          eq(emailDrafts.userId, userId),
          sql`${emailDrafts.status} in ('draft','approved')`,
        ),
      );
    const [sent] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(emailDrafts)
      .where(
        and(
          eq(emailDrafts.userId, userId),
          sql`${emailDrafts.status} in ('sent','replied')`,
        ),
      );
    const [replies] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(emailDrafts)
      .where(and(eq(emailDrafts.userId, userId), eq(emailDrafts.status, "replied")));
    const [kwCount] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(keywords)
      .where(eq(keywords.userId, userId));
    const [pub] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(articles)
      .where(
        and(
          eq(articles.userId, userId),
          eq(articles.status, "published"),
        ),
      );
    return {
      contacts: contactCount?.n ?? 0,
      pendingDrafts: pending?.n ?? 0,
      sent: sent?.n ?? 0,
      replies: replies?.n ?? 0,
      keywords: kwCount?.n ?? 0,
      published: pub?.n ?? 0,
    };
  }
}
