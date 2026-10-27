"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Stats } from "@/lib/storage/types";
import { EmailDraft } from "@/lib/storage/types";
import { Contact } from "@/lib/storage/types";
import { Article } from "@/lib/storage/types";

// The overview is the morning run: the greeting names the workspace and
// today's one fact, set from the data, and the run log is the biggest block
// on the screen (the product's signature element). Figures below are a
// divided strip, no icons, no sparklines, tabular.

export function Overview() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [drafts, setDrafts] = React.useState<EmailDraft[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [briefMissing, setBriefMissing] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/stats").then((r) => (r.ok ? r.json() : null)).then(setStats).catch(() => {});
    fetch("/api/drafts").then((r) => (r.ok ? r.json() : [])).then(setDrafts).catch(() => {});
    fetch("/api/contacts").then((r) => (r.ok ? r.json() : [])).then(setContacts).catch(() => {});
    fetch("/api/seo/articles").then((r) => (r.ok ? r.json() : [])).then(setArticles).catch(() => {});
    fetch("/api/settings").then((r) => (r.ok ? r.json() : null)).then((s) => setBriefMissing(!!s && !s.productBrief)).catch(() => {});
  }, []);

  const now = new Date();
  const today = now.toDateString();
  const sentToday = drafts.filter((d) => d.status === "sent" && d.sentAt && new Date(d.sentAt).toDateString() === today);
  const followUpsToday = sentToday.filter((d) => d.kind === "followup").length;
  const firstTouchesToday = sentToday.filter((d) => d.kind === "initial").length;
  const publishedToday = articles.filter((a) => a.publishedAt && new Date(a.publishedAt).toDateString() === today).length;
  const newContactsToday = contacts.filter((c) => new Date(c.createdAt).toDateString() === today).length;
  const pending = drafts.filter((d) => d.status === "draft" || d.status === "approved").length;
  const replies = drafts.filter((d) => d.status === "replied").length;

  const runLines: { label: string; value: string; empty?: boolean }[] = [];
  if (firstTouchesToday > 0) runLines.push({ label: "First-touches sent", value: `${firstTouchesToday}` });
  if (followUpsToday > 0) runLines.push({ label: "Follow-ups sent", value: `${followUpsToday}` });
  if (newContactsToday > 0) runLines.push({ label: "Contacts scored", value: `${newContactsToday}` });
  if (publishedToday > 0) runLines.push({ label: "Articles published", value: `${publishedToday}` });
  const ranSomething = runLines.length > 0;

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-[clamp(24px,3vw,34px)] font-bold leading-tight tracking-tight text-[var(--text)]">
          {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}, the run{" "}
          {ranSomething ? "sent" : "hasn't run yet"}
        </h1>
        <p className="mt-1 max-w-[70ch] text-[15px] text-[var(--mut)]">
          {ranSomething
            ? `${firstTouchesToday + followUpsToday} emails went out, ${newContactsToday} contacts scored, ${publishedToday} articles published.`
            : "Nothing has been sent today yet. Check your brief and contacts, then run the pilot."}
        </p>
      </div>

      {briefMissing && (
        <Link
          href="/app/settings"
          className="mb-6 block rounded-lg bg-[var(--pill-warning-bg)] px-4 py-3 text-[14px] text-[var(--pill-warning-ink)]"
        >
          Brief your agents first, it powers every draft, then run the pilot. Settings →
        </Link>
      )}

      {/* the run log, the screen's one question answered by the biggest block */}
      <section className="mb-10 rounded-lg bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-[var(--text)]">Today&apos;s morning run</h2>
          {pending > 0 && (
            <Link href="/app/outreach">
              <Button size="sm">Review {pending} pending</Button>
            </Link>
          )}
        </div>
        {ranSomething ? (
          <dl className="mt-4">
            {runLines.map((l) => (
              <div key={l.label} className="flex items-baseline justify-between border-t border-[var(--rule)] py-2.5 first:border-t-0">
                <dt className="text-[14px] text-[var(--mut)]">{l.label}</dt>
                <dd className="text-[15px] font-medium tabular-nums text-[var(--text)]">{l.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 rounded-md border border-dashed border-[var(--control)] px-4 py-3 text-[14px] text-[var(--faint)]">
            No runs recorded today. When the autopilot is on it fires every weekday at 10:15 UTC.
          </p>
        )}
      </section>

      {/* the divided stat strip, figures at their real size */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-[var(--rule)] sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Contacts", value: stats?.contacts ?? 0, href: "/app/contacts" },
          { label: "Drafts pending", value: stats?.pendingDrafts ?? 0, href: "/app/outreach" },
          { label: "Emails sent", value: stats?.sent ?? 0, href: "/app/outreach" },
          { label: "Replies", value: stats?.replies ?? 0, href: "/app/outreach" },
          { label: "Keywords", value: stats?.keywords ?? 0, href: "/app/seo" },
          { label: "Articles live", value: stats?.published ?? 0, href: "/blog" },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group block bg-[var(--card)] px-4 py-4 transition-colors hover:bg-[var(--raised)]"
          >
            <p className="text-[13px] text-[var(--mut)]">{s.label}</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums leading-none text-[var(--text)]">
              {s.value}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
