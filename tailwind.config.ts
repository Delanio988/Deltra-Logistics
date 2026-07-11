import type { Config } from "tailwindcss";

// Brand design tokens for Deltra Logistics (placeholder brand name — swap freely).
// Colors are also mirrored as CSS variables in app/globals.css so they can be
// consumed outside of Tailwind (e.g. inline SVG gradients, canvas drawing).
//
// Red/black identity (v2): token NAMES are kept as-is on purpose (navy, gold,
// accent, offwhite) so every existing className in the app keeps working —
// only the hex VALUES changed, which is what makes a source-of-truth token
// swap actually cascade. Despite the name, `gold` is now a red-orange
// secondary accent, not gold — see the role comments below.
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
        navy: {
          // Neutral dark/black ramp. -950 is the dominant shade (solid dark
          // section backgrounds, and — via opacity modifiers — body text/
          // borders on light surfaces). -900/700/500/300 fill in the new
          // "surface / border / muted text" roles the red-black system needs.
          DEFAULT: "#0A0A0A", // near-black — primary deep background
          50: "#CCCCCC",
          100: "#999999",
          300: "#646464", // muted text (gray)
          500: "#333333", // borders / dividers / muted UI (mid gray)
          700: "#0A0A0A", // near-black — primary deep background
          900: "#1A1A1A", // surfaces / cards (dark gray)
          950: "#000000", // true black — sections/footer
        },
        accent: {
          // Primary accent: buttons, links, key highlights, active states.
          DEFAULT: "#FF2E2E", // vibrant red
          light: "#FF5C5C",
          dark: "#C81E1E", // hover / pressed
        },
        gold: {
          // Secondary accent: gradients, small highlights, decorative accents.
          DEFAULT: "#FF6538", // red-orange
          light: "#FF8F6B",
          dark: "#D14A1F",
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
        "navy-radial": "radial-gradient(circle at 50% 0%, #1A1A1A 0%, #0A0A0A 45%, #000000 100%)",
        "gold-line": "linear-gradient(90deg, transparent, #FF6538, transparent)",
        "brand-gradient": "linear-gradient(135deg, #FF2E2E 0%, #FF6538 100%)",
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        "pulse-slow": "pulse-slow 2.4s ease-in-out infinite",
        "spin-slow": "spin 18s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.3)" },
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
