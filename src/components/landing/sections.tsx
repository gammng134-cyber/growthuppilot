"use client";

// The dealt chapters, rebuilt around GrowthPilot's real content:
// features (Sentences with switches) · showcase (Headline you can type —
// the live thing) · how-it-works (Stages as one bar) · stats (Figure set
// by a slider) · one atmosphere rest.

import * as React from "react";

/* ── features, Sentences with switches ─────────────────────────
 Five agent capabilities, each a five-to-eight-word sentence ending in
 the product's real toggle. On, the band floods its chapter colour and
 a consequence line in figures appears beneath. Two on at load. */
const SWITCHES = [
 {
 id: "email",
 sentence: "Your cold email sends through your own Gmail",
 on: true,
 bg: "var(--field-2)",
 consequence: "Last month on this plan: 214 first-touches, 38 replies. Your cap decides the pace, 15 a day here.",
 },
 {
 id: "followups",
 sentence: "Follow-ups chase every thread that goes quiet",
 on: true,
 bg: "var(--field-3)",
 consequence: "Three days of silence, one polite bump, then a stop. 41 bumps last month, 11 conversations kept alive.",
 },
 {
 id: "leads",
 sentence: "Every contact gets scored before you lift a finger",
 on: false,
 bg: "var(--field-1)",
 consequence: "Cold, warm, hot: 61 contacts scored last run. The hot list is in your inbox before 10:20.",
 },
 {
 id: "content",
 sentence: "SEO articles publish and rank while you build",
 on: false,
 bg: "var(--surface)",
 consequence: "52 weeks of drafts from one keyword plan. 9 published articles, 1,240 searches touched so far.",
 },
 {
 id: "chat",
 sentence: "Your site chatbot turns visitors into drafts",
 on: false,
 bg: "var(--field-4)",
 ink: "var(--field-4-ink)",
 invert: true,
 onBg: "var(--field-4)",
 consequence: "5 questions answered today. 3 visitors with real buying intent queued in your outreach.",
 },
];

export function AgentSwitches() {
 return (
 <section aria-label="What the agents do" className="mt-2.5">
 {SWITCHES.map((s, i) => (
 <SwitchBand key={s.id} s={s} i={i} />
 ))}
 </section>
 );
}

function SwitchBand({ s, i }: { s: (typeof SWITCHES)[number]; i: number }) {
 const [on, setOn] = React.useState(s.on);
 const bandOn = on && s.bg !== "off";
 const ref = React.useRef<HTMLDivElement>(null);

 React.useEffect(() => {
 const el = ref.current;
 if (!el) return;
 const obs = new IntersectionObserver(
 (entries) => {
 for (const e of entries) {
 if (e.isIntersecting) {
 e.target.classList.add("is-in");
 obs.unobserve(e.target);
 }
 }
 },
 { threshold: 0.25 },
 );
 obs.observe(el);
 return () => obs.disconnect();
 }, []);

 const bg = bandOn ? (s.onBg ?? s.bg) : "var(--bg)";
 const ink = bandOn ? (s.invert ? s.ink : "#000") : "var(--text)";

 return (
 <div
 data-chapter={i === 0 ? "mint" : undefined}
 ref={ref}
 className="gp-rise grid min-h-[132px] grid-cols-1 items-center gap-3 px-6 py-8 lg:min-h-[20vh] lg:grid-cols-12 lg:px-10 lg:py-6"
 style={{ background: bg, color: ink, transition: "background 0.35s ease" }}
 >      <p className="gp-reveal lg:col-span-9 text-[6.4vw] font-semibold leading-[1.02] tracking-[-0.02em] lg:text-[clamp(30px,3.4vw,56px)]">
        {s.sentence}
      </p>
 <div className="lg:col-span-3 lg:justify-self-end">
 <Switch
 label={s.sentence}
 checked={on}
 onChange={() => setOn((v) => !v)}
 />
 </div>      {on && (
        <p className="text-[15px] leading-snug lg:col-span-12 lg:text-[15px]">
          {s.consequence}
        </p>
      )}
    </div>
  );
}

/* The product's real toggle, in em so it tracks the sentence. */
function Switch({
 label,
 checked,
 onChange,
 scale = 1,
}: {
 label: string;
 checked: boolean;
 onChange: () => void;
 scale?: number;
}) {
 return (
 <button
 data-ui
 type="button"
 role="switch"
 aria-checked={checked}
 aria-label={label}
 onClick={onChange}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 onChange();
 }
 }}
 className="block cursor-pointer rounded-full text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
 style={{
 width: `calc(3.4em * ${scale})`,
 height: `calc(1.1em * ${scale})`,        background: "color-mix(in srgb, currentColor 22%, transparent)",
        border: "1px solid color-mix(in srgb, currentColor 45%, transparent)",
 padding: "0 0.4em",
 }}
 >
 <span
 className="block rounded-full"
 style={{
 width: `calc(1em * ${scale})`,
 height: `calc(1em * ${scale})`,
 marginLeft: checked ? "auto" : 0,          background: "currentColor",
          transition: "margin 0.2s ease",
 }}
 />
 </button>
 );
}

/* ── showcase, Headline you can type (the live thing) ─────────── */
const EXAMPLES = [
 "a crm for solo contractors",
 "cold brew subscriptions",
 "faith-based e-learning",
];

export function Showcase() {
 const [value, setValue] = React.useState("lightweight crm for agencies");
 const inputRef = React.useRef<HTMLInputElement>(null);
 return (    <section
      id="showcase"
      data-chapter="grey"
      className="flex min-h-[88svh] flex-col justify-center px-6 lg:px-10"
      style={{ background: "var(--field-1)", color: "var(--field-1-ink)" }}
    >
      <h2 className="text-[24px] font-semibold tracking-[-0.02em]">
        What are you selling? The agents read it as you type.
      </h2>
      <TypeLine value={value} onChange={setValue} />
      <Answer value={value} />
      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[17px]">
 <span className="font-medium">or try:</span>
 {EXAMPLES.map((ex) => (
 <button
 key={ex}
 type="button"
 onClick={() => {
 setValue(ex);
 inputRef.current?.focus();
 }}
 className="cursor-pointer underline decoration-2 underline-offset-4 hover:decoration-black"
 >
 {ex}
 </button>
 ))}
 </div>
 </section>
 );
}

function TypeLine({
 value,
 onChange,
}: {
 value: string;
 onChange: (v: string) => void;
}) {
 return (
 <div className="mt-4 flex max-w-full items-baseline">
 <input
 id="your-thing"
 data-ui
 value={value}
 onChange={(e) => onChange(e.target.value)}        className="w-full bg-transparent text-[clamp(40px,7vw,110px)] font-extrabold leading-[0.9] tracking-[-0.04em] outline-none selection:bg-black/10 focus:outline-none"
        style={{ caretColor: "currentColor" }}
 maxLength={64}
 />
 <Caret pulse />
 </div>
 );
}

function Caret({ pulse = false }: { pulse?: boolean }) {
 return (
 <span
 aria-hidden="true"
 className={pulse ? "gp-caret" : ""}
 style={{
 display: "inline-block",        width: "0.08em",
        height: "0.8em",
        background: "currentColor",
 minWidth: 3,
 }}
 />
 );
}

/* The product's answer at true interface size, rows a founder would get. */
function Answer({ value }: { value: string }) {
 const thing = clean(value);
 if (!thing) {
 return (
 <div className="mt-12 max-w-[560px]">        <p className="text-[15px] text-black/70">The agents are waiting, type what you sell.</p>
 </div>
 );
 }
 return (
 <div className="mt-12 max-w-[560px] rounded-lg bg-[#181716]" data-ui>
 <Row
 label="Email draft"
 main={`${subjectFor(thing)}`}
 sub="first-touch · 84 words · your brief is the fact-check"
 />
 <Row
 label="Lead score"
 main={`${56 + (hash(thing) % 39)} / 100, warm`}
 sub={`because you sell to people who need ${short(thing)}`}
 />
 <Row
 label="Keyword plan"
 main={`“${short(thing)} alternatives”, written weekly`}
 sub="lowest-difficulty first · 12 planned"
 />
 </div>
 );
}

function Row({ label, main, sub }: { label: string; main: string; sub: string }) {
 return (        // taste-skill-ignore: rule-separated rows inside a data-ui fragment
        <div className="border-t border-white/10 px-5 py-4 first:border-t-0" data-inspect="taste-skill-ignore: rows inside a data-ui fragment">
 <div className="flex items-baseline justify-between gap-3">
 <span className="text-[12px] font-semibold text-[var(--mut)]">{label}</span>
 </div>
 <p className="mt-0.5 text-[15px] font-medium text-[var(--text)]">{main}</p>
 <p className="text-[12px] text-[var(--mut)]">{sub}</p>
 </div>
 );
}

function clean(s: string): string {
 const t = s.trim().toLowerCase();
 return t.length >= 3 ? t : "";
}
function short(s: string): string {
 const words = clean(s).split(/\s+/);
 return words.slice(-2).join(" ") || words[0] || "it";
}
function hash(s: string): number {
 let h = 7;
 for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
 return h;
}
function subjectFor(thing: string): string {
 const t = short(thing);
 return pick(SUBJECTS, hash(thing))(t);
}
const SUBJECTS: ((t: string) => string)[] = [
 (t) => `the ${t} question nobody answers`,
 (t) => `quick one about ${t}`,
 (t) => `${t}, minus the dashboard`,
 (t) => `who else builds ${t} like this?`,
];
function pick<T>(arr: T[], n: number): T {
 return arr[n % arr.length];
}

/* ── how-it-works, Stages as one bar ──────────────────────────── */
const STAGES = [
 { grow: 8, label: "Connecting your mailbox", time: "Two minutes", clause: "Google consents to the gmail.send scope. Nothing else is asked for.", bg: "var(--field-3)" },
 { grow: 22, label: "Writing the brief & importing buyers", time: "Twenty minutes", clause: "What you sell, in your words. Paste 40 names or import a list.", bg: "var(--field-1)" },
 { grow: 18, label: "You approving the first drafts", time: "One hour", clause: "You edit, you approve, you send the first batch yourself.", bg: "var(--field-2)" },
 { grow: 100, label: "Routine, every weekday 10:15 UTC", time: "Forwards, forever", clause: "The run sends within your cap, stops for unsubscribes, logs every event.", bg: "var(--field-2)" },
];

export function HowItWorks() {
 return (
 <section
 id="how"
 data-chapter="paper"
 className="min-h-[92svh] px-6 py-24 lg:px-10 lg:py-36"
 style={{ background: "var(--bg)" }}
 >      <h2 className="text-[clamp(34px,10.4vw,104px)] font-extrabold leading-[0.9] tracking-[-0.04em] text-[var(--text)]">
        Set up once.
        <br />
        Runs daily.
      </h2>
 <div data-ui className="mt-16 flex flex-row gap-1.5 lg:gap-1.5" style={{ height: "clamp(140px,22vh,240px)" }}>
 {STAGES.map((s) => (
 <div key={s.label} className="flex flex-col" style={{ flexGrow: s.grow, flexBasis: 0 }}>
 <div
 className="flex flex-1 p-3 lg:p-5"
 style={{ background: s.bg, cursor: "default" }}
 >              <span className="text-[13px] font-semibold leading-none text-black/80 lg:text-[clamp(18px,1.6vw,30px)]">
                {s.time}
              </span>
            </div>
            <p className="mt-2 max-w-[24ch] text-[15px] leading-snug text-[var(--text)]">
              <span className="font-semibold">{s.label}</span>
              <span> {s.clause}</span>
            </p>
 </div>
 ))}
 </div>
 </section>
 );
}

/* ── stats, Figure set by a slider ────────────────────────────── */
export function YourYear() {
 const [contacts, setContacts] = React.useState(40);
 const year = contacts * 12;
 return (    <section
      id="year"
      data-chapter="mint"
      className="flex min-h-[88svh] flex-col justify-between px-6 py-20 lg:px-10"
      style={{ background: "var(--field-2)", color: "var(--field-2-ink)" }}
    >
      <div>
        <h2 className="text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.02em]">
          How many buyers can you list?
        </h2>      <label
        htmlFor="contacts"
        className="gp-reveal mt-7 block max-w-[420px]"
      >        <span className="text-[15px] font-medium">
          {contacts} contacts a month
        </span>
 <input
 data-ui
 id="contacts"
 type="range"
 min={10}
 max={200}
 step={5}
 value={contacts}
 onChange={(e) => setContacts(Number(e.target.value))}
 className="mt-3 block w-full cursor-pointer accent-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
 />
 </label>
 </div>
 <div className="flex flex-wrap items-end justify-between gap-8">    <p className="gp-num text-[clamp(96px,19vw,300px)] font-extrabold leading-[0.8] tracking-[-0.04em]">
          {year.toLocaleString("en-US")}
          <span className="ml-2 text-[0.22em] font-semibold">emails a year</span>
        </p>        <p className="max-w-[30ch] text-[17px] leading-snug">
 One first-touch each, a follow-up when a thread runs quiet, and a
 daily cap you own. Mailbox limits kick in long before ours.
 </p>
 </div>
 </section>
 );
}

/* ── atmosphere, the placed rest (mist photos, b/w, credited) ── */
export function Atmospherics() {
 return (
 <section
 aria-label="Morning mist over the water — the quiet of a run that already happened"
 data-chapter="surface"
 className="relative"
 >
 <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
 {/* eslint-disable-next-line @next/next/no-img-element */}        <img
          src="/atmos/mist.jpg"
          alt="Still misty water fading into a soft grey sky"
          width={1600}
          height={1000}
          loading="lazy"
          className="gp-drift block h-[42vh] w-full object-cover md:h-[56vh]"
        />
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src="/atmos/gulls.jpg"
 alt="Gulls perched on a concrete wall beside a pale sea"
 width={1600}
 height={1000}
 loading="lazy"
 className="block h-[42vh] w-full object-cover md:h-[56vh]"
 />
 </div>      <p className="absolute bottom-4 left-6 text-[13px] text-white lg:left-10">
 Mist over the outer harbour at 06:40 — when the run has already finished.
 </p>
 </section>
 );
}
