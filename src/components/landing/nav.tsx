"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";

export function Nav() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/5 bg-ink-950/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white">
            G
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            GrowthPilot
          </span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          <a href="#agents" className="transition-colors hover:text-white">
            Agents
          </a>
          <a href="#how" className="transition-colors hover:text-white">
            How it works
          </a>
          <a href="#safety" className="transition-colors hover:text-white">
            Safety
          </a>
          <a href="#faq" className="transition-colors hover:text-white">
            FAQ
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
