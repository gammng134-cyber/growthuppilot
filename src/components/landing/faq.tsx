"use client";

// faq, a band per question (no toggles, answers always visible)
// cta, a sentence with a blank: the blank is the form
// footer, the mark, built large from flat blocks

import Link from "next/link";
import * as React from "react";

const QA = [
 {    q: "Approve every send, or automate?",
 a: "Both, by choice. The Email Agent drafts everything; you approve each send, or flip the cold-email autopilot and it sends on its own within a daily cap you own. Every run stops for unsubscribed contacts.",
 },
 {    q: "How fast is the mailbox connect?",
 a: "Two minutes. You click Connect Gmail, approve Google's consent screen (scope: gmail.send, nothing else) and the agents can write as you. Refresh tokens renew themselves; you can disconnect any time in Settings.",
 },
 {    q: "Cold email from Gmail, restricted?",
 a: "That's exactly what the daily cap is for. A flat 500-sending consumer account stays far inside Google's limits at 15 sends a day, and the run stops the moment a thread is unsubscribed or you close the cap.",
 },
 {
 q: "What happens to someone who unsubscribes?",
 a: "Every email carries List-Unsubscribe headers and a one-click unsubscribe link. Once they're out, the agents skip them permanently, no drafts, no bumps, no errors.",
 },
 {
 q: "What exactly is the morning run?",
 a: "Every weekday at 10:15 UTC the agents do their quiet pass. It scores new contacts, draft or send first-touches within the cap, chase threads that went quiet, publish articles and answer site-chat visitors. You read the log over coffee.",
 },
 {
 q: "What does it cost?",
 a: "Free to start, no card. You're reading the limit in the daily cap, not a paywall, the demo works end to end with simulated sends before you ever connect a mailbox.",
 },
];

export function Faq() {
 return (
 <section id="faq" data-chapter="grey" aria-label="FAQ">
 <div        className="flex min-h-[40svh] items-end px-6 pb-10 lg:px-10"
        style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
 >
 <h2 className="text-[clamp(44px,7vw,110px)] font-extrabold leading-[0.88] tracking-[-0.05em] text-[var(--text)]">
 Straight<br />answers
 </h2>
 </div>
 {QA.map((item, i) => (
 <div
 key={item.q}
 className="grid gap-6 px-6 py-14 lg:grid-cols-12 lg:gap-0 lg:px-10"
 style={{ background: i % 2 ? "var(--bg)" : "var(--surface)" }}
 >          <h3 className="lg:col-span-5 text-[clamp(22px,2.4vw,34px)] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--text)]">
 {item.q}
 </h3>          <p className="lg:col-span-7 lg:pl-10 max-w-[60ch] text-[17px] leading-[1.55] text-[var(--text)]">
 {item.a}
 </p>
 </div>
 ))}
 </section>
 );
}

/* ── cta, a sentence with a blank ─────────────────────────────── */
export function FinalCta() {
  const [email, setEmail] = React.useState("");
  return (
    <section
      data-chapter="ink"
      className="px-6 py-24 lg:px-10 lg:py-32"
      style={{ background: "var(--field-4)", color: "var(--field-4-ink)" }}
    >
      <h2 className="max-w-[24ch] text-[clamp(30px,5.2vw,84px)] font-extrabold leading-[1.02] tracking-[-0.04em] text-white">
        <span className="block">Five agents ran this morning.</span>
        <span className="block">
          Yours can start{" "}
          <input
            data-ui
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourco.com"
            aria-label="Your work email"
            className="gp-blank mx-2 inline-block w-[7.5em] max-w-[52%] align-baseline font-medium"
          />{" "}
          <Link
            href={email ? `/signup?email=${encodeURIComponent(email)}` : "/signup"}
            className="inline-block bg-[var(--accent)] px-5 py-1.5 text-[0.72em] font-semibold text-[var(--accent-ink)] transition-transform duration-150 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            today.
          </Link>
        </span>
      </h2>
      <p className="mt-8 max-w-[52ch] text-[16px] leading-snug text-white/70">
        We prefill your email on the signup screen. No card, no set-up call;
        the demo runs fully simulated until you connect a real mailbox.
      </p>
    </section>
  );
}

/* ── footer, the mark, built large ────────────────────────────── */
const FOOTER_LINKS = [
 { title: "Product", items: [["Agents", "#agents"], ["Live demo", "#showcase"], ["How it works", "#how"], ["Your year", "#year"]] },
 { title: "App", items: [["Overview", "/app"], ["Outreach", "/app/outreach"], ["Settings", "/app/settings"], ["SEO blog", "/blog"]] },
 { title: "Account", items: [["Sign in", "/login"], ["Sign up", "/signup"], ["Unsubscribe", "/unsubscribe"]] },
];

const WORD = "GROWTHPILOT";

export function Footer() {
 const heights = [62, 88, 74, 100, 70, 92, 82, 96, 66, 90, 78];
 return (
 <footer
 data-chapter="mint"
 className="px-6 pb-10 pt-24 lg:px-10"
 style={{ background: "var(--accent)" }}
 >
 <div aria-hidden="true" className="flex h-[34svh] items-end gap-1">
 {WORD.split("").map((ch, i) => (
 <span
 key={i}
 className="grid place-items-end overflow-hidden text-black"
 style={{
 height: `${heights[i % heights.length]}%`,
 minHeight: "0.6em",
 fontSize: "clamp(28px,5vw,84px)",
 fontWeight: 800,
 lineHeight: 1,
 letterSpacing: "-0.04em",
 background: "#000",
 color: "var(--accent)",
 padding: "0.08em 0.1em",
 }}
 >
 {ch}
 </span>
 ))}
 </div>

 <div className="mt-14 grid grid-cols-2 gap-8 text-[15px] text-black lg:grid-cols-4">
 {FOOTER_LINKS.map((col) => (
 <div key={col.title}>
 <p className="font-semibold">{col.title}</p>
 <ul className="mt-2 space-y-1.5">
 {col.items.map(([label, href]) => (
 <li key={label}>
 <a href={href as string} className="underline-offset-4 hover:underline">
 {label}
 </a>
 </li>
 ))}
 </ul>
 </div>
 ))}
 <div className="text-[14px] leading-relaxed">
 <p className="font-semibold">Credits</p>
 <p className="mt-2">
 Mist &amp; gulls photographs from picsum.photos (Taylor Leopold,
 Jill Heyer), Unsplash licence.
 </p>
 </div>
 </div>
 <div className="mt-12 flex flex-wrap items-center justify-between gap-4 text-[13px] text-black">
 <p>© {new Date().getFullYear()} GrowthPilot</p>
 <Link
 href="/signup"
 className="bg-black px-4 py-2 text-[13px] font-semibold text-[var(--accent)] transition-transform duration-150 hover:scale-[1.03]"
 >
 Start free, no card
 </Link>
 </div>
 </footer>
 );
}
