import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/** SERVER-ONLY, no-cookie client for trusted background code (webhooks) that
 *  has no user session to read — bypasses RLS entirely via the service-role
 *  key. Never import this into anything reachable from a Server Component
 *  or Server Action triggered directly by a request; it must only be used
 *  where the caller's trust has already been established some other way
 *  (e.g. a verified webhook signature). */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
