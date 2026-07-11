# Deltra Logistics — Marketing Site + Customer Portal

A premium, "Awwwards"-style marketing site for **Deltra Logistics** — a placeholder
brand name for a global shipping & logistics company. Swap the name, logo, copy,
and imagery for your real brand whenever you're ready (see [Placeholder content](#placeholder-content--todos) below).

Includes a mock-authenticated customer portal (`/login` → `/dashboard`) for
tracking packages and finding drop-off locations — see
[Customer portal (demo)](#customer-portal-demo) below.

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

> **Note on Lenis:** the original brief referenced `@studio-freight/lenis`.
> That package was renamed — the same library now ships as
> [`lenis`](https://www.npmjs.com/package/lenis) under the darkroom.engineering
> org. This project uses the current package; the API is unchanged.

## Customer portal (demo)

- **`/login`** — email/password form. Demo credentials:
  `demo@deltra.com` / `demo123` (also shown on the login screen itself).
- **`/dashboard`** — protected route: "My Packages" (mock shipments with
  status badges, a progress bar, and an expandable step timeline) and a
  "Shipping Drop-Off Location" panel (mock warehouse address, hours, phone,
  an embedded map, copy-address, and get-directions).

Auth is intentionally mock/client-side for now — see
[`lib/auth-context.tsx`](lib/auth-context.tsx). The whole `login()` call is
fenced with `// ---- MOCK AUTH ----` / `// ---- END MOCK AUTH ----` comments;
swap that block for a real API or [NextAuth](https://authjs.dev) call and
nothing else needs to change, since every consumer only depends on
`useAuth()`'s `{ user, isLoading, login, logout }` shape. Session state is a
JSON blob in `localStorage` (key `deltra_auth_session`) — there's no real
token/cookie, so treat this as a UI scaffold, not a security boundary.

`components/auth/RequireAuth.tsx` is a reusable guard for protected routes:
it shows a small loading state while the initial session check runs, then
redirects to `/login` if there's no user. `/dashboard` is currently the only
route wrapped in it.

## Folder structure

```
app/
  layout.tsx              Root layout: Poppins font, AuthProvider, SmoothScrollProvider,
                          CustomCursor, Noise — everything global across all routes
  (marketing)/
    layout.tsx             Header + <main> + Footer — marketing chrome, home page only
    page.tsx               Assembles all home page sections in order
  login/page.tsx           Standalone login screen (no marketing chrome)
  dashboard/page.tsx        Protected customer dashboard (no marketing chrome)
  globals.css             Tailwind directives, CSS variables, global utilities
components/
  layout/
    Header.tsx            Sticky nav, transparent→solid on scroll, mobile menu
    Footer.tsx             Multi-column footer, newsletter form, oversized wordmark
    SmoothScrollProvider.tsx  Lenis + GSAP ScrollTrigger wiring (see comments)
  auth/
    RequireAuth.tsx        Client guard: redirects to /login if not authenticated
  dashboard/
    DashboardHeader.tsx    Simplified header: logo, name/avatar, logout
    PackageCard.tsx        Shipment row: badge, progress bar, expandable timeline
    DropOffPanel.tsx       Warehouse address + embedded map + copy/directions
  ui/                   Small reusable interaction primitives
    Wordmark.tsx        Single source of truth for the brand name/logo text
    CustomCursor.tsx    Grows + labels on [data-cursor-hover] elements
    MagneticButton.tsx  Cursor-following button, handles anchor smooth-scroll + /routes
    ScrollReveal.tsx    Generic fade/slide-in-on-scroll wrapper (supports stagger)
    SplitText.tsx       Word-by-word masked reveal for the hero headline
    Counter.tsx         Count-up-on-scroll-into-view number
    Marquee.tsx         Infinite horizontal marquee (client logos / terms)
    ServiceIcon.tsx     Inline line-art icon set for the Services grid
    StatusTimeline.tsx  Shared step timeline (public tracking widget + dashboard)
    Noise.tsx           Tasteful fixed film-grain overlay
  sections/             One component per home-page section (Hero, Services, ...)
lib/
  data.ts               Marketing page placeholder copy/content
  dashboard-data.ts      Mock packages + drop-off location, typed for an easy API swap
  auth-context.tsx      Mock AuthProvider / useAuth (see Customer portal above)
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

The one deliberate departure from the brand palette is a small semantic red
used only for the login form's inline error state — gold is reserved for
positive/highlight accents elsewhere, so it's not reused for error messaging.

## Signature interactions — where to find them

- **Custom cursor** — `components/ui/CustomCursor.tsx`. Mark any element with
  `data-cursor-hover="Label"` to grow the cursor and show a label on hover.
  Disabled on touch devices and when `prefers-reduced-motion` is set.
- **Magnetic buttons** — `components/ui/MagneticButton.tsx`. Used for every
  primary CTA; handles smooth-scrolling to `#anchor` targets via Lenis, plain
  navigation for internal `/routes`, and an optional `disabled` state.
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
- **Shared status timeline** — `components/ui/StatusTimeline.tsx`. Used by
  both the public `TrackShipment` widget and the dashboard's package detail
  view so they stay visually identical.
- **Smooth scrolling** — `components/layout/SmoothScrollProvider.tsx` wires
  Lenis to GSAP's ticker and keeps ScrollTrigger in sync. In development only,
  the active instance is exposed at `window.__lenis` for debugging.

## Accessibility & motion

- All signature motion (cursor, magnetic pull, parallax, pinned scroll,
  Lenis itself, the login screen's entrance) is gated behind a
  `useReducedMotion()` check and falls back to plain, static layouts.
- `app/globals.css` also sets a blanket `@media (prefers-reduced-motion: reduce)`
  rule that collapses any remaining CSS transitions/animations.
- Sections use semantic landmarks (`header`, `main`, `footer`, `nav`, `section`),
  headings are hierarchical, and interactive controls have `aria-label`s where
  their visible text isn't sufficient (icon-only buttons, carousel controls,
  the password show/hide toggle).
- Package cards use a real `<button>` for the expand/collapse control (not a
  `div` with an `onClick`), so they're keyboard-operable and get a focus ring
  for free.
- All images go through `next/image` with descriptive `alt` text.

## Placeholder content & TODOs

Everything here is realistic placeholder copy for a fictional brand — swap it
out before shipping:

- **Brand name/logo** — centralized in `components/ui/Wordmark.tsx`. Replace
  with a real logo asset there and it updates everywhere (nav, footer, login,
  dashboard header).
- **All marketing copy, stats, service descriptions, testimonials, process
  steps** — centralized in `lib/data.ts`.
- **`public/images/feature-*.svg`** — abstract placeholder art standing in for
  real photography; each has a visible "TODO: replace…" label baked into the
  image itself so it's obvious in the running site. Referenced from
  `lib/data.ts` → `FEATURES`.
- **Tracking widget** — `components/sections/TrackShipment.tsx` uses mock
  client-side data (`lib/data.ts` → `TRACKING_DATA`); wire up to a real
  tracking API when available.
- **Dashboard packages & drop-off hub** — `lib/dashboard-data.ts`; swap
  `PACKAGES` and `DROP_OFF_LOCATION` for real API responses (types are already
  in place). The drop-off hub uses a real address/coordinates for the map demo
  but is entirely fictional as a Deltra Logistics facility.
- **Auth** — `lib/auth-context.tsx`; see [Customer portal (demo)](#customer-portal-demo).
- **Newsletter form** — submit handler currently just updates local state
  (`Footer.tsx`); no data is sent anywhere. Wire up a real email provider/CRM
  before launch.
- **Contact details** — placeholder email/phone in `Footer.tsx`; HQ address is
  left as an explicit `TODO`.
- **Social links** — point to placeholder URLs in `Footer.tsx`.

## Notes on Tailwind version

The project pins **Tailwind CSS v3** (classic `tailwind.config.ts` + PostCSS
setup) rather than v4, since the brief's custom-theme approach (colors,
`fontSize`, `keyframes`, etc. via `theme.extend`) maps directly onto v3's
config file. If you migrate to v4 later, the same tokens move into an
`@theme` block in `globals.css`.
