import type { NextConfig } from "next";

// Not a nonce-based strict-dynamic CSP — this app self-hosts its fonts (no
// runtime font CDN) and has no user-uploaded/rendered scripts, but it does
// have a handful of first-party inline scripts (next-themes' anti-FOUC
// snippet, Next's own hydration payload) plus one legitimate third-party
// script (Cloudflare Turnstile on /signup). 'unsafe-inline' on script-src
// keeps those working without wiring a nonce through every layout/provider;
// it doesn't stop inline-script injection, but every other CSP directive
// below still blocks loading external scripts/objects/frames from anywhere
// not explicitly allow-listed, which is the more common exploitation path.
//
// 'unsafe-eval' is added in development only — Next's dev-mode Fast Refresh
// runtime (main-app.js) calls eval() to wire up module hot-reloading, and a
// stricter script-src blocks that eval and silently breaks hydration for any
// fully-client-rendered page (confirmed via a CSP violation report: blocked
// eval in main-app.js). Production's client bundles don't use eval, so the
// production CSP stays eval-free.
const isDev = process.env.NODE_ENV !== "production";
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .trim();

const nextConfig: NextConfig = {
  images: {
    // Placeholder section imagery in /public/images is authored SVG (not
    // user-uploaded), so it's safe to allow through the image optimizer.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
