"use client";

import { Download, Trash2, UserPlus } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Contact } from "@/lib/storage/types";

const SAMPLE_CSV = `name,email,company,role,notes,source_context
Dana Reyes,dana@acme.io,Acme,Founder,"asked about founder sales on X","looking for a way to do outreach without burning the domain"
Sam Okafor,sam@brightloop.co,Brightloop,Head of Growth,"met at SaaStr","how do you all handle follow-ups?"`;

export function ContactsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAdd, setShowAdd] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const [csv, setCsv] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    company: "",
    role: "",
    notes: "",
    sourceContext: "",
  });

  const load = React.useCallback(async () => {
    const res = await fetch("/api/contacts");
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast(data.error ?? "Couldn't add contact", "error");
      return;
    }
    toast("Contact added");
    setForm({ name: "", email: "", company: "", role: "", notes: "", sourceContext: "" });
    setShowAdd(false);
    load();
  }

  async function importCsv() {
    setBusy(true);
    const res = await fetch("/api/contacts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast(data.error ?? "Import failed", "error");
      return;
    }
    toast(`Imported ${data.added} contacts (${data.skipped} skipped)`);
    setCsv("");
    setShowImport(false);
    load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast("Contact removed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="People your Email Agent will reach. Bring people you've actually crossed paths with — they reply."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowImport(!showImport)}>
              <Download className="h-4 w-4" /> Import CSV
            </Button>
            <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
              <UserPlus className="h-4 w-4" /> Add contact
            </Button>
          </div>
        }
      />

      {showAdd && (
        <form
          onSubmit={addContact}
          className="mb-6 grid gap-4 rounded-xl border border-[var(--line)] bg-[var(--card)] p-6 sm:grid-cols-2"
        >
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dana Reyes" />
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="dana@acme.io" />
          </div>
          <div>
            <Label>Company</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme" />
          </div>
          <div>
            <Label>Role</Label>
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Founder" />
          </div>
          <div className="sm:col-span-2">
            <Label>What they said in public (powers personalization)</Label>
            <Textarea
              value={form.sourceContext}
              onChange={(e) => setForm({ ...form, sourceContext: e.target.value })}
              placeholder="Their post/comment, e.g. 'cold email isn't working for us anymore…'"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Met at a meetup, runs a 6-person team…" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Adding…" : "Add contact"}
            </Button>
          </div>
        </form>
      )}

      {showImport && (
        <div className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--card)] p-6">
          <div className="mb-2 flex items-center justify-between">
            <Label className="mb-0">Paste CSV (columns: name, email, company, role, notes, source_context)</Label>
            <button
              className="cursor-pointer text-xs text-slate-300 hover:text-slate-400"
              onClick={() => setCsv(SAMPLE_CSV)}
            >
              paste sample
            </button>
          </div>
          <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            className="min-h-40 font-mono text-xs"
            placeholder="name,email,company…"
          />
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={importCsv} disabled={busy || !csv.trim()}>
              {busy ? "Importing…" : "Import"}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--line)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--card)] text-[13px] text-[var(--mut)]">
            <tr>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Company</th>
              <th className="px-5 py-3 font-medium">Context</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Loading…</td></tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-slate-500">
                  No contacts yet. Add one, or import a CSV — then let the Email Agent draft.
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-[var(--card)]">
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-200">{c.name || "—"}</div>
                    <div className="text-xs text-slate-500">{c.email}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {c.company || "—"}
                    {c.role && <div className="text-xs text-slate-600">{c.role}</div>}
                  </td>
                  <td className="max-w-xs px-5 py-4">
                    {c.unsubscribed ? (
                      <Badge className="border-rose-400/30 bg-rose-400/10 text-rose-300">unsubscribed</Badge>
                    ) : c.sourceContext ? (
                      <span className="line-clamp-2 text-xs text-slate-500">&ldquo;{c.sourceContext}&rdquo;</span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => remove(c.id)}
                      className="cursor-pointer rounded-md p-1.5 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label="Delete contact"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
