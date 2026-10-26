"use client";

import {
  BarChart3,
  Bot,
  FileText,
  LogOut,
  Mail,
  MessageSquare,
  PenTool,
  Settings as SettingsIcon,
  UserSearch,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/app", label: "Overview", icon: BarChart3, exact: true },
  { href: "/app/contacts", label: "Contacts", icon: Users },
  { href: "/app/outreach", label: "Outreach", icon: Mail },
  { href: "/app/leads", label: "Leads", icon: UserSearch },
  { href: "/app/messaging", label: "Messaging", icon: MessageSquare },
  { href: "/app/replies", label: "Replies", icon: Zap },
  { href: "/app/content", label: "Content", icon: FileText },
  { href: "/app/chatbot", label: "Chatbot", icon: Bot },
  { href: "/app/seo", label: "SEO Agent", icon: PenTool },
  { href: "/app/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({
  children,
  userEmail,
  isDemo,
}: {
  children: React.ReactNode;
  userEmail: string;
  isDemo: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/5 bg-ink-900/60 backdrop-blur">
        <Link href="/" className="flex h-16 items-center gap-2 border-b border-white/5 px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-bold text-white">
            G
          </span>
          <span className="text-sm font-semibold text-white">GrowthPilot</span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-indigo-500/15 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                )}
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/5 p-4">
          {isDemo && (
            <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[11px] leading-snug text-amber-300">
              Demo mode — data resets on restart, AI + sends are simulated.
            </div>
          )}
          <div className="truncate text-xs text-slate-500">{userEmail}</div>
          <button
            onClick={logout}
            className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-400 transition-colors hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function BlogLinkIcon() {
  return <FileText className="h-4 w-4" />;
}
