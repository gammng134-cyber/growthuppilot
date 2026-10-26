"use client";

import { Check, Copy, Zap } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

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

export function RepliesPage({ isDemo }: { isDemo: boolean }) {
  const { toast } = useToast();
  const [post, setPost] = React.useState("");
  const [reply, setReply] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function draftReply() {
    const text = post.trim();
    if (!text) {
      toast("Paste a post or comment first", "error");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/replies/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post: text }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast(data.error ?? "Reply draft failed", "error");
      return;
    }
    setReply(data.reply);
    toast("Reply drafted — review before posting");
  }

  return (
    <div>
      <PageHeader
        title="Reply Agent"
        subtitle="Turn any post or comment into a helpful, on-voice public reply."
      />

      <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <label className="mb-1.5 block text-xs text-slate-400">
          Paste the post or comment you&apos;re replying to
        </label>
        <Textarea
          value={post}
          onChange={(e) => {
            setPost(e.target.value);
            setReply(null);
          }}
          placeholder="How do you keep outreach personal at scale?"
          className="min-h-28"
        />
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={draftReply} disabled={busy || !post.trim()}>
            <Zap className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />
            {busy ? "Drafting…" : "Draft reply"}
          </Button>
          <span className="text-xs text-slate-500">
            Works across X, LinkedIn and Reddit
          </span>
        </div>
      </section>

      {reply && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-500">
            Suggested reply — review before it goes public
          </h2>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
              {reply}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CopyButton text={reply} />
              <span className="text-xs text-slate-500">
                {reply.split(/\s+/).length} words
              </span>
            </div>
          </div>
        </section>
      )}

      {isDemo && (
        <p className="mt-4 text-[11px] text-amber-300/70">
          Demo mode: replies are AI-canned.
        </p>
      )}
    </div>
  );
}
