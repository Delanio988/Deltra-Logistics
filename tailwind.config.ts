import type { Config } from "tailwindcss";

// Brand design tokens for Deltra Logistics (placeholder brand name — swap freely).
//
// Two color systems live side by side on purpose:
//
// 1. THEME-AWARE tokens (bg, surface, border, muted, fg, accent.text,
//    gold.text) are CSS variables (app/globals.css :root / .dark) using the
//    "R G B" channel pattern so opacity modifiers (bg-surface/50) still work.
//    These back the site's dark "chrome" — Header, Footer, Hero, dashboard,
//    admin, login/signup backdrop, etc. — which is what actually flips when
//    a visitor toggles light/dark.
// 2. FIXED tokens (navy, offwhite, ink, accent, gold's DEFAULT/light/dark
//    shades) are plain hex, unaffected by the toggle. `navy`/`offwhite`/`ink`
//    back the marketing site's already-light bands (Services, Why Choose Us,
//    Tracking, Process) and the login/signup white form card — deliberately
//    light-styled regardless of overall theme, so they don't participate.
//    `accent`/`gold` (as backgrounds/borders/shadows, not text) stay vivid
//    red/red-orange in both themes — the brand doesn't change.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        fg: "rgb(var(--color-fg) / <alpha-value>)",
        navy: {
          // Fixed neutral dark/black ramp — NOT theme-aware. Backs the
          // marketing site's already-light bands and the auth pages' white
          // form card (see the file-header comment above).
          DEFAULT: "#0A0A0A",
          50: "#CCCCCC",
          100: "#999999",
          300: "#646464",
          500: "#333333",
          700: "#0A0A0A",
          900: "#1A1A1A",
          950: "#000000",
        },
        accent: {
          // Primary accent: buttons, links, key highlights, active states.
          // DEFAULT/light/dark stay vivid in both themes (background/border/
          // shadow use); `text` is a deeper, theme-aware shade for text/links.
          DEFAULT: "#FF2E2E",
          light: "#FF5C5C",
          dark: "#C81E1E",
          text: "rgb(var(--color-accent-text) / <alpha-value>)",
        },
        gold: {
          // Secondary accent: gradients, small highlights, decorative accents.
          DEFAULT: "#FF6538",
          light: "#FF8F6B",
          dark: "#D14A1F",
          text: "rgb(var(--color-gold-text) / <alpha-value>)",
        },
        offwhite: "#F5F5F5",
        ink: "#0A0A0A",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid, clamp-based display sizes for confident, agency-grade headings.
        "display-xl": ["clamp(2.75rem, 6vw, 7rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.25rem, 5vw, 5.5rem)", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.875rem, 3.5vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        "display-sm": ["clamp(1.5rem, 2.5vw, 2.25rem)", { lineHeight: "1.12", letterSpacing: "-0.01em" }],
      },
      letterSpacing: {
        tightest: "-0.03em",
        widest2: "0.35em",
      },
      maxWidth: {
        container: "1440px",
      },
      boxShadow: {
        accent: "0 0 0 1px rgba(255,46,46,0.35), 0 8px 30px -8px rgba(255,46,46,0.45)",
        gold: "0 0 0 1px rgba(255,101,56,0.35), 0 8px 30px -8px rgba(255,101,56,0.35)",
        card: "0 20px 60px -20px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        // Theme-aware: stays today's dark radial in .dark, becomes a near-flat
        // off-white/white radial in light mode (see --gradient-1/2/3 in globals.css).
        "navy-radial":
          "radial-gradient(circle at 50% 0%, rgb(var(--gradient-1)) 0%, rgb(var(--gradient-2)) 45%, rgb(var(--gradient-3)) 100%)",
        "gold-line": "linear-gradient(90deg, transparent, #FF6538, transparent)",
        "brand-gradient": "linear-gradient(135deg, #FF2E2E 0%, #FF6538 100%)",
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        "spin-slow": "spin 18s linear infinite",
        // Seasonal decoration particles — duration/delay are overridden
        // per-instance via inline style (see SeasonalDecorationLayer),
        // mirroring how Marquee overrides `marquee`'s duration above.
        "season-fall": "season-fall 10s linear infinite",
        "season-drift": "season-drift 14s linear infinite",
        "season-float": "season-float 12s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "season-fall": {
          "0%": { transform: "translateY(-10vh) translateX(0) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "50%": { transform: "translateY(50vh) translateX(15px) rotate(180deg)" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(110vh) translateX(-10px) rotate(360deg)", opacity: "0" },
        },
        "season-drift": {
          "0%": { transform: "translateX(-10vw) translateY(0)", opacity: "0" },
          "10%": { opacity: "1" },
          "50%": { transform: "translateX(50vw) translateY(-20px)" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateX(110vw) translateY(10px)", opacity: "0" },
        },
        "season-float": {
          "0%": { transform: "translateY(10vh) translateX(0) scale(0.8)", opacity: "0" },
          "10%": { opacity: "1" },
          "50%": { transform: "translateY(-50vh) translateX(20px) scale(1)" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(-110vh) translateX(-15px) scale(0.9)", opacity: "0" },
        },
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
