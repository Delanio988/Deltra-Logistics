# Deploying an update (Hostinger Node.js hosting)

This assumes a Hostinger plan with actual Node.js app support (not shared
static hosting) — a "Node.js" application type in hPanel, or a VPS where you
manage the process yourself. The exact panel screens differ between
Hostinger's managed Node.js hosting and a bare VPS; adapt the button/menu
names below to whatever your specific plan shows, but the underlying steps
are the same either way.

## One-time setup (do once, verify it's still correct if anything's failing)

1. **Node version** — this app needs Node 18.18+ (Next.js 15's minimum) or
   Node 20+. In hPanel's Node.js app settings (or `node -v` over SSH on a
   VPS), confirm it's not pinned to an older version.
2. **Environment variables** — set these wherever your plan exposes them
   (hPanel's Node.js app "Environment Variables" section, or a `.env.production`
   file / PM2 ecosystem file on a VPS — never commit real values to the repo):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```
   Plus any of the payment/email/SMS keys from `.env.example` you've
   configured (Fygaro, Resend, Twilio). **`NEXT_PUBLIC_*` values are baked
   into the build** — if you change one, you must rebuild (step 4 below),
   not just restart.
3. **Process manager** — if you're on a VPS running PM2 directly, set it to
   survive reboots once:
   ```
   pm2 startup
   pm2 save
   ```
   Hostinger's managed Node.js hosting handles this for you automatically.

## Every deploy

1. **Get the latest code onto the server.**
   ```
   git pull origin main
   ```
   (Or use Hostinger's "Deploy"/"Sync" button if you're using their Git
   integration instead of pulling by hand.)

2. **Install dependencies** (needed whenever `package.json` changed):
   ```
   npm install
   ```

3. **Build.** This must happen on the server (or you upload the built
   `.next` folder) — running `next start` without a fresh build fails
   immediately with "Could not find a production build":
   ```
   npm run build
   ```

4. **Restart the app process** so it picks up the new build:
   - Hostinger managed Node.js hosting: use the "Restart" button in the
     app's panel.
   - PM2 directly: `pm2 restart deltra-logistics` (or whatever name you
     registered it under — `pm2 status` lists running processes).

5. **Verify** (see the checklist below) before considering the deploy done.

## Verifying a deploy actually worked

- `pm2 status` (or the hPanel app status) shows the process **running**, not
  crash-looping or restarting repeatedly.
- `pm2 logs deltra-logistics --lines 50` (or hPanel's log viewer) shows a
  clean `✓ Ready` from Next.js with no errors immediately after restart.
- Load `https://deltralogistics.com` and `https://www.deltralogistics.com`
  directly — both over HTTPS with a valid certificate, no browser warnings.
- Click through `/`, `/login`, `/signup`, `/dashboard` (while logged in),
  `/admin` (while logged in as admin) — check both light and dark mode.
- Confirm data loads (packages, invoices, billing) — this proves the
  Supabase environment variables are actually correct in production, not
  just present.

## If something's wrong after a deploy

- **Blank/500 on every page**: check the process log first — a missing or
  invalid environment variable is the single most common cause, and as of
  this app's latest commit, `lib/supabase/env.ts` throws a specific message
  naming exactly which variable is missing, rather than a generic crash.
- **"Could not find a production build"**: you restarted/started the app
  without running `npm run build` first, or the build output was deleted.
  Re-run step 3.
- **Site loads old content**: confirm `git pull` actually pulled new commits
  (`git log -1` should match GitHub's latest commit on `main`) and that you
  rebuilt afterward — a stale `.next` folder serves the previous build even
  with new source files present.
