"use client";

import { useEffect } from "react";
import Link from "next/link";

// Fires only when the ROOT layout itself throws, so none of the app's
// providers (theme, motion, seasonal) are available here — this must render
// its own <html>/<body> and stick to plain inline styles, not Tailwind
// classes tied to CSS variables the crashed layout would normally set up.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "4rem 1.5rem",
          backgroundColor: "#0A0A0A",
          color: "#F5F5F5",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.2em", color: "#FF2E2E" }}>DELTRA LOGISTICS</p>
        <h1 style={{ marginTop: "1.5rem", fontSize: "1.75rem", fontWeight: 800 }}>Something went wrong</h1>
        <p style={{ marginTop: "1rem", maxWidth: "28rem", fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(245,245,245,0.6)" }}>
          We hit an unexpected error. Try again, or reach us at{" "}
          <a href="mailto:deltralogistics8@gmail.com" style={{ color: "#FF2E2E" }}>
            deltralogistics8@gmail.com
          </a>
          .
        </p>
        <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              borderRadius: "9999px",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              backgroundColor: "#FF2E2E",
              color: "#0A0A0A",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              borderRadius: "9999px",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#F5F5F5",
              border: "1px solid rgba(245,245,245,0.25)",
              textDecoration: "none",
            }}
          >
            Go home
          </Link>
        </div>
        {error.digest && <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "rgba(245,245,245,0.3)" }}>Error ref: {error.digest}</p>}
      </body>
    </html>
  );
}
