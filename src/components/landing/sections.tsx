"use client";

import {
  BarChart3,
  Bot,
  CheckCircle2,
  Database,
  FileText,
  MessageSquare,
  PenTool,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserSearch,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { HoverLift, Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";

const AGENTS = [
  {
    icon: <Send className="h-5 w-5 text-indigo-300" />,
    name: "Email Agent",
    tagline: "Cold email that reads like you wrote it",
    desc: "Imports your contacts, drafts a personalized note for every one from your brief and their own words, tracks opens and clicks, and schedules the follow-up if they go quiet.",
    live: true,
  },
  {
    icon: <PenTool className="h-5 w-5 text-cyan-300" />,
    name: "SEO Agent",
    tagline: "Ranks you on Google while you sleep",
    desc: "Builds a keyword plan, writes the full articles with FAQ schema, publishes to your built-in blog on a cadence, and keeps a sitemap that search engines actually eat.",
    live: true,
  },
  {
    icon: <UserSearch className="h-5 w-5 text-rose-300" />,
    name: "Lead Agent",
    tagline: "Finds your buyers",
    desc: "Scores every conversation for buying intent, ranks your queue, and tells you exactly why each lead is hot — so you talk to the right people first.",
    live: true,
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-sky-300" />,
    name: "Messaging Agent",
    tagline: "Starts the conversations",
    desc: "Drafts personalized DMs that reference each lead's exact words, in your voice — copy it, paste it, start the conversation.",
    live: true,
  },
  {
    icon: <Zap className="h-5 w-5 text-amber-300" />,
    name: "Reply Agent",
    tagline: "Builds your presence",
    desc: "Turns a pasted post or comment into a helpful, on-voice public reply that gets you noticed for the right reasons.",
    live: true,
  },
  {
    icon: <FileText className="h-5 w-5 text-violet-300" />,
    name: "Content Agent",
    tagline: "Publishes everywhere",
    desc: "One topic in, four platform-ready variants out — X thread, LinkedIn post, newsletter section and blog paragraph, each in your voice.",
    live: true,
  },
  {
    icon: <Bot className="h-5 w-5 text-emerald-300" />,
    name: "Chatbot Agent",
    tagline: "Works your front desk",
    desc: "Answers visitor questions from your own product brief and brand voice — grounded in your words, never invented.",
    live: true,
  },
];

export function AgentsSection() {
  return (
    <section id="agents" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Meet your AI marketing team
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Seven agents, one team. Every one of them drafts — you
            decide.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a, i) => (
            <Reveal key={a.name} delay={i * 0.06}>
              <HoverLift className="h-full">
                <div
                  className={`h-full rounded-xl border p-6 transition-colors ${
                    a.live
                      ? "border-indigo-400/20 bg-gradient-to-b from-indigo-500/[0.08] to-transparent hover:border-indigo-400/40"
                      : "border-white/5 bg-white/[0.02] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {a.icon}
                    {a.live ? (
                      <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> LIVE
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">
                        soon
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{a.name}</h3>
                  <p className="mt-0.5 text-sm font-medium text-indigo-300/80">
                    {a.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {a.desc}
                  </p>
                </div>
              </HoverLift>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

interface AgentDetail {
  id: string;
  icon: React.ReactNode;
  accent: string;
  name: string;
  tagline: string;
  desc: string;
  features: string[];
  live: boolean;
  href: string;
  cta: string;
}

const AGENT_DETAILS: AgentDetail[] = [
  {
    id: "email",
    icon: <Send className="h-5 w-5 text-indigo-300" />,
    accent: "text-indigo-300",
    name: "Email Agent",
    tagline: "Cold email that reads like you wrote it",
    desc: "Imports your contacts, drafts a personalized note for every one from your brief and their own words, tracks opens and clicks, and schedules the follow-up if they go quiet.",
    features: [
      "Personalized drafts from your brief and each lead's exact words",
      "Open and click tracking with automatic follow-ups",
      "Nothing sends until you approve it",
      "Send via Resend or your own Gmail / Outlook mailbox",
    ],
    live: true,
    href: "/app/outreach",
    cta: "Open Outreach",
  },
  {
    id: "seo",
    icon: <PenTool className="h-5 w-5 text-cyan-300" />,
    accent: "text-cyan-300",
    name: "SEO Agent",
    tagline: "Ranks you on Google while you sleep",
    desc: "Builds a keyword plan, writes the full articles with FAQ schema, publishes to your built-in blog on a cadence, and keeps a sitemap that search engines actually eat.",
    features: [
      "Keyword plans with intent, volume and difficulty estimates",
      "Full articles: meta, headings, FAQ schema, JSON-LD",
      "Publishes to your built-in blog on autopilot",
      "Sitemap and OG images generated automatically",
    ],
    live: true,
    href: "/app/seo",
    cta: "Open SEO Agent",
  },
  {
    id: "leads",
    icon: <UserSearch className="h-5 w-5 text-rose-300" />,
    accent: "text-rose-300",
    name: "Lead Agent",
    tagline: "Finds your buyers",
    desc: "Scores every conversation for buying intent, ranks your queue, and tells you exactly why each lead is hot — so you talk to the right people first.",
    features: [
      "0–100 buying-intent score for every contact",
      "Hot / warm / cold tiers, sorted for you",
      "Plain-language rationale for every score",
      "Built from what leads actually said in public",
    ],
    live: true,
    href: "/app/leads",
    cta: "Open Lead Agent",
  },
  {
    id: "messaging",
    icon: <MessageSquare className="h-5 w-5 text-sky-300" />,
    accent: "text-sky-300",
    name: "Messaging Agent",
    tagline: "Starts the conversations",
    desc: "Drafts personalized DMs that reference each lead's exact words, in your voice — copy it, paste it, start the conversation.",
    features: [
      "DM drafts that quote their exact words",
      "Your brand voice, not a template",
      "One click to copy and paste anywhere",
      "Draft-first: nothing sends itself",
    ],
    live: true,
    href: "/app/messaging",
    cta: "Open Messaging Agent",
  },
  {
    id: "replies",
    icon: <Zap className="h-5 w-5 text-amber-300" />,
    accent: "text-amber-300",
    name: "Reply Agent",
    tagline: "Builds your presence",
    desc: "Turns a pasted post or comment into a helpful, on-voice public reply that gets you noticed for the right reasons.",
    features: [
      "Helpful public replies in your voice",
      "Paste any post or comment",
      "Review before it goes public",
      "Works across X, LinkedIn and Reddit",
    ],
    live: true,
    href: "/app/replies",
    cta: "Open Reply Agent",
  },
  {
    id: "content",
    icon: <FileText className="h-5 w-5 text-violet-300" />,
    accent: "text-violet-300",
    name: "Content Agent",
    tagline: "Publishes everywhere",
    desc: "One topic in, four platform-ready variants out — X thread, LinkedIn post, newsletter section and blog paragraph, each in your voice.",
    features: [
      "One topic → four platform variants",
      "X, LinkedIn, Newsletter and Blog formats",
      "Consistent voice across every channel",
      "Copy-ready, no formatting fights",
    ],
    live: true,
    href: "/app/content",
    cta: "Open Content Agent",
  },
  {
    id: "chatbot",
    icon: <Bot className="h-5 w-5 text-emerald-300" />,
    accent: "text-emerald-300",
    name: "Chatbot Agent",
    tagline: "Works your front desk",
    desc: "Answers visitor questions from your own product brief and brand voice — grounded in your words, never invented.",
    features: [
      "Answers grounded in your product brief",
      "Speaks in your documented brand voice",
      "No hallucinated features or pricing",
      "Hands hot leads to your inbox",
    ],
    live: true,
    href: "/app/chatbot",
    cta: "Open Chatbot Agent",
  },
];

/** One full-width section per agent, alternating layout. */
export function AgentDetails() {
  return (
    <>
      {AGENT_DETAILS.map((a, i) => (
        <section key={a.id} id={`agent-${a.id}`} className="relative py-20">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <div className="grid items-center gap-10 lg:grid-cols-2">
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                      {a.icon}
                    </span>
                    {a.live ? (
                      <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> LIVE
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">
                        soon
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
                    {a.name}
                  </h3>
                  <p className={`mt-1 text-sm font-medium ${a.accent}`}>
                    {a.tagline}
                  </p>
                  <p className="mt-4 leading-relaxed text-slate-400">
                    {a.desc}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {a.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-sm text-slate-300"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link href={a.href}>
                      <Button size="lg">{a.cta}</Button>
                    </Link>
                  </div>
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                  <AgentPreview id={a.id} />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ))}
    </>
  );
}

/** Representative output mock for each agent's detail section. */
function AgentPreview({ id }: { id: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6">
      <div className="pointer-events-none absolute -top-16 right-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-[80px]" />
      {id === "email" && <EmailMock />}
      {id === "seo" && <SeoMock />}
      {id === "leads" && <LeadsMock />}
      {id === "messaging" && <MessagingMock />}
      {id === "replies" && <RepliesMock />}
      {id === "content" && <ContentMock />}
      {id === "chatbot" && <ChatbotMock />}
    </div>
  );
}

function MockTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 text-[10px] font-medium uppercase tracking-widest text-slate-500">
      {children}
    </div>
  );
}

function EmailMock() {
  return (
    <>
      <MockTag>Draft — awaiting your approval</MockTag>
      <div className="rounded-lg border border-white/10 bg-ink-900/60 p-4">
        <div className="text-xs font-medium text-slate-300">
          Subject: that post about hiring you mentioned
        </div>
        <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-400">
          <p>hey Maya — saw your post about hiring and had to save it.</p>
          <p>
            We ran into the same wall: doing marketing manually eats the
            whole week. So we made agents that do the repetitive parts —
            you keep final say on every send.
          </p>
          <p>Want the 2-min walkthrough? No pressure either way.</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
          opened
        </span>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
          clicked
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">
          follow-up scheduled
        </span>
      </div>
    </>
  );
}

function SeoMock() {
  return (
    <>
      <MockTag>Article — ready to publish</MockTag>
      <div className="rounded-lg border border-white/10 bg-ink-900/60 p-4">
        <div className="text-sm font-medium text-slate-200">
          The founder&apos;s guide to lightweight CRMs
        </div>
        <div className="mt-1 text-xs text-slate-500">
          /blog/lightweight-crm-for-indie-hackers · 4 min read
        </div>
        <div className="mt-3 space-y-1.5">
          {[72, 94, 88, 60, 80].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-white/[0.07]"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">
          FAQ schema
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">
          JSON-LD
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">
          OG image
        </span>
      </div>
    </>
  );
}

function LeadsMock() {
  const rows = [
    { name: "Maya · Finscale", score: 92, tier: "hot", w: "92%" },
    { name: "Jonas · Northbeam", score: 71, tier: "warm", w: "71%" },
    { name: "Priya · Loopwork", score: 44, tier: "cold", w: "44%" },
  ];
  return (
    <>
      <MockTag>Buying-intent queue — sorted</MockTag>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="rounded-lg border border-white/10 bg-ink-900/60 px-4 py-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">{r.name}</span>
              <span
                className={
                  r.tier === "hot"
                    ? "text-rose-300"
                    : r.tier === "warm"
                      ? "text-amber-300"
                      : "text-slate-500"
                }
              >
                {r.score} · {r.tier}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={`h-full rounded-full ${
                  r.tier === "hot"
                    ? "bg-rose-400"
                    : r.tier === "warm"
                      ? "bg-amber-300"
                      : "bg-slate-600"
                }`}
                style={{ width: r.w }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function MessagingMock() {
  return (
    <>
      <MockTag>DM draft — copy &amp; paste</MockTag>
      <div className="ml-8 rounded-2xl rounded-tl-sm border border-white/10 bg-indigo-500/15 px-4 py-3 text-xs leading-relaxed text-slate-200">
        hey Maya — your words on hiring have been stuck in my head since I
        read them. We&apos;re building an agent team for people having exactly
        that conversation. Worth a 5-minute look? If not the right time,
        zero hard feelings.
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">
          62 words
        </span>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
          references their post
        </span>
      </div>
    </>
  );
}

function RepliesMock() {
  return (
    <>
      <MockTag>Public reply — review before posting</MockTag>
      <div className="rounded-lg border border-white/10 bg-ink-900/60 p-4">
        <div className="text-[11px] text-slate-500">
          Replying to: &ldquo;How do you keep outreach personal at
          scale?&rdquo;
        </div>
        <div className="mt-2 text-xs leading-relaxed text-slate-300">
          The honest answer: you don&apos;t scale personalization — you
          automate the boring 90% around it. Drafts, scheduling,
          follow-ups: agents. The judgment call and the voice stay human.
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
          helpful
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">
          on-voice
        </span>
      </div>
    </>
  );
}

function ContentMock() {
  const platforms = [
    { name: "X", w: "100%", tag: "thread opener" },
    { name: "LinkedIn", w: "88%", tag: "post" },
    { name: "Newsletter", w: "94%", tag: "section" },
    { name: "Blog", w: "80%", tag: "paragraph" },
  ];
  return (
    <>
      <MockTag>One topic → four variants</MockTag>
      <div className="grid grid-cols-2 gap-2.5">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="rounded-lg border border-white/10 bg-ink-900/60 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">
                {p.name}
              </span>
              <span className="text-[10px] text-slate-500">{p.tag}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-cyan-300/70"
                style={{ width: p.w }}
              />
            </div>
            <div className="mt-2 space-y-1">
              <div className="h-1 rounded-full bg-white/[0.06]" />
              <div className="h-1 w-4/5 rounded-full bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ChatbotMock() {
  return (
    <>
      <MockTag>Grounded in your brief — no invention</MockTag>
      <div className="space-y-2.5">
        <div className="mr-8 rounded-2xl rounded-tr-sm border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-slate-300">
          How much does it cost?
        </div>
        <div className="ml-8 rounded-2xl rounded-tl-sm border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-xs leading-relaxed text-slate-200">
          The whole stack runs on free tiers — Gemini, Resend, Vercel — so
          you can validate at $0. Beyond that, a human will follow up with
          real numbers.
        </div>
        <div className="mr-8 rounded-2xl rounded-tr-sm border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-slate-300">
          Does it send spam?
        </div>
        <div className="ml-8 rounded-2xl rounded-tl-sm border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-xs leading-relaxed text-slate-200">
          No. Nothing sends without your approval, there&apos;s no blast mode,
          and every email has a one-click unsubscribe.
        </div>
      </div>
    </>
  );
}

const STEPS = [
  {
    icon: <Target className="h-5 w-5 text-indigo-300" />,
    title: "Brief your agents",
    desc: "Tell them who you help, in plain words. Add contacts by hand or CSV. The SEO Agent builds its keyword plan from the same brief.",
  },
  {
    icon: <Sparkles className="h-5 w-5 text-cyan-300" />,
    title: "Agents find & draft",
    desc: "Personalized emails referencing each lead's actual words. Full articles with meta, schema and FAQs — drafted on autopilot, queued for review.",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-300" />,
    title: "You approve. They ship.",
    desc: "One click to send, one click to publish. Opens and clicks tracked, follow-ups scheduled, rankings tracked over time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Three steps. Then it&apos;s compounding.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <div className="absolute -top-3 left-6 rounded-full border border-white/10 bg-ink-900 px-2.5 py-0.5 text-[10px] font-medium tracking-widest text-slate-500">
                  STEP {i + 1}
                </div>
                {s.icon}
                <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Safety() {
  const points = [
    "Nothing sends without your explicit approval — ever",
    "One-click unsubscribe honored instantly on every email",
    "Follow-ups stop the moment a lead replies or opts out",
    "No purchased lists, no scraping, no blast mode — by design",
    "Articles go through the same approval gate before publishing",
  ];
  return (
    <section id="safety" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Approve every send
              </h2>
            </div>
            <p className="mt-5 leading-relaxed text-slate-400">
              Blast tools fire first and apologize later — and your domain, your
              sender reputation and your accounts pay for it. GrowthPilot is
              draft-first: the agents do the tedious 90%, and the judgment call
              stays yours.
            </p>
            <ul className="mt-6 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8">
              <div className="space-y-4">
                <MockRow
                  icon={<Send className="h-4 w-4 text-indigo-300" />}
                  text="Cold outreach tool: 10,000 copies of the same email"
                  verdict="Your domain gets burned"
                  bad
                />
                <MockRow
                  icon={<Database className="h-4 w-4 text-cyan-300" />}
                  text="GrowthPilot: 12 drafts, each referencing their exact words"
                  verdict="You approve, then it sends"
                />
                <MockRow
                  icon={<BarChart3 className="h-4 w-4 text-emerald-300" />}
                  text="Replies come in → follow-ups pause automatically"
                  verdict="Reputation compounds"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function MockRow({
  icon,
  text,
  verdict,
  bad,
}: {
  icon: React.ReactNode;
  text: string;
  verdict: string;
  bad?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        bad
          ? "border-rose-400/20 bg-rose-500/[0.04]"
          : "border-emerald-400/20 bg-emerald-500/[0.04]"
      }`}
    >
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-sm text-slate-300">{text}</div>
        <div
          className={`mt-1 text-xs font-medium ${
            bad ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {verdict}
        </div>
      </div>
    </div>
  );
}

export function FinalCta() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-500/10 to-transparent px-8 py-14">
            <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[100px]" />
            <h2 className="relative text-3xl font-bold tracking-tight text-white md:text-4xl">
              Build the product. We&apos;ll do the marketing.
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-slate-400">
              Free to start, no card required. Your first drafts and articles
              are minutes away.
            </p>
            <div className="relative mt-8 flex justify-center">
              <Link href="/signup">
                <Button size="lg">Start free</Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
