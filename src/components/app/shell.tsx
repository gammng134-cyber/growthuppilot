"use client";

import {
  BarChart3,
  Bot,
  FileText,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  PenTool,
  Settings as SettingsIcon,
  UserSearch,
  Users,
  X,
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
  { href: "/app/seo", label: "SEO agent", icon: PenTool },
  { href: "/app/settings", label: "Settings", icon: SettingsIcon },
];

// True-black flat shell: sidebar and page share one ground, separated by a
// single 1px rule. The active nav item is marked only by its label going
// from grey to white — no pill, no coloured bar. On a phone the sidebar
// folds into a 48px top bar with a full-screen nav sheet.

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
  const [menu, setMenu] = React.useState(false);

  React.useEffect(() => setMenu(false), [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const navList = (
    <nav className="space-y-0.5 p-3">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex h-8 items-center gap-2.5 rounded-md px-3 text-[14px] transition-colors",
              active
                ? "font-semibold text-[var(--text)]"
                : "text-[var(--mut)] hover:text-[var(--text)]",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  const foot = (
    <div className="p-4">
      {isDemo && (
        <p className="mb-3 rounded-md bg-[var(--pill-warning-bg)] px-3 py-2 text-[13px] leading-snug text-[var(--pill-warning-ink)]">
          Demo mode, data resets on restart, AI and sends are simulated.
        </p>
      )}
      <p className="truncate text-[13px] text-[var(--faint)]">{userEmail}</p>
      <button
        onClick={logout}
        className="mt-2 flex cursor-pointer items-center gap-2 text-[13px] text-[var(--mut)] transition-colors hover:text-[var(--text)]"
      >
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-[var(--line)] lg:flex">
        <Link href="/" className="flex h-14 items-center gap-2.5 px-6 pt-1">
          <Mark size={20} />
          <span className="text-[15px] font-semibold tracking-tight text-[var(--text)]">
            GrowthPilot
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto pt-2">{navList}</div>
        {foot}
      </aside>

      {/* phone top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-[var(--line)] bg-[var(--ground)] px-4 lg:hidden">
        <Link href="/app" className="flex items-center gap-2">
          <Mark size={18} />
          <span className="text-[14px] font-semibold text-[var(--text)]">
            GrowthPilot
          </span>
        </Link>
        <button
          onClick={() => setMenu((v) => !v)}
          aria-label={menu ? "Close menu" : "Open menu"}
          className="cursor-pointer rounded-md p-2 text-[var(--mut)]"
        >
          {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {menu && (
        <div className="fixed inset-0 top-12 z-40 overflow-y-auto bg-[var(--ground)] lg:hidden">
          {navList}
          {foot}
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 pb-16 pt-16 lg:ml-[232px] lg:px-10 lg:pb-10 lg:pt-9">
        {children}
      </main>
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
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-[var(--text)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-[70ch] text-[14px] leading-relaxed text-[var(--mut)]">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function BlogLinkIcon() {
  return <FileText className="h-4 w-4" />;
}

/** The mark: a climb line in the brand mint, drawn for GrowthPilot. */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        d="M4 17 L12 6 L20 17"
        fill="none"
        stroke="var(--hue)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
