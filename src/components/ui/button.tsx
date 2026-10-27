import { cn } from "@/lib/utils";
import * as React from "react";

// True-black flat: the primary control is primary by inversion (light fill,
// black label, full pill). No accent on buttons; no shadows; no gradients.

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-[var(--text)] text-black hover:opacity-90",
  secondary: "bg-[var(--raised)] text-[var(--text)] hover:bg-[var(--control)]",
  ghost: "text-[var(--mut)] hover:text-[var(--text)] hover:bg-[var(--raised)]",
  danger: "bg-[var(--pill-negative-bg)] text-[var(--pill-negative-ink)] hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-[14px]",
  lg: "h-10 px-5 text-[15px]",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text)]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
