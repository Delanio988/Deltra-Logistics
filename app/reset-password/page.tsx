"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import MagneticButton from "@/components/ui/MagneticButton";
import Wordmark from "@/components/ui/Wordmark";
import BackButton from "@/components/ui/BackButton";

export default function ResetPasswordPage() {
  const { user, isLoading, updatePassword } = useAuth();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const passwordId = useId();
  const confirmId = useId();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (isDone && !isLoading && user) {
      const timeout = setTimeout(() => {
        router.replace(user.role === "admin" ? "/admin" : "/dashboard");
      }, 1800);
      return () => clearTimeout(timeout);
    }
  }, [isDone, isLoading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(password);
    setIsSubmitting(false);

    if (result.success) {
      setIsDone(true);
    } else {
      setError(result.error);
    }
  };

  const fadeUp = (delay: number) => ({
    initial: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay },
  });

  // No session at all (link expired, or visited directly) — nothing to reset.
  if (!isLoading && !user) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy-radial px-6 py-16 text-fg">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,46,46,0.3),transparent_45%)]" />
        <div className="absolute left-6 top-6 z-20 sm:left-8 sm:top-8">
          <BackButton href="/" label="Back to home" />
        </div>
        <motion.div className="relative z-10 mb-10" {...fadeUp(0)}>
          <Link href="/" data-cursor-hover="Home">
            <Wordmark className="h-9" />
          </Link>
        </motion.div>
        <motion.div
          {...fadeUp(0.1)}
          className="relative z-10 w-full max-w-md rounded-3xl bg-white p-10 text-center text-navy-950 shadow-card"
        >
          <h1 className="text-display-sm font-extrabold text-navy-950">Link expired</h1>
          <p className="mt-3 text-sm text-navy-950/60">
            This password reset link is no longer valid. Request a new one from the login page.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block font-semibold text-accent hover:text-accent-dark"
            data-cursor-hover="Login"
          >
            Back to login
          </Link>
        </motion.div>
      </div>
    );
  }

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
        {isDone ? (
          <>
            <h1 className="text-display-sm font-extrabold text-navy-950">Password updated</h1>
            <p className="mt-3 text-sm text-navy-950/60">Taking you to your account…</p>
          </>
        ) : (
          <>
            <h1 className="text-display-sm font-extrabold text-navy-950">Set a new password</h1>
            <p className="mt-3 text-sm text-navy-950/60">Choose a new password for your account.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label htmlFor={passwordId} className="text-xs font-semibold uppercase tracking-widest text-navy-950/50">
                  New password
                </label>
                <input
                  id={passwordId}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-full border border-navy-950/15 bg-white px-5 py-3 text-sm text-navy-950 outline-none transition-colors focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor={confirmId} className="text-xs font-semibold uppercase tracking-widest text-navy-950/50">
                  Confirm password
                </label>
                <input
                  id={confirmId}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-full border border-navy-950/15 bg-white px-5 py-3 text-sm text-navy-950 outline-none transition-colors focus:border-accent"
                />
              </div>

              {error && (
                <p role="alert" aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <MagneticButton
                type="submit"
                disabled={isSubmitting}
                cursorLabel="Update password"
                className="w-full justify-center bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white disabled:opacity-60"
              >
                {isSubmitting ? "Updating…" : "Update password"}
              </MagneticButton>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
