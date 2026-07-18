"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import MagneticButton from "@/components/ui/MagneticButton";
import Wordmark from "@/components/ui/Wordmark";

export default function LoginPage() {
  const { user, isLoading, login, resetPassword } = useAuth();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const emailId = useId();
  const passwordId = useId();
  const resetEmailId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already signed in? Skip the form entirely.
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [isLoading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (result.success) {
      router.replace(result.user.role === "admin" ? "/admin" : "/dashboard");
    } else {
      setError(result.error);
    }
  };

  const toggleForgotForm = () => {
    setShowForgotForm((v) => {
      const next = !v;
      if (next) {
        setResetEmail(email);
        setResetSent(false);
        setResetError(null);
      }
      return next;
    });
  };

  const handleForgotSubmit = async () => {
    setResetError(null);
    setIsSendingReset(true);
    const result = await resetPassword(resetEmail);
    setIsSendingReset(false);
    if (result.success) {
      setResetSent(true);
    } else {
      setResetError(result.error);
    }
  };

  // Fade the form in only once we know there's no existing session — avoids a
  // flash of the login form for users who are about to be redirected away.
  if (isLoading || user) {
    return <div className="min-h-screen bg-bg" />;
  }

  const fadeUp = (delay: number) => ({
    initial: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay },
  });

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy-radial px-6 py-16 text-fg">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,46,46,0.3),transparent_45%)]" />

      <motion.div className="relative z-10 mb-10" {...fadeUp(0)}>
        <Link href="/" data-cursor-hover="Home">
          <Wordmark className="h-9" />
        </Link>
      </motion.div>

      <motion.div
        {...fadeUp(0.1)}
        className="relative z-10 w-full max-w-md rounded-3xl bg-white p-10 text-navy-950 shadow-card"
      >
        <h1 className="text-display-sm font-extrabold text-navy-950">Welcome back</h1>
        <p className="mt-3 text-sm text-navy-950/60">
          Sign in to track shipments and manage your account.
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
              placeholder="Enter your Email"
              className="mt-2 w-full rounded-full border border-navy-950/15 bg-white px-5 py-3 text-sm text-navy-950 outline-none transition-colors focus:border-accent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={passwordId} className="text-xs font-semibold uppercase tracking-widest text-navy-950/50">
                Password
              </label>
              <button
                type="button"
                onClick={toggleForgotForm}
                className="text-xs font-medium text-accent transition-colors hover:text-accent-dark"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative mt-2">
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
            {showForgotForm && (
              <div className="mt-3 rounded-xl border border-navy-950/10 bg-navy-950/[0.03] p-4">
                {resetSent ? (
                  <p className="text-xs text-navy-950/60">
                    If an account exists for that email, a reset link is on its way — check your inbox.
                  </p>
                ) : (
                  <>
                    <label htmlFor={resetEmailId} className="text-xs font-semibold uppercase tracking-widest text-navy-950/50">
                      Reset email
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        id={resetEmailId}
                        type="email"
                        autoComplete="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your Email"
                        className="min-w-0 flex-1 rounded-full border border-navy-950/15 bg-white px-4 py-2 text-sm text-navy-950 outline-none transition-colors focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={handleForgotSubmit}
                        disabled={isSendingReset || !resetEmail.trim()}
                        className="shrink-0 rounded-full bg-navy-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-950/85 disabled:opacity-50"
                      >
                        {isSendingReset ? "Sending…" : "Send link"}
                      </button>
                    </div>
                    {resetError && <p className="mt-2 text-xs text-red-500">{resetError}</p>}
                  </>
                )}
              </div>
            )}
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
        </form>

        <p className="mt-8 text-center text-sm text-navy-950/60">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-accent hover:text-accent-dark">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
