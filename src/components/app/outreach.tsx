"use client";

import {
  CheckCheck,
  ChevronDown,
  Clock,
  MailPlus,
  Pencil,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/app/shell";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Contact, EmailDraft, EmailEvent } from "@/lib/storage/types";

export function OutreachPage({ isDemo }: { isDemo: boolean }) {
  const { toast } = useToast();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [drafts, setDrafts] = React.useState<EmailDraft[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const [c, d] = await Promise.all([
      fetch("/api/contacts").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/drafts").then((r) => (r.ok ? r.json() : [])),
    ]);
    setContacts(c);
    setDrafts(d);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const contactById = React.useMemo(
    () => new Map(contacts.map((c) => [c.id, c])),
    [contacts],
  );

  const draftedContactIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const d of drafts) {
      if (d.kind === "initial" && d.status !== "rejected") ids.add(d.contactId);
    }
    return ids;
  }, [drafts]);

  const pending = drafts.filter(
    (d) => d.status === "draft" || d.status === "approved",
  );
  const history = drafts.filter((d) => !pending.includes(d));

  async function generate(contactId: string) {
    setGenerating(contactId);
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactIds: [contactId] }),
    });
    setGenerating(null);
    const data = await res.json();
    if (!res.ok || data.created.length === 0) {
      toast("Draft generation failed — check Settings → brief", "error");
      return;
    }
    toast("Draft ready for your review");
    setExpanded(data.created[0]);
    load();
  }

  async function patchDraft(id: string, patch: object, msg: string) {
    const res = await fetch(`/api/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast("Update failed", "error");
      return;
    }
    if (msg) toast(msg);
    load();
  }

  async function send(id: string) {
    const res = await fetch(`/api/drafts/${id}/send`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "Send failed", "error");
      return;
    }
    const viaLabel =
      data.transport === "gmail" || data.transport === "outlook"
        ? `Sent via ${data.transport === "gmail" ? "Gmail" : "Outlook"}`
        : data.transport === "resend"
          ? "Sent via Resend"
          : "Sent (simulated — demo mode)";
    toast(viaLabel);
    setExpanded(id);
    load();
  }

  async function makeFollowUp(id: string) {
    const res = await fetch(`/api/drafts/${id}/followup`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "Couldn't draft follow-up", "error");
      return;
    }
    toast("Follow-up draft ready");
    setExpanded(data.id);
    load();
  }

  async function simulate(id: string, type: string) {
    const res = await fetch(`/api/drafts/${id}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      toast(`Simulated: ${type}`);
      load();
    }
  }

  return (
    <div>
      <PageHeader
        title="Outreach"
        subtitle="The Email Agent drafts, you approve. Nothing sends itself."
      />

      {contacts.length === 0 && !loading && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-slate-400">
          Add contacts first — the Email Agent drafts one personalized email per
          contact.
        </div>
      )}

      {contacts.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-500">
            Ready to draft ({contacts.filter((c) => !draftedContactIds.has(c.id) && !c.unsubscribed).length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {contacts
              .filter((c) => !draftedContactIds.has(c.id) && !c.unsubscribed)
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-200">
                      {c.name || c.email}
                    </div>
                    {c.sourceContext && (
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        &ldquo;{c.sourceContext}&rdquo;
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => generate(c.id)}
                    disabled={generating === c.id}
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${generating === c.id ? "animate-pulse" : ""}`} />
                    {generating === c.id ? "Drafting…" : "Draft with AI"}
                  </Button>
                </div>
              ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-500">
            Awaiting your approval ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((d) => (
              <DraftCard
                key={d.id}
                draft={d}
                contact={contactById.get(d.contactId)}
                expanded={expanded === d.id}
                onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
                onEdit={(subject, body) => patchDraft(d.id, { subject, body }, "Draft updated")}
                onApprove={() => patchDraft(d.id, { status: "approved" }, "Approved — ready to send")}
                onReject={() => patchDraft(d.id, { status: "rejected" }, "Draft rejected")}
                onSend={() => send(d.id)}
              />
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-500">
            Sent & history ({history.length})
          </h2>
          <div className="space-y-3">
            {history.map((d) => (
              <DraftCard
                key={d.id}
                draft={d}
                contact={contactById.get(d.contactId)}
                expanded={expanded === d.id}
                isDemo={isDemo}
                onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
                onFollowUp={() => makeFollowUp(d.id)}
                onSimulate={(t) => simulate(d.id, t)}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && drafts.length === 0 && contacts.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-slate-400">
          No drafts yet — hit <MailPlus className="inline h-3.5 w-3.5" /> &ldquo;Draft
          with AI&rdquo; above.
        </div>
      )}
    </div>
  );
}

function DraftCard({
  draft,
  contact,
  expanded,
  onToggle,
  onEdit,
  onApprove,
  onReject,
  onSend,
  onFollowUp,
  onSimulate,
  isDemo,
}: {
  draft: EmailDraft;
  contact?: Contact;
  expanded: boolean;
  onToggle: () => void;
  onEdit?: (subject: string, body: string) => void;
  onApprove?: () => void;
  onReject?: () => void;
  onSend?: () => void;
  onFollowUp?: () => void;
  onSimulate?: (type: string) => void;
  isDemo?: boolean;
}) {
  const { toast } = useToast();
  const [events, setEvents] = React.useState<EmailEvent[] | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [subject, setSubject] = React.useState(draft.subject);
  const [body, setBody] = React.useState(draft.body);
  const [sending, setSending] = React.useState(false);

  const isEditable = draft.status === "draft" && onEdit;
  const canSend = draft.status === "approved" && onSend;

  React.useEffect(() => {
    if (expanded && draft.status !== "draft" && draft.status !== "approved") {
      fetch(`/api/drafts/${draft.id}/events`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setEvents)
        .catch(() => setEvents([]));
    }
  }, [expanded, draft.id, draft.status]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-600 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={draft.status} />
            {draft.kind === "followup" && <Badge>follow-up</Badge>}
            <span className="text-sm text-slate-300">{draft.subject}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            to {contact?.name || contact?.email || "unknown"}
            {draft.sentAt && ` · sent ${new Date(draft.sentAt).toLocaleDateString()}`}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-4">
          {editing ? (
            <div className="space-y-3">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-40" />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!subject.trim() || !body.trim()) {
                      toast("Subject and body can't be empty", "error");
                      return;
                    }
                    onEdit?.(subject, body);
                    setEditing(false);
                  }}
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-sm leading-relaxed text-slate-300">
                {draft.body.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {isEditable && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    {onApprove && (
                      <Button size="sm" onClick={onApprove}>
                        <CheckCheck className="h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    {onReject && (
                      <Button size="sm" variant="danger" onClick={onReject}>
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    )}
                  </>
                )}
                {canSend && (
                  <Button
                    size="sm"
                    disabled={sending}
                    onClick={async () => {
                      setSending(true);
                      await onSend?.();
                      setSending(false);
                    }}
                  >
                    <Send className="h-3.5 w-3.5" /> {sending ? "Sending…" : "Send now"}
                  </Button>
                )}
                {draft.status === "sent" && onFollowUp && (
                  <Button size="sm" variant="secondary" onClick={onFollowUp}>
                    <Clock className="h-3.5 w-3.5" /> Draft follow-up
                  </Button>
                )}
                {isDemo && draft.status === "sent" && onSimulate && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => onSimulate("opened")}>
                      sim: opened
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onSimulate("replied")}>
                      sim: replied
                    </Button>
                  </>
                )}
              </div>

              {events && events.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                  {events.map((e) => (
                    <Badge key={e.id}>
                      {e.type} · {new Date(e.createdAt).toLocaleTimeString()}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
