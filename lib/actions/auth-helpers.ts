import { createClient } from "@/lib/supabase/server";

/** Shared admin gate for Server Actions — RLS is the real enforcement (every
 *  admin-only table/column grant already rejects a non-admin write), this
 *  just turns that into a clean error message instead of a raw Postgres one. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, isAdmin: false as const };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, user, isAdmin: profile?.role === "admin" };
}
