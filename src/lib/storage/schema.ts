import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** Google account id ("sub") when signed up via "Continue with Google". */
  googleAccountId: text("google_account_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const settings = pgTable("settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  productBrief: text("product_brief").notNull().default(""),
  brandVoice: text("brand_voice").notNull().default(""),
  fromName: text("from_name").notNull().default(""),
  fromEmail: text("from_email").notNull().default("onboarding@resend.dev"),
  replyTo: text("reply_to").notNull().default(""),
  followUpAfterDays: integer("follow_up_after_days").notNull().default(3),
  autopilot: boolean("autopilot").notNull().default(false),
  autoPublish: boolean("auto_publish").notNull().default(false),
  // "resend" (default) or "mailbox" — where the Email Agent hands off sends.
  sendVia: text("send_via").notNull().default("resend"),
});

/** OAuth-connected personal mailboxes (Gmail / Outlook) used as send transport. */
export const mailConnections = pgTable("mail_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // "gmail" | "outlook"
  /** Provider account id — unique per user+provider so reconnects upsert. */
  providerAccountId: text("provider_account_id").notNull(),
  email: text("email").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  scope: text("scope").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  email: text("email").notNull(),
  company: text("company").notNull().default(""),
  role: text("role").notNull().default(""),
  notes: text("notes").notNull().default(""),
  sourceContext: text("source_context").notNull().default(""),
  unsubscribed: boolean("unsubscribed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailDrafts = pgTable("email_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("initial"),
  parentDraftId: uuid("parent_draft_id"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  messageId: text("message_id"),
  followUpDueAt: timestamp("follow_up_due_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailEvents = pgTable("email_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  draftId: uuid("draft_id")
    .notNull()
    .references(() => emailDrafts.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  meta: text("meta"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const keywords = pgTable("keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  intent: text("intent").notNull().default("informational"),
  cluster: text("cluster").notNull().default(""),
  estVolume: integer("est_volume").notNull().default(0),
  difficulty: integer("difficulty").notNull().default(5),
  angle: text("angle").notNull().default(""),
  status: text("status").notNull().default("planned"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  keywordId: uuid("keyword_id"),
  keyword: text("keyword").notNull().default(""),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  metaDescription: text("meta_description").notNull().default(""),
  markdown: text("markdown").notNull(),
  faqs: jsonb("faqs").notNull().default([]),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
