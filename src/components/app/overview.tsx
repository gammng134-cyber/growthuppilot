"use client";

import { FileText, Mail, PenTool, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { PageHeader } from "@/components/app/shell";
import { Stats } from "@/lib/storage/types";

const CARDS = [
  { key: "contacts", label: "Contacts", icon: Users, href: "/app/contacts" },
  { key: "pendingDrafts", label: "Drafts waiting", icon: Mail, href: "/app/outreach" },
  { key: "sent", label: "Emails sent", icon: Sparkles, href: "/app/outreach" },
  { key: "replies", label: "Replies", icon: Mail, href: "/app/outreach" },
  { key: "keywords", label: "Keywords", icon: PenTool, href: "/app/seo" },
  { key: "published", label: "Articles live", icon: FileText, href: "/blog" },
] as const;

export function Overview() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [briefMissing, setBriefMissing] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {});
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setBriefMissing(!!s && !s.productBrief))
      .catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Your agents&rsquo; work at a glance."
      />
      {briefMissing && (
        <Link
          href="/app/settings"
          className="mb-6 block rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-5 py-4 text-sm text-indigo-200 transition-colors hover:bg-indigo-500/15"
        >
          <strong className="font-medium">First things first:</strong> brief
          your agents — tell them what you sell and who it&rsquo;s for. It powers
          every draft. &rarr; Settings
        </Link>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => {
          const Icon = c.icon;
          const value = stats ? stats[c.key] : "…";
          return (
            <Link
              key={c.key}
              href={c.href}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-sm">{c.label}</span>
                <Icon className="h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
