import { cn } from "@/lib/utils";
import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_24px_rgba(99,102,241,0.35)]",
  secondary:
    "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10",
  ghost: "text-slate-300 hover:text-white hover:bg-white/5",
  danger: "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
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
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 cursor-pointer",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
