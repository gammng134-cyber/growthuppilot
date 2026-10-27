import { cn } from "@/lib/utils";
import * as React from "react";

const base =
  "w-full rounded-md border border-[var(--control)] bg-[var(--card)] px-3 py-2 text-[14px] text-[var(--text)] placeholder:text-[var(--faint)] outline-none transition-colors focus:border-[var(--mut)] focus:bg-[var(--raised)]";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, "h-10", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(base, "min-h-24 resize-y", className)} {...props} />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(base, "h-10 cursor-pointer", className)} {...props} />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[14px] font-medium text-[var(--text)]",
        className,
      )}
      {...props}
    />
  );
}
