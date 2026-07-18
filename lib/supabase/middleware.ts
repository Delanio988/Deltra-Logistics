import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

const CUSTOMER_PREFIX = "/dashboard";
const ADMIN_PREFIX = "/admin";
// The admin sign-in form is deliberately reachable by anyone, including a
// signed-in customer (see app/admin/login/page.tsx) — it handles its own
// role check and error messaging, so middleware must not touch it.
const ADMIN_PUBLIC_PATH = "/admin/login";

function isUnderPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Refreshes the Supabase session cookie on every request, then enforces
 *  server-side route protection for the customer dashboard and admin area —
 *  RLS remains the real data-access boundary, but redirecting before a
 *  protected page ever renders avoids a flash of empty/loading UI and closes
 *  the gap where route access relied on client-side checks alone. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Must be called to actually refresh the token — do not remove even though
  // the result isn't used directly here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = isUnderPrefix(pathname, ADMIN_PREFIX) && pathname !== ADMIN_PUBLIC_PATH && !pathname.startsWith(`${ADMIN_PUBLIC_PATH}/`);
  const isCustomerRoute = isUnderPrefix(pathname, CUSTOMER_PREFIX);

  if (!isAdminRoute && !isCustomerRoute) {
    return response;
  }

  const redirect = (to: string) => {
    const redirectResponse = NextResponse.redirect(new URL(to, request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  };

  if (!user) {
    return redirect(isAdminRoute ? "/admin/login" : "/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role;

  if (isAdminRoute && role !== "admin") {
    return redirect("/dashboard");
  }
  if (isCustomerRoute && role !== "customer") {
    return redirect("/admin");
  }

  return response;
}
