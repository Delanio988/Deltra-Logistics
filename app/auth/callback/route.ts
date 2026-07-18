import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Landing point for every emailed auth link — signup confirmation, password
 *  reset, and (later) OAuth. Exchanges the one-time `code` for a real session
 *  cookie, then forwards to wherever the link said to go next. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
