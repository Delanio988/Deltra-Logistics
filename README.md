# Meridian Freight — Marketing Site

A premium, "Awwwards"-style marketing site for **Meridian Freight** — a placeholder
brand name for a global shipping & logistics company. Swap the name, logo, copy,
and imagery for your real brand whenever you're ready (see [Placeholder content](#placeholder-content--todos) below).

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion,
GSAP/ScrollTrigger, and Lenis smooth scrolling.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it — no environment
variables or external services are required to run the site locally.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```

## Tech stack

| Concern | Library |
| --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS 3 (custom theme, no default palette) |
| Component/page animation | Framer Motion |
| Scroll-driven reveals & pinned sections | GSAP + ScrollTrigger |
| Smooth scrolling | [`lenis`](https://github.com/darkroomengineering/lenis) |
| Font | Poppins via `next/font/google` |

> **Note on Lenis:** the brief referenced `@studio-freight/lenis`. That package
> was renamed — the same library now ships as [`lenis`](https://www.npmjs.com/package/lenis)
> under the darkroom.engineering org. This project uses the current package;
> the API is unchanged.

## Folder structure

```
app/
  layout.tsx          Root layout: Poppins font, providers, Header/Footer
  page.tsx            Assembles all page sections in order
  globals.css         Tailwind directives, CSS variables, global utilities
components/
  layout/
    Header.tsx            Sticky nav, transparent→solid on scroll, mobile menu
    Footer.tsx             Multi-column footer, newsletter form, oversized wordmark
    SmoothScrollProvider.tsx  Lenis + GSAP ScrollTrigger wiring (see comments)
  ui/                   Small reusable interaction primitives
    CustomCursor.tsx    Grows + labels on [data-cursor-hover] elements
    MagneticButton.tsx  Cursor-following button, handles anchor smooth-scroll
    ScrollReveal.tsx    Generic fade/slide-in-on-scroll wrapper (supports stagger)
    SplitText.tsx       Word-by-word masked reveal for the hero headline
    Counter.tsx         Count-up-on-scroll-into-view number
    Marquee.tsx         Infinite horizontal marquee (client logos / terms)
    ServiceIcon.tsx     Inline line-art icon set for the Services grid
    Noise.tsx           Tasteful fixed film-grain overlay
  sections/             One component per page section (Hero, Services, ...)
lib/
  data.ts               All placeholder copy/content in one place
  utils.ts              cn() className helper
  useReducedMotion.ts   Reactive prefers-reduced-motion hook
public/images/          Placeholder SVG artwork (see TODOs below)
```

## Design tokens

Brand colors are defined in **two** places kept in sync intentionally:

- `tailwind.config.ts` → `theme.extend.colors` (`navy`, `accent`, `gold`,
  `offwhite`, `ink`) for use in className utilities.
- `app/globals.css` → `:root` CSS variables (`--color-navy`, `--color-gold`, …)
  for anywhere outside Tailwind's reach (inline SVG gradients, etc).

Fluid display type scale (`text-display-xl` down to `text-display-sm`) is
defined in `tailwind.config.ts` using `clamp()` so headings scale smoothly
between mobile and desktop without breakpoint-specific overrides.

## Signature interactions — where to find them

- **Custom cursor** — `components/ui/CustomCursor.tsx`. Mark any element with
  `data-cursor-hover="Label"` to grow the cursor and show a label on hover.
  Disabled on touch devices and when `prefers-reduced-motion` is set.
- **Magnetic buttons** — `components/ui/MagneticButton.tsx`. Used for every
  primary CTA; also handles smooth-scrolling to `#anchor` targets via Lenis.
- **Scroll reveals** — `components/ui/ScrollReveal.tsx`. Pass an `index` prop
  on sibling items to get an automatic stagger.
- **Split-text hero headline** — `components/ui/SplitText.tsx`.
- **Count-up stats** — `components/ui/Counter.tsx`, used in `StatsBar.tsx`.
- **Infinite marquee** — `components/ui/Marquee.tsx`, used in `ClientMarquee.tsx`.
- **Parallax hero** — `components/sections/Hero.tsx` via Framer Motion's
  `useScroll`/`useTransform`.
- **Pinned horizontal timeline** — `components/sections/Process.tsx`. Desktop
  only (GSAP ScrollTrigger `pin` + `scrub`); collapses to a static grid on
  mobile and under reduced motion.
- **Animated network map** — `components/sections/GlobalNetwork.tsx`. Routes
  draw themselves in via ScrollTrigger; small dots continuously travel the
  routes via native SVG `<animateMotion>`.
- **Smooth scrolling** — `components/layout/SmoothScrollProvider.tsx` wires
  Lenis to GSAP's ticker and keeps ScrollTrigger in sync. In development only,
  the active instance is exposed at `window.__lenis` for debugging.

## Accessibility & motion

- All signature motion (cursor, magnetic pull, parallax, pinned scroll,
  Lenis itself) is gated behind a `useReducedMotion()` check and falls back to
  plain, static layouts.
- `app/globals.css` also sets a blanket `@media (prefers-reduced-motion: reduce)`
  rule that collapses any remaining CSS transitions/animations.
- Sections use semantic landmarks (`header`, `main`, `footer`, `nav`, `section`),
  headings are hierarchical, and interactive controls have `aria-label`s where
  their visible text isn't sufficient (icon-only buttons, carousel controls).
- All images go through `next/image` with descriptive `alt` text.

## Placeholder content & TODOs

Everything here is realistic placeholder copy for a fictional brand — swap it
out before shipping:

- **Brand name/logo** — currently plain text "MERIDIAN FREIGHT" in
  `Header.tsx` and `Footer.tsx`. Replace with a real logo asset.
- **All copy, stats, service descriptions, testimonials, process steps** —
  centralized in `lib/data.ts` for easy editing.
- **`public/images/feature-*.svg`** — abstract placeholder art standing in for
  real photography; each has a visible "TODO: replace…" label baked into the
  image itself so it's obvious in the running site. Referenced from
  `lib/data.ts` → `FEATURES`.
- **Tracking widget** — `components/sections/TrackShipment.tsx` uses mock
  client-side data (`lib/data.ts` → `TRACKING_DATA`); wire up to a real
  tracking API when available.
- **Newsletter & quote forms** — submit handlers currently just update local
  state (`Footer.tsx`, `TrackShipment.tsx`); no data is sent anywhere. Wire up
  a real email provider / CRM before launch.
- **Contact details** — placeholder email/phone in `Footer.tsx` and
  `CtaBand.tsx`; HQ address is left as an explicit `TODO`.
- **Social links** — point to placeholder URLs in `Footer.tsx`.

## Notes on Tailwind version

The project pins **Tailwind CSS v3** (classic `tailwind.config.ts` + PostCSS
setup) rather than v4, since the brief's custom-theme approach (colors,
`fontSize`, `keyframes`, etc. via `theme.extend`) maps directly onto v3's
config file. If you migrate to v4 later, the same tokens move into an
`@theme` block in `globals.css`.
