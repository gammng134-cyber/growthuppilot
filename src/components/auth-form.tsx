"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

/** Google "G" mark for the sign-in button. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.58-5.16 3.58-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}

export function AuthForm({
  mode,
  googleSignIn = false,
  initialError,
}: {
  mode: "login" | "signup";
  googleSignIn?: boolean;
  initialError?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const isSignup = mode === "signup";

  React.useEffect(() => {
    if (initialError) toast(initialError, "error");
  }, [initialError, toast]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Something went wrong", "error");
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      toast("Network error — try again", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 17 L12 6 L20 17"
              fill="none"
              stroke="var(--hue)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[15px] font-semibold text-[var(--text)]">GrowthPilot</span>
        </Link>
        <div className="rounded-lg bg-[var(--card)] p-8">
          <h1 className="text-xl font-semibold text-[var(--text)]">
            {isSignup ? "Create your workspace" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-[var(--mut)]">
            {isSignup
              ? "Free to start. No card, no nonsense."
              : "Sign in to your agent team."}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? "8+ characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Working…" : isSignup ? "Create workspace" : "Sign in"}
            </Button>
          </form>
          {googleSignIn && (
            <div className="mt-4">
              <div className="mb-3 flex items-center gap-3 text-[11px] text-slate-600">
                <span className="h-px flex-1 bg-white/10" />
                or
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <a href="/api/auth/google">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                >
                  <GoogleIcon /> Continue with Google
                </Button>
              </a>
            </div>
          )}
          <p className="mt-6 text-center text-sm text-slate-500">
            {isSignup ? (
              <>
                Already have an account?{" "}<Link href="/login" className="text-slate-300 hover:text-slate-400">
                  Sign in</Link>
              </>
            ) : (
              <>
                New here?{" "}<Link href="/signup" className="text-slate-300 hover:text-slate-400">
                  Create a workspace</Link>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
