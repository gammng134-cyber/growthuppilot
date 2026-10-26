"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Reveal } from "@/components/motion";

const FAQS = [
  {
    q: "Is this a spam cannon?",
    a: "The opposite. GrowthPilot drafts everything and sends nothing until you approve it. There is no bulk-blast mode, no purchased lists, and every email carries a one-click unsubscribe that's honored instantly. It's built to protect your sender reputation, not gamble it.",
  },
  {
    q: "How personalized are the emails, really?",
    a: "Each draft is written from your product brief, your voice notes, and what the lead actually said in public — their post, their comment, their words. The agent is instructed to reference those specifics, so every note reads like you spent five minutes on it. Because you (well, your agent) did.",
  },
  {
    q: "What does the SEO Agent actually publish?",
    a: "Full articles to a built-in blog at your own domain: keyword-researched topics, a proper heading structure, meta description, FAQ schema, JSON-LD, an OG image per post, and a sitemap that updates automatically. You review every article before it goes live — or flip on autopilot and let it publish on a cadence.",
  },
  {
    q: "What do I need to hook up?",
    a: "An AI key (Google Gemini has a free tier) and a Resend account for email sending (also free to start — 100 emails/day). Everything runs on Vercel's free tier. The whole stack can cost $0 while you validate.",
  },
  {
    q: "Where do contacts come from?",
    a: "You bring them: type them in or import a CSV. GrowthPilot doesn't scrape anyone. People you've actually crossed paths with are the ones who reply anyway.",
  },
  {
    q: "What's on the roadmap?",
    a: "Live SERP data and rank tracking for the SEO Agent, more send transports, and deeper analytics across every agent. The seven-agent team itself is complete — Email, SEO, Lead, Messaging, Reply, Content and Chatbot all ship today, each draft-first: they do the repetitive 90%, you approve every send and publish.",
  },
];

export function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Questions, answered straight
          </h2>
        </Reveal>
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-[15px] font-medium text-white transition-colors hover:bg-white/[0.02]"
                >
                  {f.q}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-300 ${
                      open === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-slate-400">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 text-[10px] font-bold text-white">
            G
          </span>
          <span className="text-slate-400">GrowthPilot</span>
        </div>
        <p>
          Draft-first outreach & SEO, on autopilot. Built for founders who want
          customers, not spammers.
        </p>
        <div className="flex items-center gap-5">
          <Link href="/blog" className="transition-colors hover:text-slate-300">
            Blog
          </Link>
          <Link href="/login" className="transition-colors hover:text-slate-300">
            Sign in
          </Link>
          <Link href="/signup" className="transition-colors hover:text-slate-300">
            Start free
          </Link>
        </div>
      </div>
    </footer>
  );
}
