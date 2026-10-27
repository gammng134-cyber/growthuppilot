import { cn } from "@/lib/utils";
import * as React from "react";

// Badges are pale tints with dark text of the same hue (or the neutral pair
// on dark). Never a saturated chip with white text, never above a heading.

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[var(--pill-neutral-bg)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--pill-neutral-ink)]",
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
    <div className={cn("rounded-lg bg-[var(--card)]", className)} {...props} />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-[var(--pill-neutral-bg)] text-[var(--pill-neutral-ink)]",
    approved: "bg-[var(--pill-neutral-bg)] text-[var(--text)]",
    sent: "bg-[var(--pill-neutral-bg)] text-[var(--text)]",
    replied: "bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)]",
    bounced: "bg-[var(--pill-negative-bg)] text-[var(--pill-negative-ink)]",
    rejected: "bg-[var(--pill-negative-bg)] text-[var(--pill-negative-ink)]",
    published: "bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)]",
    planned: "bg-[var(--pill-warning-bg)] text-[var(--pill-warning-ink)]",
    written: "bg-[var(--pill-neutral-bg)] text-[var(--text)]",
  };
  return <Badge className={map[status] ?? map.draft}>{status}</Badge>;
}
