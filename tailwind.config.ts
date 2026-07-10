import type { Config } from "tailwindcss";

// Brand design tokens for Meridian Freight (placeholder brand name — swap freely).
// Colors are also mirrored as CSS variables in app/globals.css so they can be
// consumed outside of Tailwind (e.g. inline SVG gradients, canvas drawing).
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
          DEFAULT: "#0B2545",
          50: "#EAF0FB",
          100: "#CBD9F0",
          300: "#5D7FBE",
          500: "#1B3B70",
          700: "#0B2545",
          900: "#071831",
          950: "#040E1D",
        },
        accent: {
          DEFAULT: "#1E4FD8",
          light: "#4E74E6",
          dark: "#15379E",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E6C866",
          dark: "#A9862A",
        },
        offwhite: "#F7F8FA",
        ink: "#0A0E17",
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
        gold: "0 0 0 1px rgba(212,175,55,0.35), 0 8px 30px -8px rgba(212,175,55,0.35)",
        card: "0 20px 60px -20px rgba(11,37,69,0.35)",
      },
      backgroundImage: {
        "navy-radial": "radial-gradient(circle at 50% 0%, #163564 0%, #0B2545 45%, #040E1D 100%)",
        "gold-line": "linear-gradient(90deg, transparent, #D4AF37, transparent)",
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
