"use client";

import { Sparkles, UserSearch } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Contact } from "@/lib/storage/types";

interface ScoredContact {
  contactId: string;
  name: string;
  score: number;
  tier: "hot" | "warm" | "cold";
  rationale: string;
}

const TIER_STYLE: Record<
  ScoredContact["tier"],
  { bar: string; text: string; badge: string }
> = {
  hot: {
    bar: "bg-rose-400",
    text: "text-rose-300",
    badge: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  },
  warm: {
    bar: "bg-amber-300",
    text: "text-amber-300",
    badge: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  cold: {
    bar: "bg-slate-600",
    text: "text-slate-500",
    badge: "border-[var(--line)] bg-white/5 text-slate-400",
  },
};

export function LeadsPage({ isDemo }: { isDemo: boolean }) {
  const { toast } = useToast();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [scored, setScored] = React.useState<ScoredContact[] | null>(null);
  const [missing, setMissing] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const c = await fetch("/api/contacts").then((r) => (r.ok ? r.json() : []));
    setContacts(c);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allActive = contacts.filter((c) => !c.unsubscribed);
  const allSelected = allActive.length > 0 && allActive.every((c) => selected.has(c.id));

  async function score() {
    const ids = contacts
      .filter((c) => selected.has(c.id))
      .map((c) => c.id);
    if (ids.length === 0) {
      toast("Select at least one contact", "error");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/leads/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactIds: ids }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast(data.error ?? "Scoring failed", "error");
      return;
    }
    setScored(data.contacts ?? []);
    setMissing(data.missing ?? []);
    toast(`Scored ${data.contacts?.length ?? 0} contacts`);
  }

  const byId = React.useMemo(
    () => new Map(contacts.map((c) => [c.id, c])),
    [contacts],
  );

  return (
    <div>
      <PageHeader
        title="Lead Agent"
        subtitle="Scores every contact for buying intent — talk to the right people first."
      />

      {contacts.length === 0 && !loading && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-6 py-10 text-center text-sm text-slate-400">
          No contacts yet — add some in Contacts, then score them here.
        </div>
      )}

      {contacts.length > 0 && (
        <section className="mb-10 rounded-xl border border-[var(--line)] bg-[var(--card)] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[13px] font-medium text-[var(--mut)]">
              Pick who to score ({selected.size} selected)
            </h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setSelected(
                    allSelected ? new Set() : new Set(allActive.map((c) => c.id)),
                  )
                }
              >
                {allSelected ? "Clear" : "Select all"}
              </Button>
              <Button onClick={score} disabled={busy || selected.size === 0}>
                <Sparkles className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />
                {busy ? "Scoring…" : "Score leads"}
              </Button>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                disabled={c.unsubscribed}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  selected.has(c.id)
                    ? "border-rose-400/40 bg-rose-500/[0.06]"
                    : "border-[var(--line)] bg-white/[0.01] hover:border-white/20"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    selected.has(c.id)
                      ? "border-rose-400 bg-rose-400 text-ink-900"
                      : "border-white/20"
                  }`}
                >
                  {selected.has(c.id) && (
                    <UserSearch className="h-3 w-3" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-200">
                    {c.name || c.email}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {c.company ? `${c.company}${c.role ? ` · ${c.role}` : ""}` : c.email}
                  </span>
                </span>
                {c.unsubscribed && <Badge>unsubscribed</Badge>}
              </button>
            ))}
          </div>
        </section>
      )}

      {missing.length > 0 && (
        <p className="mb-4 text-xs text-amber-300/80">
          {missing.length} contact(s) vanished before scoring — re-sync and try again.
        </p>
      )}

      {scored && (
        <section>
          <h2 className="mb-3 text-[13px] font-medium text-[var(--mut)]">
            Buying-intent queue — sorted
          </h2>
          {scored.length === 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-6 py-10 text-center text-sm text-slate-400">
              Nothing scored. Select contacts and run the agent.
            </div>
          ) : (
            <div className="space-y-3">
              {scored.map((s) => {
                const style = TIER_STYLE[s.tier];
                const contact = byId.get(s.contactId);
                return (
                  <div
                    key={s.contactId}
                    className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-5 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-lg font-bold ${
                          s.tier === "hot"
                            ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
                            : s.tier === "warm"
                              ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                              : "border-[var(--line)] bg-white/5 text-slate-400"
                        }`}
                      >
                        {s.score}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            {s.name}
                          </span>
                          {contact?.company && (
                            <span className="text-xs text-slate-500">
                              {contact.company}
                              {contact.role ? ` · ${contact.role}` : ""}
                            </span>
                          )}
                          <Badge className={style.badge}>{s.tier}</Badge>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--raised)]">
                          <div
                            className={`h-full rounded-full ${style.bar}`}
                            style={{ width: `${s.score}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                          {s.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {isDemo && (
            <p className="mt-4 text-[11px] text-amber-300/70">
              Demo mode: scores are AI-canned, not live community data.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
