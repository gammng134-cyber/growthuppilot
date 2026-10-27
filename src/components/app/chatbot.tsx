"use client";

import { Send, ShieldCheck } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatbotPage({ isDemo }: { isDemo: boolean }) {
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [question, setQuestion] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function ask() {
    const text = question.trim();
    if (!text || busy) return;
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setBusy(true);
    const res = await fetch("/api/chatbot/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: text,
        history: messages,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast(data.error ?? "Chatbot failed to answer", "error");
      return;
    }
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.answer },
    ]);
  }

  return (
    <div>
      <PageHeader
        title="Chatbot Agent"
        subtitle="Answers from your product brief and brand voice — grounded, never invented."
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-2.5 text-xs text-emerald-300">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Answers come from your Settings → product brief. If the brief
        doesn&apos;t cover it, the bot says so.
      </div>

      <div
        ref={scrollRef}
        className="mb-4 max-h-[32rem] space-y-3 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--card)] p-5"
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            Ask anything a visitor would — pricing, safety, how the agents
            work.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="ml-8 rounded-2xl rounded-tr-sm border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-sm text-slate-200"
            >
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className="mr-8 rounded-2xl rounded-tl-sm border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-2.5 text-sm leading-relaxed text-slate-200"
            >
              {m.content}
            </div>
          ),
        )}
        {busy && (
          <div className="mr-8 rounded-2xl rounded-tl-sm border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-2.5 text-sm text-slate-400">
            <span className="animate-pulse">thinking…</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask();
          }}
          placeholder="How much does it cost?"
        />
        <Button onClick={ask} disabled={busy || !question.trim()}>
          <Send className="h-4 w-4" />
          Ask
        </Button>
      </div>

      {isDemo && (
        <p className="mt-4 text-[11px] text-amber-300/70">
          Demo mode: answers are AI-canned from your brief.
        </p>
      )}
    </div>
  );
}
