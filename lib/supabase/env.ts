/**
 * Supabase clients throw an opaque "Invalid URL" error when
 * NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY are missing, which
 * surfaces as an unhelpful MIDDLEWARE_INVOCATION_FAILED/500 with no detail on
 * Vercel. Failing here instead gives a message that actually says what's
 * wrong, in both the server logs and (for the browser client) the console.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Missing required environment variable(s): ${missing}. Set them in your hosting provider's project settings (see .env.example) and redeploy — the app cannot connect to Supabase without them.`
    );
  }

  return { url, anonKey };
}
