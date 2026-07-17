"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import MagneticButton from "@/components/ui/MagneticButton";
import Wordmark from "@/components/ui/Wordmark";

export default function AdminLoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only auto-skip the form for an already-signed-in admin — a signed-in
  // customer should still see this form (and get a clear error if they try
  // it), rather than being silently redirected to their own dashboard.
  useEffect(() => {
    if (!isLoading && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [isLoading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.user.role !== "admin") {
      setError("This account doesn't have admin access.");
      return;
    }
    router.replace("/admin");
  };

  if (isLoading || user?.role === "admin") {
    return <div className="min-h-screen bg-bg" />;
  }

  const fadeUp = (delay: number) => ({
    initial: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay },
  });

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy-radial px-6 py-16 text-fg">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,101,56,0.3),transparent_45%)]" />

      <motion.div className="relative z-10 mb-10" {...fadeUp(0)}>
        <Link href="/" data-cursor-hover="Home">
          <Wordmark className="h-9" />
        </Link>
      </motion.div>

      <motion.div
        {...fadeUp(0.1)}
        className="relative z-10 w-full max-w-md rounded-3xl bg-white p-10 text-navy-950 shadow-card"
      >
        <span className="gold-label">Admin Access</span>
        <h1 className="mt-4 text-display-sm font-extrabold text-navy-950">Warehouse sign in</h1>
        <p className="mt-3 text-sm text-navy-950/60">
          Restricted to Deltra Logistics staff. Customers should use the regular login.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <div>
            <label htmlFor={emailId} className="text-xs font-semibold uppercase tracking-widest text-navy-950/50">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@deltra.com"
              className="mt-2 w-full rounded-full border border-navy-950/15 bg-white px-5 py-3 text-sm text-navy-950 outline-none transition-colors focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor={passwordId} className="text-xs font-semibold uppercase tracking-widest text-navy-950/50">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-full border border-navy-950/15 bg-white px-5 py-3 pr-12 text-sm text-navy-950 outline-none transition-colors focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-950/40 transition-colors hover:text-accent"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.4A9.4 9.4 0 0112 5c5 0 8.7 3.5 10 7-.5 1.3-1.3 2.6-2.3 3.7M6.2 6.6C4.1 8 2.6 9.9 2 12c1.3 3.5 5 7 10 7 1.4 0 2.7-.3 3.9-.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M2 12c1.3-3.5 5-7 10-7s8.7 3.5 10 7c-1.3 3.5-5 7-10 7s-8.7-3.5-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <MagneticButton
            type="submit"
            disabled={isSubmitting}
            cursorLabel="Sign in"
            className="w-full justify-center bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </MagneticButton>

          <p className="rounded-xl border-l-2 border-gold/60 bg-navy-950/[0.03] px-4 py-3 text-xs text-navy-950/50">
            Demo access: <span className="font-semibold text-navy-950/70">admin@deltra.com</span> /{" "}
            <span className="font-semibold text-navy-950/70">admin123</span>
          </p>
        </form>

        <p className="mt-8 text-center text-sm text-navy-950/60">
          Not staff?{" "}
          <Link href="/login" className="font-semibold text-accent hover:text-accent-dark">
            Customer login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
