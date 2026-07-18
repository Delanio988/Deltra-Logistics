# Deploying Deltra Logistics

This app is a Next.js 15 App Router site backed by Supabase (Auth + Postgres + Storage).
It deploys to **Vercel**, with **Hostinger** used only for domain registration/DNS —
Vercel serves the actual app.

## 1. Create the Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) and sign in (GitHub login is easiest).
2. Import `Delanio988/Deltra-Logistics` from GitHub. Vercel auto-detects Next.js —
   leave the build command (`next build`) and output settings on their defaults.
3. Before the first deploy, open **Settings → Environment Variables** and add every
   variable from `.env.example` (see the table below for which environments need
   which ones). Do this before deploying — a deploy without `NEXT_PUBLIC_SUPABASE_URL`
   etc. will build but the app won't function.
4. Click **Deploy**. Vercel builds and gives you a `*.vercel.app` URL — use that to
   verify everything works before pointing your real domain at it (see §4).

### Environment variables to set in Vercel

Set these under **Production** (and mirror the same values under **Preview** unless
noted, so preview deploys from PRs also work):

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API — **Production only, never Preview**, and never expose client-side |
| `NEXT_PUBLIC_SITE_URL` | Your real domain, e.g. `https://deltralogistics.com` (§4) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend dashboard, once you have an account |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Twilio console |
| `FYGARO_PAYMENT_BUTTON_URL`, `FYGARO_WEBHOOK_SECRET` | Fygaro dashboard (§5) |
| `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` | Only needed locally to run `scripts/seed-admin.mjs` once — don't set these in Vercel at all |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile dashboard |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash console (powers rate limiting) |

Anything left blank simply keeps that feature in its safe "not configured yet" state
(no card/bank payments, no real email/SMS) rather than breaking the build.

## 2. Point Supabase at the real domain

Supabase Auth only allows redirects to URLs you've explicitly allow-listed. In the
Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL**: your production domain, e.g. `https://deltralogistics.com`
- **Redirect URLs**: add both
  - `https://deltralogistics.com/auth/callback`
  - `https://<your-project>.vercel.app/auth/callback` (so the Vercel preview URL keeps working too)

Without this, email verification links and "Forgot password" links will fail after
you switch to the real domain.

## 3. Run the admin-seed script once

This creates your first admin account directly against production Supabase — run it
from your own machine, not from Vercel:

```
node --env-file=.env.local scripts/seed-admin.mjs
```

Make sure `.env.local` points at the **production** Supabase project (same values
you put in Vercel) and has `INITIAL_ADMIN_EMAIL`/`INITIAL_ADMIN_PASSWORD` filled in.
Log in at `/admin/login` immediately after and change the password — it briefly sat
in plaintext in your env file.

## 4. Point your Hostinger domain at Vercel

1. In Vercel: **Settings → Domains** on your project → add `deltralogistics.com`
   (and `www.deltralogistics.com` if you want both).
2. Vercel's Domains page then shows you the exact A/CNAME records to add for
   *your* domain — use those values as shown (Vercel occasionally changes the
   specific IP/CNAME target, so don't reuse values from an old guide or a
   different project).
3. In Hostinger: **Domains → DNS / Name Servers** for your domain, add those same
   records (edit existing A/CNAME records for `@` and `www` if Hostinger's default
   parking page records are already there — don't just add duplicates).
4. DNS propagation can take a few minutes to a few hours. Vercel's Domains page shows
   a green checkmark once it verifies.
5. Update `NEXT_PUBLIC_SITE_URL` in Vercel to the final domain and redeploy (or it'll
   pick it up on the next deploy) so metadata/OG tags use the real URL.
6. Re-check §2 — the Supabase redirect URLs need the final domain too.

## 5. Configure the Fygaro webhook (once you have a Fygaro account)

1. Fygaro dashboard → create a Payment Button ("Fygaro Link"). Copy its URL into
   `FYGARO_PAYMENT_BUTTON_URL`.
2. On that button's **Advanced Options**, set the **Hook URL** to:
   `https://deltralogistics.com/api/webhooks/fygaro`
3. Under **Settings → API Credentials**, pick the credential used to sign Hook
   requests and put that same secret in `FYGARO_WEBHOOK_SECRET`.
4. Fygaro's sandbox mode lets you test the full redirect → webhook → paid-bill flow
   before going live — do that before flipping `FYGARO_ENVIRONMENT` to `live`.

## 6. Post-deploy smoke test

Once DNS is live, walk through this on the real domain (not localhost):

- [ ] Homepage loads, no console errors, light/dark mode and seasonal theme toggle work
- [ ] Sign up as a new customer, confirm the verification email arrives and its link works
- [ ] Log in, dashboard loads with real (empty) data
- [ ] Admin login at `/admin/login` works with the seeded account
- [ ] Admin adds a package for a test customer; customer sees it on their dashboard
- [ ] Customer submits an invoice with a file; admin sees it in `/admin/invoices` and can approve/reject it
- [ ] A bill appears once a package hits "Ready for Pickup"; pay it from the wallet (top up first via admin)
- [ ] If Fygaro is configured: pay a bill by card, confirm the webhook marks it paid
- [ ] If Resend/Twilio are configured: confirm a real email/SMS arrives for one of the above actions

---

## Full pre-launch checklist

**Secrets & config**
- [ ] All required env vars set in Vercel Production (table in §1)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set only in Vercel/server contexts, never committed, never in a `NEXT_PUBLIC_*` var
- [ ] Supabase Auth Site URL + Redirect URLs updated to the production domain (§2)
- [ ] `NEXT_PUBLIC_SITE_URL` matches the final domain exactly (protocol + no trailing slash)

**Accounts & access**
- [ ] First admin account seeded (§3) and its password rotated after first login
- [ ] Confirmed there's no way to reach `/admin` without an admin-role account (already enforced by middleware + RLS, but worth a manual check on the live domain)

**Data & business details**
- [ ] `lib/dashboard-data.ts`'s `BRANCHES` names updated if each branch has its own direct line (both currently share the one number in `lib/siteConfig.ts`)
- [ ] `lib/dashboard-data.ts`'s `WAREHOUSE` address updated to your real US receiving address
- [ ] `lib/siteConfig.ts`'s `CONTACT_EMAIL`/`CONTACT_PHONE` confirmed as real, monitored contact points
- [ ] `app/terms/page.tsx` and `app/privacy/page.tsx` — the bracketed placeholders
      (`[Company legal name]`, `[Governing law jurisdiction]`, `[retention period]`,
      `[liability cap]`) filled in, and both pages reviewed by a lawyer before relying
      on them — they're a drafted starting point, not legal advice

**Payments & notifications**
- [ ] Fygaro sandbox flow tested end-to-end before flipping to `live` (§5)
- [ ] Resend domain verified (SPF/DKIM) so emails don't land in spam
- [ ] Twilio phone number provisioned and tested for at least one real SMS

**Security**
- [ ] Supabase advisors (`get_advisors`) show only the expected/intentional warnings — re-run after any future schema change
- [ ] Rate limiting active (Upstash Redis env vars set) — without them, `checkRateLimit` fails **open** (allows every request through with a one-time console warning, see `lib/rate-limit.ts`), so this is a real gap until configured, not just a nice-to-have
- [ ] Cloudflare Turnstile using a real site key, not the test key, on the live domain

**Final checks**
- [ ] `npm run build` clean on the exact commit being deployed
- [ ] Full smoke test (§6) run against the live production domain, not just `*.vercel.app`
