"use client";

import { Check, Copy, FileText } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface Variants {
  x: string;
  linkedin: string;
  newsletter: string;
  blog: string;
}

const PLATFORMS: { key: keyof Variants; name: string; kind: string }[] = [
  { key: "x", name: "X", kind: "thread opener" },
  { key: "linkedin", name: "LinkedIn", kind: "post" },
  { key: "newsletter", name: "Newsletter", kind: "section" },
  { key: "blog", name: "Blog", kind: "paragraph" },
];

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

export function ContentPage({ isDemo }: { isDemo: boolean }) {
  const { toast } = useToast();
  const [topic, setTopic] = React.useState("");
  const [variants, setVariants] = React.useState<Variants | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function generate() {
    const text = topic.trim();
    if (!text) {
      toast("Give it a topic first", "error");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/content/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: text }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast(data.error ?? "Variant generation failed", "error");
      return;
    }
    setVariants(data.variants);
    toast(`Four variants ready for "${data.topic}"`);
  }

  return (
    <div>
      <PageHeader
        title="Content Agent"
        subtitle="One topic in, four platform-ready variants out."
      />

      <section className="mb-8 rounded-xl border border-[var(--line)] bg-[var(--card)] p-6">
        <label className="mb-1.5 block text-xs text-slate-400">
          Topic — one sentence works best
        </label>
        <Input
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setVariants(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") generate();
          }}
          placeholder="why lightweight CRMs beat spreadsheets"
        />
        <div className="mt-3">
          <Button onClick={generate} disabled={busy || !topic.trim()}>
            <FileText className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />
            {busy ? "Writing…" : "Generate variants"}
          </Button>
        </div>
      </section>

      {variants && (
        <section>
          <h2 className="mb-3 text-[13px] font-medium text-[var(--mut)]">
            Variants — same idea, four platforms
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {PLATFORMS.map((p) => (
              <div
                key={p.key}
                className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">
                      {p.name}
                    </span>
                    <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] text-slate-500">
                      {p.kind}
                    </span>
                  </div>
                  <CopyButton text={variants[p.key]} />
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
                  {variants[p.key]}
                </p>
                <div className="mt-2 text-[11px] text-slate-600">
                  {variants[p.key].split(/\s+/).length} words
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isDemo && (
        <p className="mt-4 text-[11px] text-amber-300/70">
          Demo mode: variants are AI-canned.
        </p>
      )}
    </div>
  );
}
