import { cn } from "@/lib/utils";
import * as React from "react";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-300",
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "border-slate-400/30 bg-slate-400/10 text-slate-300",
    approved: "border-sky-400/30 bg-sky-400/10 text-sky-300",
    sent: "border-indigo-400/30 bg-indigo-400/10 text-indigo-300",
    replied: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    bounced: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    rejected: "border-rose-400/20 bg-rose-400/5 text-rose-300/70",
    published: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    planned: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    written: "border-indigo-400/30 bg-indigo-400/10 text-indigo-300",
  };
  return (
    <Badge className={map[status] ?? map.draft}>{status}</Badge>
  );
}
