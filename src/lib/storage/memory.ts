// In-memory storage — used in demo mode (DEMO_MODE=1 or no DATABASE_URL).
// Data lives for the lifetime of the server process only. Good enough to
// explore the whole product with zero infrastructure.

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

function id(): string {
  return crypto.randomUUID();
}

export class MemoryStore implements Storage {
  private users = new Map<string, User>();
  private settingsMap = new Map<string, Settings>();
  private contactsMap = new Map<string, Contact>();
  private draftsMap = new Map<string, EmailDraft>();
  private eventsMap = new Map<string, EmailEvent>();
  private keywordsMap = new Map<string, Keyword>();
  private articlesMap = new Map<string, Article>();
  private mailConnsMap = new Map<string, MailConnection>();

  // ── Users ──────────────────────────────────────────────
  async getUserByEmail(email: string): Promise<User | null> {
    const e = email.trim().toLowerCase();
    return [...this.users.values()].find((u) => u.email === e) ?? null;
  }
  async getUserById(uid: string): Promise<User | null> {
    return this.users.get(uid) ?? null;
  }
  async createUser(
    email: string,
    passwordHash: string,
    googleAccountId?: string | null,
  ): Promise<User> {
    if (await this.getUserByEmail(email)) throw new Error("email_taken");
    const u: User = {
      id: id(),
      email: email.trim().toLowerCase(),
      passwordHash,
      googleAccountId: googleAccountId ?? null,
      createdAt: new Date(),
    };
    this.users.set(u.id, u);
    return u;
  }
  async getUserByGoogleId(googleAccountId: string): Promise<User | null> {
    return (
      [...this.users.values()].find(
        (u) => u.googleAccountId === googleAccountId,
      ) ?? null
    );
  }
  async linkGoogleAccount(
    userId: string,
    googleAccountId: string,
  ): Promise<User | null> {
    const u = this.users.get(userId);
    if (!u) return null;
    const next = { ...u, googleAccountId };
    this.users.set(userId, next);
    return next;
  }

  // ── Settings ───────────────────────────────────────────
  async getSettings(userId: string): Promise<Settings> {
    let s = this.settingsMap.get(userId);
    if (!s) {
      s = defaultSettings(userId);
      this.settingsMap.set(userId, s);
    }
    return { ...s };
  }
  async updateSettings(
    userId: string,
    patch: Partial<Settings>,
  ): Promise<Settings> {
    const s = await this.getSettings(userId);
    const next = { ...s, ...patch, userId };
    this.settingsMap.set(userId, next);
    return { ...next };
  }

  // ── Contacts ───────────────────────────────────────────
  async listContacts(userId: string): Promise<Contact[]> {
    return [...this.contactsMap.values()]
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getContact(userId: string, cid: string): Promise<Contact | null> {
    const c = this.contactsMap.get(cid);
    return c && c.userId === userId ? c : null;
  }
  async createContact(
    data: Omit<Contact, "id" | "createdAt" | "unsubscribed"> & {
      unsubscribed?: boolean;
    },
  ): Promise<Contact> {
    const c: Contact = {
      ...data,
      id: id(),
      unsubscribed: data.unsubscribed ?? false,
      createdAt: new Date(),
    };
    this.contactsMap.set(c.id, c);
    return c;
  }
  async updateContact(
    userId: string,
    cid: string,
    patch: Partial<Contact>,
  ): Promise<Contact | null> {
    const c = await this.getContact(userId, cid);
    if (!c) return null;
    const next = { ...c, ...patch, id: cid, userId };
    this.contactsMap.set(cid, next);
    return next;
  }
  async deleteContact(userId: string, cid: string): Promise<boolean> {
    const c = await this.getContact(userId, cid);
    if (!c) return false;
    this.contactsMap.delete(cid);
    return true;
  }

  // ── Drafts ─────────────────────────────────────────────
  async findDraftByMessageId(messageId: string): Promise<EmailDraft | null> {
    return (
      [...this.draftsMap.values()].find((d) => d.messageId === messageId) ??
      null
    );
  }
  async listDrafts(userId: string): Promise<EmailDraft[]> {
    return [...this.draftsMap.values()]
      .filter((d) => d.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getDraft(userId: string, did: string): Promise<EmailDraft | null> {
    const d = this.draftsMap.get(did);
    return d && d.userId === userId ? d : null;
  }
  async createDraft(data: NewDraft): Promise<EmailDraft> {
    const now = new Date();
    const d: EmailDraft = {
      id: id(),
      userId: data.userId,
      contactId: data.contactId,
      kind: data.kind,
      parentDraftId: data.parentDraftId ?? null,
      subject: data.subject,
      body: data.body,
      status: data.status ?? "draft",
      sentAt: null,
      messageId: null,
      followUpDueAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.draftsMap.set(d.id, d);
    return d;
  }
  async updateDraft(
    userId: string,
    did: string,
    patch: Partial<EmailDraft>,
  ): Promise<EmailDraft | null> {
    const d = await this.getDraft(userId, did);
    if (!d) return null;
    const next = { ...d, ...patch, id: did, userId, updatedAt: new Date() };
    this.draftsMap.set(did, next);
    return next;
  }

  // ── Events ─────────────────────────────────────────────
  async addEvent(ev: {
    userId: string;
    draftId: string;
    contactId: string;
    type: EmailEvent["type"];
    meta?: string;
  }): Promise<EmailEvent> {
    const e: EmailEvent = {
      id: id(),
      userId: ev.userId,
      draftId: ev.draftId,
      contactId: ev.contactId,
      type: ev.type,
      meta: ev.meta ?? null,
      createdAt: new Date(),
    };
    this.eventsMap.set(e.id, e);
    return e;
  }
  async listDraftEvents(
    userId: string,
    draftId: string,
  ): Promise<EmailEvent[]> {
    return [...this.eventsMap.values()]
      .filter((e) => e.userId === userId && e.draftId === draftId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // ── Keywords ───────────────────────────────────────────
  async listKeywords(userId: string): Promise<Keyword[]> {
    return [...this.keywordsMap.values()]
      .filter((k) => k.userId === userId)
      .sort((a, b) => a.difficulty - b.difficulty);
  }
  async getKeyword(userId: string, kid: string): Promise<Keyword | null> {
    const k = this.keywordsMap.get(kid);
    return k && k.userId === userId ? k : null;
  }
  async createKeywords(
    userId: string,
    items: Omit<Keyword, "id" | "userId" | "status" | "createdAt">[],
  ): Promise<Keyword[]> {
    return items.map((item) => {
      const k: Keyword = {
        ...item,
        id: id(),
        userId,
        status: "planned",
        createdAt: new Date(),
      };
      this.keywordsMap.set(k.id, k);
      return k;
    });
  }
  async updateKeyword(
    userId: string,
    kid: string,
    patch: Partial<Keyword>,
  ): Promise<Keyword | null> {
    const k = await this.getKeyword(userId, kid);
    if (!k) return null;
    const next = { ...k, ...patch, id: kid, userId };
    this.keywordsMap.set(kid, next);
    return next;
  }

  // ── Articles ───────────────────────────────────────────
  async listArticles(userId: string): Promise<Article[]> {
    return [...this.articlesMap.values()]
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async listPublishedArticles(): Promise<
    Pick<
      Article,
      "title" | "slug" | "metaDescription" | "keyword" | "publishedAt" | "updatedAt"
    >[]
  > {
    return [...this.articlesMap.values()]
      .filter((a) => a.status === "published")
      .sort(
        (a, b) =>
          (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
      );
  }
  async getArticleBySlug(slug: string): Promise<Article | null> {
    return (
      [...this.articlesMap.values()].find(
        (a) => a.slug === slug && a.status === "published",
      ) ?? null
    );
  }
  async getArticle(userId: string, aid: string): Promise<Article | null> {
    const a = this.articlesMap.get(aid);
    return a && a.userId === userId ? a : null;
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
    const now = new Date();
    const a: Article = {
      ...data,
      status: data.status ?? "draft",
      publishedAt: data.status === "published" ? now : null,
      id: id(),
      createdAt: now,
      updatedAt: now,
    };
    this.articlesMap.set(a.id, a);
    if (a.keywordId) {
      await this.updateKeyword(a.userId, a.keywordId, { status: "written" });
    }
    return a;
  }
  async updateArticle(
    userId: string,
    aid: string,
    patch: Partial<Article>,
  ): Promise<Article | null> {
    const a = await this.getArticle(userId, aid);
    if (!a) return null;
    const next = { ...a, ...patch, id: aid, userId, updatedAt: new Date() };
    this.articlesMap.set(aid, next);
    return next;
  }
  async slugExists(slug: string): Promise<boolean> {
    return [...this.articlesMap.values()].some((a) => a.slug === slug);
  }

  // ── Cross-user automation ──────────────────────────────
  async dueFollowUps(now: Date): Promise<{ userId: string; draft: EmailDraft }[]> {
    const out: { userId: string; draft: EmailDraft }[] = [];
    for (const user of this.users.values()) {
      const settings = await this.getSettings(user.id);
      if (settings.followUpAfterDays <= 0) continue;
      for (const d of this.draftsMap.values()) {
        if (
          d.userId === user.id &&
          d.kind === "initial" &&
          d.status === "sent" &&
          d.followUpDueAt !== null &&
          d.followUpDueAt <= now
        ) {
          const hasFollowUp = [...this.draftsMap.values()].some(
            (f) => f.parentDraftId === d.id,
          );
          const contact = this.contactsMap.get(d.contactId);
          if (!hasFollowUp && contact && !contact.unsubscribed) {
            out.push({ userId: user.id, draft: d });
          }
        }
      }
    }
    return out;
  }
  async autopilotTargets(): Promise<
    { userId: string; keyword: Keyword | null; hasPlan: boolean }[]
  > {
    const out: { userId: string; keyword: Keyword | null; hasPlan: boolean }[] = [];
    for (const user of this.users.values()) {
      const settings = await this.getSettings(user.id);
      if (!settings.autopilot) continue;
      const keywords = await this.listKeywords(user.id);
      const written = new Set(
        [...this.articlesMap.values()]
          .filter((a) => a.userId === user.id && a.keywordId)
          .map((a) => a.keywordId),
      );
      const next = keywords.find((k) => !written.has(k.id)) ?? null;
      out.push({ userId: user.id, keyword: next, hasPlan: keywords.length > 0 });
    }
    return out;
  }

  // ── Mail connections ───────────────────────────────
  async listMailConnections(userId: string): Promise<MailConnection[]> {
    return [...this.mailConnsMap.values()]
      .filter((c) => c.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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
    const existing = [...this.mailConnsMap.values()].find(
      (c) =>
        c.userId === conn.userId &&
        c.provider === conn.provider &&
        c.providerAccountId === conn.providerAccountId,
    );
    if (existing) {
      const next: MailConnection = {
        ...existing,
        email: conn.email,
        accessToken: conn.accessToken,
        refreshToken: conn.refreshToken,
        expiresAt: conn.expiresAt,
        scope: conn.scope,
        updatedAt: new Date(),
      };
      this.mailConnsMap.set(existing.id, next);
      return next;
    }
    const created: MailConnection = { ...conn, id: id(), createdAt: new Date(), updatedAt: new Date() };
    this.mailConnsMap.set(created.id, created);
    return created;
  }
  async getMailConnection(
    userId: string,
    id: string,
  ): Promise<MailConnection | null> {
    const c = this.mailConnsMap.get(id);
    return c && c.userId === userId ? c : null;
  }
  async deleteMailConnection(userId: string, id: string): Promise<boolean> {
    const c = await this.getMailConnection(userId, id);
    if (!c) return false;
    this.mailConnsMap.delete(id);
    return true;
  }

  // ── Stats ──────────────────────────────────────────────
  async stats(userId: string): Promise<Stats> {
    const drafts = [...this.draftsMap.values()].filter(
      (d) => d.userId === userId,
    );
    return {
      contacts: [...this.contactsMap.values()].filter(
        (c) => c.userId === userId,
      ).length,
      pendingDrafts: drafts.filter(
        (d) => d.status === "draft" || d.status === "approved",
      ).length,
      sent: drafts.filter((d) => d.status === "sent" || d.status === "replied")
        .length,
      replies: drafts.filter((d) => d.status === "replied").length,
      keywords: [...this.keywordsMap.values()].filter(
        (k) => k.userId === userId,
      ).length,
      published: [...this.articlesMap.values()].filter(
        (a) => a.userId === userId && a.status === "published",
      ).length,
    };
  }
}

export function newId(): string {
  return id();
}
