// One-off admin seeding script — run manually, never from the app itself.
// Usage:  node --env-file=.env.local scripts/seed-admin.mjs
//
// Creates an auth user (pre-confirmed, no verification email) and elevates
// its profile to role='admin' directly via the service-role key, which
// bypasses RLS. This is the only way to create the *first* admin — the
// admin_set_role() RPC requires an existing admin caller, and public signup
// hardcodes role='customer' by design.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.INITIAL_ADMIN_EMAIL;
const password = process.env.INITIAL_ADMIN_PASSWORD;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}
if (!email || !password) {
  console.error("Missing INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD in the environment.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("INITIAL_ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: "Admin", last_name: "User" },
  });

  if (createError) {
    console.error(`Failed to create auth user: ${createError.message}`);
    process.exit(1);
  }

  const userId = created.user.id;

  // handle_new_user() has already run by this point (same insert transaction)
  // and created a role='customer' profile row — elevate it now.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (updateError) {
    console.error(`User created but failed to set admin role: ${updateError.message}`);
    console.error(`Fix manually: update profiles set role = 'admin' where id = '${userId}';`);
    process.exit(1);
  }

  console.log(`Admin account created: ${email}`);
  console.log("Rotate this password after first login — INITIAL_ADMIN_PASSWORD was just used in plaintext.");
}

main();
