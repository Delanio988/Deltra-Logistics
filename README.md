# Deltra Logistics — Freight-Forwarding Portal

A US→Jamaica package-forwarding platform: customers shop at US retailers,
ship to their personal Deltra address, and track packages through to pickup
at a Jamaican branch. Includes a marketing site, a customer portal
(`/login` → `/dashboard`), and a staff admin area (`/admin/login` → `/admin`).

Backed by **Supabase** (Postgres + Auth + Storage, RLS-enforced), with real
payments (Fygaro hosted checkout) and notifications (Resend email, Twilio
SMS) — see [Backend](#backend) below. Built with Next.js 15 (App Router),
TypeScript, Tailwind CSS, Framer Motion, GSAP/ScrollTrigger, and Lenis smooth
scrolling.

## Getting started

1. Copy `.env.example` to `.env.local` and fill in at least the Supabase
   variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) — the app needs a real Supabase project to
   run against, even locally. Everything else in `.env.example` is optional
   and no-ops safely when left blank (see [Backend](#backend)).
2. Run the migrations under `supabase/migrations` (or via the Supabase MCP/
   CLI) against your project if you haven't already.
3. Seed your first admin account:
   ```bash
   node --env-file=.env.local scripts/seed-admin.mjs
   ```
   (requires `INITIAL_ADMIN_EMAIL`/`INITIAL_ADMIN_PASSWORD` set in `.env.local`)
4. ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for deploying to Vercel + pointing a
Hostinger (or any registrar's) domain at it, plus a full pre-launch checklist.

## Tech stack

| Concern | Library |
| --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript |
| Backend | Supabase (Postgres, Auth, Storage), RLS-enforced |
| Payments | Fygaro hosted checkout (webhook-confirmed) |
| Notifications | Resend (email), Twilio (SMS) |
| Rate limiting | Upstash Redis |
| Bot protection | Cloudflare Turnstile |
| Styling | Tailwind CSS 3 (custom theme, no default palette) |
| Component/page animation | Framer Motion |
| Scroll-driven reveals & pinned sections | GSAP + ScrollTrigger |
| Smooth scrolling | [`lenis`](https://github.com/darkroomengineering/lenis) |
| Font | Poppins via `next/font/google` |

> **Note on Lenis:** the original brief referenced `@studio-freight/lenis`.
> That package was renamed — the same library now ships as
> [`lenis`](https://www.npmjs.com/package/lenis) under the darkroom.engineering
> org. This project uses the current package; the API is unchanged.

## Customer portal

- **`/login`** — real Supabase Auth email/password sign-in, with a working
  "Forgot password?" reset flow.
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

Auth is real Supabase Auth — see [`lib/auth-context.tsx`](lib/auth-context.tsx).
Signup creates a real `auth.users` row; a Postgres trigger
(`private.handle_new_user()`) provisions the matching `profiles` row, a
generated `DLT####-A` account code, and a zero wallet balance in the same
transaction. Session state lives in an httpOnly cookie managed by
`@supabase/ssr`, refreshed on every request by `middleware.ts` — there's no
`localStorage` session and no client-trusted role field; `role` is read from
`profiles` on every login via a query that Postgres RLS enforces.

`components/auth/RequireAuth.tsx` is a reusable guard for protected routes.
It takes an optional `role` prop: with no session it redirects to
`redirectTo` (default `/login`); with the wrong role, it sends the visitor to
the area they *do* have access to (`/dashboard` or `/admin`) instead of
bouncing between login screens. `/dashboard` uses `role="customer"`, `/admin`
uses `role="admin" redirectTo="/admin/login"`.

## Admin area

- **`/admin/login`** — separate, visually-distinguished admin sign-in. There
  is no public admin signup — the first admin is created with
  `scripts/seed-admin.mjs` (service-role key, run manually), and further
  admins are promoted via the `admin_set_role()` Postgres RPC. A successful
  login whose `profiles.role` isn't `admin` is immediately signed back out.
- **`/admin`** — protected (admin role only):
  - **Add a package** — pick a customer (by name/account code), tracking
    number, merchant, description, weight (auto-calculates the shipping cost
    live from the same rate config the customer-facing calculator uses),
    date received, and initial status.
  - **All packages table** — every package across every customer, with an
    inline status dropdown per row.

Adding a package or changing its status **automatically** pushes a
notification into that customer's Messages, and shows a success toast — the
admin never has to remember to notify separately. See
[Backend](#backend) below for how this is wired end-to-end: every mutation
goes through a Server Action, is enforced by RLS, and (when Resend/Twilio are
configured) also sends a real email/SMS via `lib/notify.ts`.

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

## Backend

- **Auth** — `lib/auth-context.tsx` wraps real Supabase Auth (email/password,
  verification, password reset). Session lives in an httpOnly cookie via
  `@supabase/ssr`, refreshed by `middleware.ts` on every request, which also
  enforces `/dashboard` (customer) and `/admin` (admin) route protection
  server-side before a protected page ever renders.
- **Data** — Server Components read directly from Supabase (`lib/packages.ts`,
  `lib/invoices-data.ts`, `lib/billing-data.ts`, `lib/messages-data.ts`);
  mutations go through Server Actions in `lib/actions/*.ts`, each zod-validated
  and rate-limited (`lib/rate-limit.ts`, via Upstash Redis). RLS is the actual
  enforcement boundary — every policy is defined in the migrations under
  `supabase/migrations/`, which is the source of truth for the schema.
- **Money-touching writes** (wallet payments, admin cash confirmation, wallet
  top-ups/refunds, Fygaro webhook confirmation) go through `SECURITY DEFINER`
  Postgres RPCs rather than direct table writes, so locking/idempotency lives
  in the database next to the data it protects.
- **File storage** — invoice uploads go straight from the browser to a private
  Supabase Storage bucket (RLS-scoped by path), with signed URLs generated
  server-side for previews.
- **Payments** — `lib/payments/fygaro.ts` builds Fygaro hosted-checkout
  redirect URLs and verifies webhook signatures;
  `app/api/webhooks/fygaro/route.ts` receives payment confirmations. No-ops to
  a "coming soon" UI state until `FYGARO_PAYMENT_BUTTON_URL`/
  `FYGARO_WEBHOOK_SECRET` are configured.
- **Notifications** — `lib/notify.ts` wraps every in-app message with a real
  email (Resend, `lib/notifications/email.ts`) and SMS (Twilio,
  `lib/notifications/sms.ts`) send, each no-op-ing safely when unconfigured.

See [DEPLOYMENT.md](DEPLOYMENT.md) for environment variables and the full
deployment/pre-launch checklist.

## Folder structure

```
app/
  layout.tsx              Root layout: Poppins font, AuthProvider, SeasonalProvider,
                          SmoothScrollProvider, CustomCursor, Noise — global across all routes
  (marketing)/
    layout.tsx             Header + <main> + Footer — marketing chrome
    page.tsx               Assembles all home page sections in order
    quote/page.tsx          Public "Get a Quote" page (RateCalculator)
  login/, signup/, reset-password/, admin/login/   Auth pages (no marketing chrome)
  dashboard/               Protected customer portal (page.tsx, invoices/, billing/)
  admin/                   Protected admin area (page.tsx, invoices/, billing/, theme/)
  auth/callback/route.ts   Supabase email-link callback (verification, password reset)
  api/webhooks/fygaro/route.ts   Fygaro payment-confirmation webhook
  globals.css             Tailwind directives, CSS variables, global utilities
components/
  layout/
    Header.tsx            Sticky nav (mixes #anchor scroll-links and real /routes),
                          transparent→solid on scroll, mobile menu
    Footer.tsx             Multi-column footer, oversized wordmark
    SmoothScrollProvider.tsx  Lenis + GSAP ScrollTrigger wiring (see comments)
  auth/
    RequireAuth.tsx        Client guard: optional `role`, redirects appropriately
  dashboard/, admin/        Portal cards/tables/forms + their *Content.tsx client
                           wrappers (data comes in as props from a Server Component page)
  ui/                   Small reusable interaction primitives
    Wordmark.tsx        Single source of truth for the brand name/logo text
    CustomCursor.tsx    Grows + labels on [data-cursor-hover]; see Cursor behavior below
    MagneticButton.tsx  Cursor-following button, handles anchor smooth-scroll + /routes
    ScrollReveal.tsx    Generic fade/slide-in-on-scroll wrapper (supports stagger)
    SplitText.tsx       Word-by-word masked reveal for the hero headline
    Marquee.tsx         Infinite horizontal marquee (used by FloatingRetailers)
    ServiceIcon.tsx     Inline line-art icon set for the Services grid
    StatusTimeline.tsx  Shared step timeline (light variant for TrackShipment,
                        dark variant for the dashboard's dark cards)
    Toast.tsx           Auto-dismissing confirmation banner
    Noise.tsx           Tasteful fixed film-grain overlay
  sections/             One component per home-page section (Hero, Services, ...)
lib/
  supabase/             client.ts (browser), server.ts (Server Components/Actions),
                        service-role.ts (webhooks only), middleware.ts (session refresh + route guard)
  actions/              Server Actions — packages.ts, invoices.ts, billing.ts, settings.ts,
                        messages.ts, auth-helpers.ts (shared requireAdmin())
  payments/fygaro.ts     Hosted-checkout URL builder + webhook signature verification
  notifications/         email.ts (Resend), sms.ts (Twilio)
  notify.ts              Wraps an in-app message with a real email/SMS send
  packages.ts, invoices-data.ts, billing-data.ts, messages-data.ts   Server Component data reads
  database.types.ts      Generated Supabase types — regenerate after any schema change
  data.ts               Marketing page copy/content
  dashboard-data.ts      Package/status/branch/address types (+ Branch/Warehouse config)
  quote-config.ts        Single-source rate/currency/method config — see Rate calculator above
  auth-context.tsx      Real Supabase AuthProvider / useAuth, role-aware
  rate-limit.ts          Upstash-backed sliding-window rate limiter for Server Actions
  utils.ts              cn() className helper
  useReducedMotion.ts   Reactive prefers-reduced-motion hook
supabase/migrations/    Applied schema history — see Backend above
scripts/seed-admin.mjs  One-off first-admin creation (service-role key, run manually)
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
- **Infinite marquee** — `components/ui/Marquee.tsx`, used by `FloatingRetailers.tsx`
  for the "shop these US retailers" logo strip.
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

## Remaining placeholder content

Everything customer/data-facing now runs on the real Supabase backend — see
[Backend](#backend). What's left is business-specific detail that only you
can fill in (no fake data has been left in its place):

- **Warehouse address** — `lib/dashboard-data.ts`'s `WAREHOUSE` (US receiving
  address) is still a placeholder value shown to real customers — update
  with your real one. Real contact email/phone live in `lib/siteConfig.ts`.
- **Legal pages** — `app/terms/page.tsx` and `app/privacy/page.tsx` are
  drafted, substantive policies (not stubs), but contain bracketed
  placeholders (`[Company legal name]`, `[Governing law jurisdiction]`, etc.)
  and should be reviewed by a lawyer before you rely on them.
- **Shipping rate** — `lib/quote-config.ts`; update `RATE_PER_LB`, `CURRENCY`,
  or the method multipliers in this one file.
- **Fygaro/Resend/Twilio/Turnstile credentials** — see
  [DEPLOYMENT.md](DEPLOYMENT.md); each feature no-ops safely until its real
  keys are set.

## Notes on Tailwind version

The project pins **Tailwind CSS v3** (classic `tailwind.config.ts` + PostCSS
setup) rather than v4, since the brief's custom-theme approach (colors,
`fontSize`, `keyframes`, etc. via `theme.extend`) maps directly onto v3's
config file. If you migrate to v4 later, the same tokens move into an
`@theme` block in `globals.css`.
