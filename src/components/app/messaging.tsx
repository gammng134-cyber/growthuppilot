"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Contact } from "@/lib/storage/types";

interface DmResult {
  contactId: string;
  name: string;
  message: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-300" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function MessagingPage({ isDemo }: { isDemo: boolean }) {
  const { toast } = useToast();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [contactId, setContactId] = React.useState("");
  const [draft, setDraft] = React.useState<DmResult | null>(null);
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

  const active = contacts.filter((c) => !c.unsubscribed);

  async function draftDm() {
    if (!contactId) {
      toast("Pick a contact first", "error");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/messaging/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast(data.error ?? "DM draft failed", "error");
      return;
    }
    setDraft(data);
    toast("DM drafted — copy it and paste it anywhere");
  }

  return (
    <div>
      <PageHeader
        title="Messaging Agent"
        subtitle="Personalized DMs that quote their exact words. Copy, paste, start the conversation."
      />

      {contacts.length === 0 && !loading && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-slate-400">
          No contacts yet — add some in Contacts, then draft DMs here.
        </div>
      )}

      {contacts.length > 0 && (
        <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs text-slate-400">
                Contact — the DM quotes what they said in public
              </label>
              <Select
                value={contactId}
                onChange={(e) => {
                  setContactId(e.target.value);
                  setDraft(null);
                }}
              >
                <option value="">Pick a contact…</option>
                {active.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email}
                    {c.company ? ` · ${c.company}` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={draftDm} disabled={busy || !contactId}>
              <Sparkles className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />
              {busy ? "Drafting…" : "Draft DM"}
            </Button>
          </div>
        </section>
      )}

      {draft && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-500">
            Draft for {draft.name} — ready to copy
          </h2>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="ml-8 rounded-2xl rounded-tl-sm border border-sky-400/20 bg-sky-500/10 px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
              {draft.message}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CopyButton text={draft.message} />
              <span className="text-xs text-slate-500">
                {draft.message.split(/\s+/).length} words · draft-first: nothing
                sends itself
              </span>
            </div>
          </div>
        </section>
      )}

      {isDemo && (
        <p className="mt-4 text-[11px] text-amber-300/70">
          Demo mode: DMs are AI-canned. Connect a real provider for live drafts.
        </p>
      )}
    </div>
  );
}
