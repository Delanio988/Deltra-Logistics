# Deltra Logistics — Marketing Site + Freight-Forwarding Portal

A premium, "Awwwards"-style marketing site for **Deltra Logistics** — a placeholder
brand name for a global shipping & logistics / freight-forwarding company. Swap
the name, logo, copy, and imagery for your real brand whenever you're ready
(see [Placeholder content](#placeholder-content--todos) below).

Includes a mock-authenticated **customer portal** (`/login` → `/dashboard`) —
account summary, package tracking, a shipping-rate calculator, and an overseas
"ship to" address — plus a separate **admin area** (`/admin/login` → `/admin`)
where staff add packages and notify customers. See
[Customer portal (demo)](#customer-portal-demo) and
[Admin area (demo)](#admin-area-demo) below.

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
- **`/dashboard`** — protected (customers only), a card-based freight-forwarding
  portal:
  - **Account summary** — greeting, wallet balance, local branch contacts.
  - **Account actions** — Submit Required Invoice, Authorised Users, and
    Messages (this is where admin notifications land — badge count is unread
    messages).
  - **Package summary** — Pre-Alert, Packages (not yet picked up), Bills/
    Transactions.
  - **Overseas shipping address** — the US "ship your purchases here" address,
    including the customer's unique account code and a copy-address button.
  - **Get a Quote** — the same rate calculator as the public `/quote` page.
  - **My Packages** — the full list with a 6-stage status
    (`Pre-Alerted → Received at Warehouse → In Transit → Arrived at Local
    Branch → Ready for Pickup → Delivered`), an animated progress bar, and an
    expandable step timeline per package.

Auth is intentionally mock/client-side for now — see
[`lib/auth-context.tsx`](lib/auth-context.tsx). The whole `login()` call is
fenced with `// ---- MOCK AUTH ----` / `// ---- END MOCK AUTH ----` comments;
swap that block for a real API or [NextAuth](https://authjs.dev) call and
nothing else needs to change, since every consumer only depends on
`useAuth()`'s `{ user, isLoading, login, logout }` shape. Session state is a
JSON blob in `localStorage` (key `deltra_auth_session`) — there's no real
token/cookie, so treat this as a UI scaffold, not a security boundary.

`components/auth/RequireAuth.tsx` is a reusable guard for protected routes.
It takes an optional `role` prop: with no session it redirects to
`redirectTo` (default `/login`); with the wrong role, it sends the visitor to
the area they *do* have access to (`/dashboard` or `/admin`) instead of
bouncing between login screens. `/dashboard` uses `role="customer"`, `/admin`
uses `role="admin" redirectTo="/admin/login"`.

## Admin area (demo)

- **`/admin/login`** — separate, visually-distinguished admin sign-in. Demo
  credentials: `admin@deltra.com` / `admin123`.
- **`/admin`** — protected (admin role only):
  - **Add a package** — pick a customer (by name/account code), tracking
    number, merchant, description, weight (auto-calculates the shipping cost
    live from the same rate config the customer-facing calculator uses),
    date received, and initial status.
  - **All packages table** — every package across every customer, with an
    inline status dropdown per row.

Adding a package or changing its status **automatically** pushes a
notification into that customer's Messages (see `lib/data-store.tsx`) and
shows a success toast — the admin never has to remember to notify separately.
A `// TODO: real email/SMS notification would be sent here` comment marks
where that would plug into a real provider.

**Important limitation (by design, for this demo):** packages and messages
live in `lib/data-store.tsx`, a React Context backed by `localStorage`. That
means admin changes show up in the customer dashboard *within the same
browser*, but there's no real backend — a real admin and a real customer on
different devices won't see each other's changes until this is swapped for
an actual database. Every mutation point is marked
`// TODO: replace with a real backend + database call`.

## Shipping rate calculator / Get a Quote

`components/dashboard/RateCalculator.tsx` is a single shared component
rendered both on the public **`/quote`** page (linked from the nav) and inside
`/dashboard`. All the math is centralized in
[`lib/quote-config.ts`](lib/quote-config.ts):

- `CURRENCY` / `RATE_PER_LB` — currently `J$600` per pound.
- `ROUND_UP_WEIGHT` — toggle for "round up to the next whole pound" (on by
  default, standard courier behavior).
- `SHIPPING_METHOD_MULTIPLIERS` — Standard Air (×1, default), Express (×1.5),
  Sea (×0.6).

Every displayed shipping cost (the calculator, admin's add-package form, each
package card) calls `calculateShippingCost()` from this one file, so changing
the rate anywhere changes it everywhere.

## Folder structure

```
app/
  layout.tsx              Root layout: Poppins font, AuthProvider, DataStoreProvider,
                          SmoothScrollProvider, CustomCursor, Noise — global across all routes
  (marketing)/
    layout.tsx             Header + <main> + Footer — marketing chrome
    page.tsx               Assembles all home page sections in order
    quote/page.tsx          Public "Get a Quote" page (RateCalculator)
  login/page.tsx           Customer login (no marketing chrome)
  dashboard/page.tsx        Protected customer portal (no marketing chrome)
  admin/
    login/page.tsx          Admin login (no marketing chrome)
    page.tsx                Protected admin dashboard (no marketing chrome)
  globals.css             Tailwind directives, CSS variables, global utilities
components/
  layout/
    Header.tsx            Sticky nav (mixes #anchor scroll-links and real /routes),
                          transparent→solid on scroll, mobile menu
    Footer.tsx             Multi-column footer, newsletter form, oversized wordmark
    SmoothScrollProvider.tsx  Lenis + GSAP ScrollTrigger wiring (see comments)
  auth/
    RequireAuth.tsx        Client guard: optional `role`, redirects appropriately
  dashboard/
    DashboardHeader.tsx    Simplified customer header: logo, name/avatar, logout
    AccountSummaryCard.tsx, AccountActionsCard.tsx, PackageSummaryCard.tsx,
    OverseasAddressCard.tsx, ActionRow.tsx    The 4 portal summary cards
    PackageCard.tsx        Shipment row: badge, progress bar, expandable timeline
    RateCalculator.tsx     Shared rate calculator (dashboard + /quote)
  admin/
    AdminHeader.tsx, AddPackageForm.tsx, PackagesTable.tsx
  ui/                   Small reusable interaction primitives
    Wordmark.tsx        Single source of truth for the brand name/logo text
    CustomCursor.tsx    Grows + labels on [data-cursor-hover]; see Cursor behavior below
    MagneticButton.tsx  Cursor-following button, handles anchor smooth-scroll + /routes
    ScrollReveal.tsx    Generic fade/slide-in-on-scroll wrapper (supports stagger)
    SplitText.tsx       Word-by-word masked reveal for the hero headline
    Counter.tsx         Count-up-on-scroll-into-view number
    Marquee.tsx         Infinite horizontal marquee (client logos / terms)
    ServiceIcon.tsx     Inline line-art icon set for the Services grid
    StatusTimeline.tsx  Shared step timeline (light variant for TrackShipment,
                        dark variant for the dashboard's dark cards)
    Toast.tsx           Auto-dismissing confirmation banner (dashboard stubs + admin)
    Noise.tsx           Tasteful fixed film-grain overlay
  sections/             One component per home-page section (Hero, Services, ...)
lib/
  data.ts               Marketing page placeholder copy/content
  dashboard-data.ts      Package/status/branch/customer/address types + mock seed data
  data-store.tsx         Shared mock "database" (packages + messages) — see Admin area above
  quote-config.ts        Single-source rate/currency/method config — see Rate calculator above
  auth-context.tsx      Mock AuthProvider / useAuth, role-aware (see Customer portal above)
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

The palette is a **red/black identity**: `navy-950` is true black
(`#000000`), `navy-900` is the dark-gray card surface (`#1A1A1A`), `accent` is
the vibrant red primary (`#FF2E2E`, used for buttons/links/key highlights),
and `gold` — despite the name, kept for minimal call-site churn — is now a
red-orange secondary accent (`#FF6538`) used for smaller/decorative accents.
See the comments at the top of `tailwind.config.ts` for the full role
breakdown. Two deliberate exceptions to the red/black system: a small
semantic red for the login form's error state, and green for the "Delivered"
package status badge — both chosen for accessible, unambiguous meaning rather
than brand decoration.

Fluid display type scale (`text-display-xl` down to `text-display-sm`) is
defined in `tailwind.config.ts` using `clamp()` so headings scale smoothly
between mobile and desktop without breakpoint-specific overrides.

## Signature interactions — where to find them

- **Custom cursor** — `components/ui/CustomCursor.tsx`. Mark any element with
  `data-cursor-hover="Label"` to grow the cursor and show a label on hover.
  Disabled on touch devices and when `prefers-reduced-motion` is set. See
  [Cursor behavior](#cursor-behavior) below for the details that make it
  reliable rather than just decorative.
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
- **Shared status timeline** — `components/ui/StatusTimeline.tsx`. Used by
  the public `TrackShipment` widget (`variant="light"`, the default) and the
  dashboard's package cards (`variant="dark"`) so both stay visually
  consistent with the card they sit on.
- **Smooth scrolling** — `components/layout/SmoothScrollProvider.tsx` wires
  Lenis to GSAP's ticker and keeps ScrollTrigger in sync. In development only,
  the active instance is exposed at `window.__lenis` for debugging.

## Cursor behavior

Three things make the custom cursor (`components/ui/CustomCursor.tsx`)
reliable rather than just decorative:

1. **Never blocks a click** — the cursor element is `pointer-events-none`, so
   it's purely visual regardless of what's under the pointer.
2. **Form fields keep a real text caret** — `app/globals.css` scopes the
   `cursor: none` override so it excludes `input`/`textarea`/
   `[contenteditable]` (which get `cursor: text`) and `select`/checkboxes/
   radios (which get `cursor: pointer`). Only links/buttons/generic content
   hand cursor duties fully to the custom dot.
3. **No stuck/frozen position** — the dot fades out on `pointerleave` from the
   document (e.g. moving over a cross-origin `<iframe>`, or out of the browser
   window) and back in on the next real pointer position, since
   `pointermove` never fires while the pointer is outside the top-level
   document — without this it would otherwise freeze at its last known spot.

Disabled entirely on touch devices (`(hover: none), (pointer: coarse)`) and
when `prefers-reduced-motion` is set, falling back to the normal system
cursor in both cases.

## Accessibility & motion

- All signature motion (cursor, magnetic pull, parallax, pinned scroll,
  Lenis itself, the login screens' entrance) is gated behind a
  `useReducedMotion()` check and falls back to plain, static layouts.
- `app/globals.css` also sets a blanket `@media (prefers-reduced-motion: reduce)`
  rule that collapses any remaining CSS transitions/animations.
- Sections use semantic landmarks (`header`, `main`, `footer`, `nav`, `section`),
  headings are hierarchical, and interactive controls have `aria-label`s where
  their visible text isn't sufficient (icon-only buttons, carousel controls,
  the password show/hide toggle).
- Package cards, action rows, and the admin table's status control all use
  real `<button>`/`<select>` elements (not `div`s with `onClick`), so
  everything is keyboard-operable with a visible focus state.
- All images go through `next/image` with descriptive `alt` text.

## Placeholder content & TODOs

Everything here is realistic placeholder copy for a fictional brand — swap it
out before shipping:

- **Brand name/logo** — centralized in `components/ui/Wordmark.tsx`.
- **All marketing copy, stats, service descriptions, testimonials, process
  steps** — centralized in `lib/data.ts`.
- **`public/images/feature-*.svg`** — abstract placeholder art standing in for
  real photography; each has a visible "TODO: replace…" label baked into the
  image itself. Referenced from `lib/data.ts` → `FEATURES`.
- **Tracking widget** — `components/sections/TrackShipment.tsx` uses mock
  client-side data (`lib/data.ts` → `TRACKING_DATA`); wire up to a real
  tracking API when available.
- **Dashboard packages, branches, customers, overseas address** —
  `lib/dashboard-data.ts` (static seed/shape) and `lib/data-store.tsx` (live
  mutable state); swap for real API responses — types are already in place.
- **Shipping rate** — `lib/quote-config.ts`; update `RATE_PER_LB`, `CURRENCY`,
  or the method multipliers in this one file.
- **Auth & roles** — `lib/auth-context.tsx`; see
  [Customer portal (demo)](#customer-portal-demo) and
  [Admin area (demo)](#admin-area-demo).
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
