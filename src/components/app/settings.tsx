"use client";

import * as React from "react";

import { PageHeader } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Settings = {
  productBrief?: string;
  brandVoice?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  followUpAfterDays?: number;
  autopilot?: boolean;
  autoPublish?: boolean;
  sendVia?: "resend" | "mailbox";
};

type MailConnection = {
  id: string;
  provider: "gmail" | "outlook";
  email: string;
  tokenExpired: boolean;
  createdAt: string;
  updatedAt: string;
};

const PROVIDER_LABEL: Record<MailConnection["provider"], string> = {
  gmail: "Gmail",
  outlook: "Outlook",
};

const PROVIDER_ENV_HINT: Record<MailConnection["provider"], string> = {
  gmail: "Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local (or Vercel env vars), then restart.",
  outlook: "Set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET in .env.local (or Vercel env vars), then restart.",
};

export function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [s, setS] = React.useState<Settings>({});
  const [conns, setConns] = React.useState<MailConnection[]>([]);
  const [configured, setConfigured] = React.useState<{
    gmail: boolean;
    outlook: boolean;
  } | null>(null);

  const loadConnections = React.useCallback(async () => {
    try {
      const res = await fetch("/api/mail-connections");
      if (res.ok) {
        const data = await res.json();
        setConns(data.connections ?? []);
        if (data.configured) setConfigured(data.configured);
      }
    } catch {
      // Non-fatal: mailbox list stays empty on network errors.
    }
  }, []);

  // Stable identity: without useCallback this fn is recreated every render and
  // the effect below refetches settings in an infinite loop (button flickers).
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) setS(await res.json());
      else toast("Couldn't load settings", "error");
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
    loadConnections();
  }, [load, loadConnections]);

  // Surface OAuth round-trip results (success banner or error toast from ?mail_connected / ?mail_error).
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("mail_connected");
    const error = params.get("mail_error");
    if (connected) {
      toast(
        `${PROVIDER_LABEL[connected as MailConnection["provider"]] ?? connected} connected — drafts can now send from your mailbox.`,
        "success",
      );
      window.history.replaceState(null, "", "/app/settings");
      loadConnections();
    } else if (error) {
      toast(`Mailbox connection failed: ${error}`, "error");
      window.history.replaceState(null, "", "/app/settings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function disconnect(id: string) {
    try {
      const res = await fetch(`/api/mail-connections?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "Couldn't disconnect", "error");
        return;
      }
      setConns((cs) => cs.filter((c) => c.id !== id));
      toast("Mailbox disconnected");
    } catch {
      toast("Network error", "error");
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Save failed", "error");
        return;
      }
      toast("Settings saved");
      load();
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  }

  const bind = (
    key: keyof Settings,
    target: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setS((x) => ({ ...x, [key]: target.target.value }));
  };
  const bindChecked = (
    key: "autopilot" | "autoPublish",
    target: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setS((x) => ({ ...x, [key]: target.target.checked }));
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Tell the agents who you help and how you sound. Short, specific briefs beat long documents every time."
      />

      <div className="space-y-8">
        <Section title="Your product">
          <p className="mb-4 text-sm text-slate-400">
            One tight paragraph is enough. The SEO Agent uses it to plan keywords;
            the Email Agent uses it to ground every draft so it doesn&rsquo;t invent facts
            about your product.
          </p>
          <Textarea
            value={s.productBrief ?? ""}
            onChange={(e) => bind("productBrief", e)}
            placeholder="Something like: 'I built a lightweight CRM for small SaaS teams with 2-10 people. We replace spreadsheets with one shared inbox of deals, built-in sequences, and a 30-second onboarding.'"
            className="min-h-36"
          />
        </Section>

        <Section title="Your voice">
          <p className="mb-4 text-sm text-slate-400">
            A few notes the agents will follow — tone, pet phrases, what to avoid.
          </p>
          <Textarea
            value={s.brandVoice ?? ""}
            onChange={(e) => bind("brandVoice", e)}
            placeholder="e.g. Friendly, direct, founder-to-founder. Lowercase-first is fine. No buzzwords, no 'hope this finds you well', no follow-up guilt. Mention what they actually said."
            className="min-h-28"
          />
        </Section>

        <Section title="How emails arrive">
          <p className="mb-4 text-sm text-slate-400">
            The sender identity shown on every one-to-one outreach. In production
            you&rsquo;d connect a real custom domain while it&rsquo;s unverified, everything
            sends from the Resend sandbox address.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>From name</Label>
              <Input
                value={s.fromName ?? ""}
                onChange={(e) => bind("fromName", e)}
                placeholder="You or your company"
              />
            </div>
            <div>
              <Label>From email</Label>
              <Input
                type="email"
                value={s.fromEmail ?? ""}
                onChange={(e) => bind("fromEmail", e)}
                placeholder="you@yourdomain.com"
              />
            </div>
            <div>
              <Label>Reply-to email (optional)</Label>
              <Input
                type="email"
                value={s.replyTo ?? ""}
                onChange={(e) => bind("replyTo", e)}
                placeholder="you@yourdomain.com"
              />
            </div>
          </div>
        </Section>

        <Section title="Connected mailboxes">
          <p className="mb-4 text-sm text-slate-400">
            Connect your own Gmail or Outlook account and outreach sends from it —
            one-to-one email from a real person, not a bulk platform. Nothing sends
            until you approve a draft; the mailbox only does the delivering.
          </p>

          {conns.length > 0 && (
            <ul className="mb-4 space-y-2">
              {conns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white"
                    >
                      {c.provider === "gmail" ? "G" : "O"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{c.email}</p>
                      <p className="text-xs text-slate-400">
                        {PROVIDER_LABEL[c.provider]}
                        {c.tokenExpired ? " · token expired — will refresh on next send" : " · connected"}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => disconnect(c.id)}>
                    Disconnect
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-3">
            <a
              href="/api/mail/authorize?provider=gmail"
              aria-disabled={configured?.gmail === false}
              className={configured?.gmail === false ? "pointer-events-none opacity-50" : undefined}
            >
              <Button variant="secondary" disabled={configured?.gmail === false}>
                Connect Gmail
              </Button>
            </a>
            <a
              href="/api/mail/authorize?provider=outlook"
              aria-disabled={configured?.outlook === false}
              className={configured?.outlook === false ? "pointer-events-none opacity-50" : undefined}
            >
              <Button variant="secondary" disabled={configured?.outlook === false}>
                Connect Outlook
              </Button>
            </a>
          </div>
          {configured && (!configured.gmail || !configured.outlook) && (
            <p className="mt-3 max-w-xl text-xs text-slate-500">
              {!configured.gmail && PROVIDER_ENV_HINT.gmail}
              {!configured.gmail && !configured.outlook && " "}
              {!configured.outlook && PROVIDER_ENV_HINT.outlook}
            </p>
          )}

          <div className="mt-5 max-w-sm">
            <Label>Send outreach via</Label>
            <Select
              value={s.sendVia ?? "resend"}
              onChange={(e) =>
                setS((x) => ({ ...x, sendVia: e.target.value as Settings["sendVia"] }))
              }
            >
              <option value="resend">Resend (default)</option>
              <option value="mailbox" disabled={conns.length === 0}>
                Connected mailbox{conns.length === 0 ? " — connect one above" : ""}
              </option>
            </Select>
            {s.sendVia === "mailbox" && (
              <p className="mt-2 text-xs text-slate-500">
                Sends as {conns[0]?.email ?? "your mailbox"}. In Gmail, sending limits
                apply (about 500/day for consumer accounts).
              </p>
            )}
          </div>
        </Section>

        <Section title="Follow-ups">
          <p className="mb-4 text-sm text-slate-400">
            After a successful send, wait this many days, then automatically draft a
            short follow-up for your approval. Set to 0 to turn follow-ups off.
          </p>
          <div className="flex items-center gap-6">
            <div className="max-w-xs">
              <Label>Days before a follow-up is drafted</Label>
              <Select
                value={String(s.followUpAfterDays ?? 3)}
                onChange={(e) => {
                  setS((x) => ({ ...x, followUpAfterDays: Number((e.target as HTMLSelectElement).value) }));
                }}
              >
                <option value="0">Disabled</option>
                <option value="1">1 day</option>
                <option value="2">2 days</option>
                <option value="3">3 days</option>
                <option value="5">5 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
              </Select>
            </div>
          </div>
        </Section>

        <Section title="Autopilot">
          <p className="mb-4 text-sm text-slate-400">
            Let the SEO Agent run on its own. When on, every morning it ensures a
            keyword plan exists and drafts the next article — you still approve every
            publish, unless you toggle auto-publish below.
          </p>
          <div className="flex flex-wrap items-center gap-8">
            <Checkbox
              label="Auto-generate keyword plans & drafts"
              checked={s.autopilot !== false}
              onChange={(e) => setS((x) => ({ ...x, autopilot: e.target.checked }))}
            />
            <Checkbox
              label="Auto-publish approved articles to /blog"
              checked={s.autoPublish === true}
              onChange={(e) => setS((x) => ({ ...x, autoPublish: e.target.checked }))}
            />
          </div>
        </Section>

        <div
          className={`rounded-xl border px-5 py-4 transition-colors ${
            (s.productBrief ?? "").trim()
              ? "border-emerald-400/20 bg-emerald-400/5"
              : "border-amber-400/20 bg-amber-400/5"
          }`}
        >
          {s.productBrief?.trim() ? (
            <p className="text-sm text-emerald-200">
              <strong className="font-medium">Brief is set.</strong> The agents are
              ready to draft. Set
              <code className="ml-1 rounded bg-amber-400/15 px-1 py-0.5 text-[11px]">autopilot</code>
              {" "}
              to run it daily.
            </p>
          ) : (
            <p className="text-sm text-amber-200">
              <strong className="font-medium">Brief is empty.</strong> Agents can&rsquo;t
              draft meaningful outreach or SEO copy until you add one. Add it above —
              it&rsquo;s the first thing they need.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || loading}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-white/10 bg-white/5 text-indigo-500 accent-indigo-500 focus:ring-indigo-400/40"
      />
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}
