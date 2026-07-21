"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Script from "next/script";
import { useTheme } from "next-themes";

// Cloudflare's published "always passes" test site key — pairs with the
// matching test secret key in lib/actions/turnstile.ts, so local dev keeps
// working (and still genuinely round-trips through siteverify) before a
// real NEXT_PUBLIC_TURNSTILE_SITE_KEY is issued.
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY;

type TurnstileRenderOptions = {
  sitekey: string;
  theme?: "light" | "dark";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export type TurnstileHandle = {
  /** Call after a failed submit — a token is single-use, so the widget must
   *  re-challenge before the next attempt can succeed. */
  reset: () => void;
};

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
};

/** Cloudflare Turnstile bot-check widget. Renders explicitly via
 *  window.turnstile.render() (rather than the implicit cf-turnstile div)
 *  so the token, expiry, and error states are all available in React —
 *  needed to gate the submit button and to reset the widget on retry. */
const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(function TurnstileWidget(
  { onVerify, onExpire, onError },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [isApiReady, setIsApiReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (window.turnstile) {
      setIsApiReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.turnstile) {
        setIsApiReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isApiReady || !containerRef.current || widgetIdRef.current || !window.turnstile) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: resolvedTheme === "dark" ? "dark" : "light",
      callback: onVerify,
      "expired-callback": () => onExpire?.(),
      "error-callback": () => onError?.(),
    });
    // Widget should render exactly once per mount — re-running this on
    // every onVerify/onExpire/onError identity change would re-create it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiReady, resolvedTheme]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onReady={() => setIsApiReady(true)}
      />
      <div ref={containerRef} />
    </>
  );
});

export default TurnstileWidget;
