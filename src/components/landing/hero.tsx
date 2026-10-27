"use client";

// Hero, dealt blueprint "Swatch column beside the view", with the dealt
// imagery rule applied: this subject is software, so the photograph panel
// is a real fragment of the product (the Morning run screen) at true size.
// A 10px paper frame surrounds the screen; columns 11–12 are the navigation
// as a preview: five flat chips, one per agent chapter.

import * as React from "react";

import { useReveals } from "@/components/landing/nav";

const CHAPTERS = [
 { label: "Email agent", href: "#agents", bg: "var(--field-2)" },
 { label: "Follow-ups", href: "#agents-2", bg: "var(--field-3)" },
 { label: "Live demo", href: "#showcase", bg: "var(--field-1)" },
 { label: "Your year", href: "#year", bg: "var(--surface)" },
 { label: "FAQ", href: "#faq", bg: "var(--field-4)", ink: "#ffffff" },
] as const;export function Hero() {
  useReveals();
  return (
    <section aria-label="GrowthPilot" className="p-2.5 pt-14">
      <div className="grid gap-2.5 lg:grid-cols-12">
        {/* the view: the product's morning-run screen */}
        <div className="relative lg:col-span-10">
          <div className="relative overflow-hidden rounded-xl bg-ground">
            <h1
              className="gp-reveal px-6 pb-5 pt-8 text-[clamp(34px,12vw,124px)] font-extrabold leading-[0.88] tracking-[-0.05em] text-[var(--text)] lg:px-14 lg:pt-12"
              style={{ "--d": "0ms" } as React.CSSProperties}
            >
              Five agents,
              <br />
              one morning run
            </h1>
            <MorningRunCard />
            <div className="gp-reveal pointer-events-none absolute inset-x-0 bottom-0 hidden justify-end p-9 lg:flex" style={{ "--d": "160ms" } as React.CSSProperties}>
              <p className="pointer-events-auto max-w-[38ch] text-[17px] font-medium leading-snug text-[var(--text)]">
                While you build, the agents draft and send cold email from your Gmail, chase every quiet thread and publish the articles that rank.
              </p>
            </div>
          </div>
        </div>

 {/* the swatch column doubles as navigation */}
 <nav
 aria-label="Page chapters"
 className="flex gap-2.5 overflow-hidden lg:grid lg:h-[calc(100%-0px)] lg:grid-rows-5 lg:gap-0"
 >
 {CHAPTERS.map((c) => (
 <a
 key={c.href}
 href={c.href}
 className="flex min-h-13 items-start bg-left p-5 pt-4 text-[16px] font-medium transition-transform duration-150 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black"
 style={{ background: c.bg, color: ("ink" in c ? c.ink : "#000"), flex: "1 0 auto" }}
 >
 {c.label}
 </a>
 ))}
 </nav>
 </div>
 {/* phone supporting sentence (deal: moves into the first row) */}
 <p className="mt-6 px-6 text-[17px] leading-snug text-[var(--mut)] lg:hidden">
 While you build, the agents draft and send cold email from your Gmail,
 chase every quiet thread and publish the articles that rank.
 </p>
 </section>
 );
}

/* The Morning run fragment, the app's overview if five agents had a quiet
 Monday. Built by app-screen rules: data that adds up, no ornament. */
function MorningRunCard() {
 const rows = [
 { agent: "Email", did: "12 first-touches sent", meta: "gmail · days cap 15" },
 { agent: "Follow-ups", did: "3 bumps sent", meta: "quiet 3+ days" },
 { agent: "Leads", did: "6 new contacts scored", meta: "2 hot, 3 warm, 1 chill" },
 { agent: "Content", did: "1 article published", meta: "“lightweight crm”" },
 { agent: "Chatbot", did: "5 visitor questions answered", meta: "3 became drafts" },
 ];  return (
    <div
      data-ui
      className="gp-reveal mx-3 mb-3 rounded-lg bg-[#181716] p-5 lg:mx-14 lg:mb-6 lg:mr-24 lg:max-w-3xl"
      style={{ "--d": "80ms" } as React.CSSProperties}
    >
 <div className="flex items-baseline justify-between gap-4">
 <p className="text-[15px] font-semibold text-[var(--text)]">
 Morning run, Monday 26 Oct
 </p>        <p className="text-[13px] text-[var(--mut)]">10:15 UTC, out of your hands since the brief</p>
 </div>
 <ul className="mt-3">
 {rows.map((r) => (
 <li
 key={r.agent}            // taste-skill-ignore: rule-separated rows inside a data-ui fragment
            className="grid grid-cols-[80px_1fr] items-baseline border-t border-white/10 py-2 first:border-t-0" data-inspect="taste-skill-ignore: rows inside a data-ui fragment"
 >
 <span className="justify-self-start rounded-full bg-[var(--pill-neutral-bg)] px-2 py-0.5 text-[11px] text-[var(--pill-neutral-ink)]">
 {r.agent}
 </span>            <span className="text-[13px] text-[var(--text)]">
              {r.did} <span className="text-[var(--mut)]">« {r.meta}</span>
            </span>
 </li>
 ))}
 </ul>
 </div>
 );
}
