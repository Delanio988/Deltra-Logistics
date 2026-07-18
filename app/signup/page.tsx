"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { COUNTRIES } from "@/lib/countries";
import MagneticButton from "@/components/ui/MagneticButton";
import Wordmark from "@/components/ui/Wordmark";
import signupVisual from "@/public/images/signup-visual.svg";
import logoMark from "@/public/deltra-mark-ondark.png";

// Falls back to Cloudflare's public "always passes" test key only when
// NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't configured, so local dev keeps working
// before a real site key is issued. The widget renders and collects a token,
// but nothing currently verifies that token server-side against
// TURNSTILE_SECRET_KEY before account creation — a real deployment should add
// that check (Cloudflare's siteverify endpoint) to a signup Server Action.
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY;

const PersonIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5 19c0-3.5 3-5.5 7-5.5s7 2 7 5.5" strokeLinecap="round" />
  </svg>
);

const EmailIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 118 0v3" strokeLinecap="round" />
  </svg>
);

function FieldIcon({ children }: { children: ReactNode }) {
  return <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg/35">{children}</span>;
}

const inputBase =
  "mt-2 w-full rounded-full border border-fg/15 bg-fg/5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent focus:shadow-accent";

export default function SignupPage() {
  const { user, isLoading, register } = useAuth();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const countryId = useId();
  const phoneId = useId();
  const passwordId = useId();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryIso, setCountryIso] = useState(COUNTRIES[0].iso);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyEmailSent, setVerifyEmailSent] = useState<string | null>(null);

  const markTouched = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  // Already signed in? Skip the form entirely.
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [isLoading, user, router]);

  const firstNameError = !firstName.trim() ? "First name is required." : null;
  const lastNameError = !lastName.trim() ? "Last name is required." : null;
  const emailError = !email.trim()
    ? "Email is required."
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? "Enter a valid email address."
      : null;
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const phoneError = !phoneNumber.trim() ? "Phone number is required." : phoneDigits.length < 7 ? "Enter a valid phone number." : null;
  const passwordError = !password ? "Password is required." : password.length < 8 ? "Password must be at least 8 characters." : null;
  const termsError = !agreeTerms ? "Required to continue." : null;
  const privacyError = !agreePrivacy ? "Required to continue." : null;

  const isFormValid =
    !firstNameError && !lastNameError && !emailError && !phoneError && !passwordError && !termsError && !privacyError;

  const showError = (field: string, message: string | null) => (touched[field] ? message : null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setFormError(null);

    const country = COUNTRIES.find((c) => c.iso === countryIso) ?? COUNTRIES[0];
    const result = await register({
      firstName,
      lastName,
      email,
      phone: `${country.dial} ${phoneNumber.trim()}`,
      password,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }
    if (result.status === "verify-email") {
      setVerifyEmailSent(result.email);
      return;
    }
    router.replace("/dashboard");
  };

  if (isLoading || user) {
    return <div className="min-h-screen bg-bg" />;
  }

  const fadeUp = (delay: number) => ({
    initial: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  });

  if (verifyEmailSent) {
    return (
      <div className="grid min-h-screen grid-cols-1 bg-bg lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
          <motion.div {...fadeUp(0)} className="mx-auto w-full max-w-md">
            <Link href="/" data-cursor-hover="Home">
              <Wordmark className="h-8" />
            </Link>
            <span className="gold-label mt-10 inline-block">Almost there</span>
            <h1 className="mt-5 text-display-sm font-extrabold text-fg">
              Check your email<span className="text-accent">.</span>
            </h1>
            <p className="mt-3 text-sm text-fg/60">
              We sent a verification link to <span className="font-semibold text-fg">{verifyEmailSent}</span>.
              Click it to activate your account, then log in.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-block font-semibold text-accent hover:text-accent-dark"
              data-cursor-hover="Login"
            >
              Back to login
            </Link>
          </motion.div>
        </div>
        <div className="relative hidden overflow-hidden lg:block">
          <Image src={signupVisual} alt="" fill priority sizes="50vw" className="object-cover" />
          <div className="absolute bottom-8 left-8">
            <Image src={logoMark} alt="Deltra Logistics" className="h-10 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-bg lg:grid-cols-2">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />

      {/* Left: form */}
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <motion.div {...fadeUp(0)}>
            <Link href="/" data-cursor-hover="Home">
              <Wordmark className="h-8" />
            </Link>
          </motion.div>

          <motion.div {...fadeUp(0.05)} className="mt-10">
            <span className="gold-label">Start for free</span>
            <h1 className="mt-5 text-display-sm font-extrabold text-fg">
              Create your account<span className="text-accent">.</span>
            </h1>
            <p className="mt-3 text-sm text-fg/60">
              Already a member?{" "}
              <Link href="/login" className="font-semibold text-accent hover:text-accent-dark">
                Log In
              </Link>
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={firstNameId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
                  First Name <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <FieldIcon>{PersonIcon}</FieldIcon>
                  <input
                    id={firstNameId}
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => markTouched("firstName")}
                    placeholder="Alex"
                    className={`${inputBase} pl-11 pr-4`}
                  />
                </div>
                {showError("firstName", firstNameError) && (
                  <p className="mt-1.5 text-xs text-red-400">{firstNameError}</p>
                )}
              </div>

              <div>
                <label htmlFor={lastNameId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
                  Last Name <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <FieldIcon>{PersonIcon}</FieldIcon>
                  <input
                    id={lastNameId}
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => markTouched("lastName")}
                    placeholder="Morgan"
                    className={`${inputBase} pl-11 pr-4`}
                  />
                </div>
                {showError("lastName", lastNameError) && (
                  <p className="mt-1.5 text-xs text-red-400">{lastNameError}</p>
                )}
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.15)}>
              <label htmlFor={emailId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
                Email <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <FieldIcon>{EmailIcon}</FieldIcon>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched("email")}
                  placeholder="Enter your Email"
                  className={`${inputBase} pl-11 pr-4`}
                />
              </div>
              {showError("email", emailError) && <p className="mt-1.5 text-xs text-red-400">{emailError}</p>}
            </motion.div>

            <motion.div {...fadeUp(0.2)}>
              <label htmlFor={phoneId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
                Phone Number <span className="text-accent">*</span>
              </label>
              <div className="mt-2 flex gap-2">
                <label htmlFor={countryId} className="sr-only">
                  Country code
                </label>
                <select
                  id={countryId}
                  value={countryIso}
                  onChange={(e) => setCountryIso(e.target.value)}
                  className="w-[6.5rem] shrink-0 rounded-full border border-fg/15 bg-fg/5 px-3 py-3 text-sm text-fg outline-none transition-colors focus:border-accent focus:shadow-accent"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.iso} value={c.iso} className="bg-surface text-fg">
                      {c.iso} {c.dial}
                    </option>
                  ))}
                </select>
                <input
                  id={phoneId}
                  type="tel"
                  autoComplete="tel-national"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onBlur={() => markTouched("phone")}
                  placeholder="876 555 0110"
                  className={`${inputBase} flex-1 px-5`}
                />
              </div>
              <p className="mt-2 text-xs text-fg/40">
                Select your country and enter your number — we&rsquo;ll send WhatsApp/SMS updates there.
              </p>
              {showError("phone", phoneError) && <p className="mt-1.5 text-xs text-red-400">{phoneError}</p>}
            </motion.div>

            <motion.div {...fadeUp(0.25)}>
              <label htmlFor={passwordId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
                Password <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <FieldIcon>{LockIcon}</FieldIcon>
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched("password")}
                  placeholder="Enter your password"
                  className={`${inputBase} pl-11 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-fg/35 transition-colors hover:text-accent"
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
              {showError("password", passwordError) ? (
                <p className="mt-1.5 text-xs text-red-400">{passwordError}</p>
              ) : (
                <p className="mt-1.5 text-xs text-fg/35">At least 8 characters.</p>
              )}
            </motion.div>

            <motion.div {...fadeUp(0.3)} className="space-y-3">
              <div>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-fg/70">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      markTouched("terms");
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-fg/20 bg-fg/5 accent-accent"
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="font-semibold text-accent hover:text-accent-dark">
                      Terms of Agreement
                    </Link>
                  </span>
                </label>
                {showError("terms", termsError) && <p className="mt-1 text-xs text-red-400">{termsError}</p>}
              </div>

              <div>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-fg/70">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => {
                      setAgreePrivacy(e.target.checked);
                      markTouched("privacy");
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-fg/20 bg-fg/5 accent-accent"
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/privacy" target="_blank" className="font-semibold text-accent hover:text-accent-dark">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {showError("privacy", privacyError) && <p className="mt-1 text-xs text-red-400">{privacyError}</p>}
              </div>
            </motion.div>

            {formError && (
              <p role="alert" aria-live="polite" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {formError}
              </p>
            )}

            <motion.div {...fadeUp(0.35)}>
              <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-theme="auto" />
            </motion.div>

            <motion.div {...fadeUp(0.4)}>
              <MagneticButton
                type="submit"
                disabled={!isFormValid || isSubmitting}
                cursorLabel="Sign up"
                className="w-full justify-center bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white disabled:opacity-60"
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </MagneticButton>
            </motion.div>
          </form>
        </div>
      </div>

      {/* Right: branded visual */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image src={signupVisual} alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute bottom-8 left-8">
          <Image src={logoMark} alt="Deltra Logistics" className="h-10 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]" />
        </div>
      </div>
    </div>
  );
}
