"use client";

import { motion } from "framer-motion";
import { Bot, CheckCircle2, FileText, Mail, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-24">
      {/* aurora */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 24, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-indigo-600/25 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -36, 0], y: [0, 30, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 right-1/4 h-80 w-80 rounded-full bg-cyan-500/15 blur-[110px]"
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Your AI marketing team · 2 agents live, 5 on the roadmap
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-white md:text-6xl"
        >
          The marketing team that <span className="text-gradient">works while you build</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400"
        >
          GrowthPilot&apos;s agents write the outreach, chase the follow-ups and
          publish the SEO articles that bring buyers to you. Everything is
          drafted in your voice — and nothing sends until you approve it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <Link href="/signup">
            <Button size="lg">Start free — no card</Button>
          </Link>
          <a href="#agents">
            <Button size="lg" variant="secondary">
              Meet the agents
            </Button>
          </a>
        </motion.div>

        {/* agent mock cards */}
        <div className="relative mx-auto mt-16 grid max-w-3xl gap-4 md:grid-cols-2">
          <AgentMock
            delay={0.35}
            icon={<Search className="h-4 w-4 text-cyan-300" />}
            title="SEO Agent"
            line={`Published: "The founder's guide to lightweight CRMs"`}
            meta="indexed on Google · JSON-LD · sitemap"
          />
          <AgentMock
            delay={0.45}
            icon={<Mail className="h-4 w-4 text-indigo-300" />}
            title="Email Agent"
            line="Draft ready for review · 34 words, zero buzzwords"
            meta="waiting for your approval"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="pointer-events-none absolute -bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-950/60 px-3 py-1 text-xs text-emerald-300 backdrop-blur md:flex"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            you approve every send
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AgentMock({
  icon,
  title,
  line,
  meta,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  line: string;
  meta: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4 }}
      className="rounded-xl border border-white/10 bg-ink-900/70 p-5 text-left shadow-2xl shadow-indigo-950/40 backdrop-blur"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        {icon}
        {title}
        <span className="ml-auto flex items-center gap-1 text-[10px] font-normal text-slate-500">
          <Bot className="h-3 w-3" /> working
        </span>
      </div>
      <div className="mt-3 flex items-start gap-2 text-sm text-slate-300">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
        {line}
      </div>
      <div className="mt-2 text-xs text-slate-500">{meta}</div>
    </motion.div>
  );
}
