"use client";

import Link from "next/link";
import * as React from "react";

// Fixed navigation with no chrome: wordmark, plain links, one action.
// Signature move (colour chapters): the bar takes the ink of the chapter
// beneath it, switching with a 300ms colour transition as each edge passes.
// It is also the home of the page's entrance reveals.

const INK = {
  paper: "#f5f4f1",
  grey: "#000000",
  mint: "#000000",
  orange: "#000000",
  surface: "#f5f4f1",
  ink: "#ffffff",
} as const;

export function useReveals() {
  React.useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".gp-reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.2 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export function Nav() {
  const [ink, setInk] = React.useState<string>(INK.paper);
  useReveals();

  React.useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-chapter]");
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const name = entry.target.getAttribute("data-chapter") ?? "paper";
          setInk(INK[name as keyof typeof INK] ?? INK.paper);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
      style={{ color: ink }}
    >
      <nav className="flex h-16 items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="GrowthPilot home">
          <Mark />
          <span className="text-[15px] font-semibold tracking-tight">GrowthPilot</span>
        </Link>
        <div className="hidden items-center gap-8 text-[15px] font-medium md:flex">
          <a href="#agents" className="hover:underline underline-offset-4">Agents</a>
          <a href="#showcase" className="hover:underline underline-offset-4">Live demo</a>
          <a href="#how" className="hover:underline underline-offset-4">How it works</a>
          <a href="#faq" className="hover:underline underline-offset-4">FAQ</a>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-[15px] font-medium hover:underline underline-offset-4">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-[var(--accent)] px-4 py-2 text-[15px] font-semibold text-[var(--accent-ink)] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}

/** The mark: a climb line in the mint accent, drawn for GrowthPilot. */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <rect x="0" y="0" width="24" height="24" rx="6" fill="#000000" />
      <path
        d="M6 15.5 L12 7 L18 15.5"
        fill="none"
        stroke="#a7ff9c"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
