"use server";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cloudflare's published "always passes" test secret key — pairs with the
// test site key in components/ui/TurnstileWidget.tsx, so verification is
// never silently skipped in local dev; it just checks against Cloudflare's
// dummy pair instead of a real one until TURNSTILE_SECRET_KEY is set.
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

type VerifyResult = { success: true } | { success: false; error: string };

/** Verifies a Turnstile token server-side before an account is created.
 *  A client-side widget alone provides no protection — bots simply skip it
 *  — so this call is the actual gate; see lib/auth-context.tsx's register(). */
export async function verifyTurnstileToken(token: string): Promise<VerifyResult> {
  if (!token) return { success: false, error: "Please complete the verification challenge." };

  const secretKey = process.env.TURNSTILE_SECRET_KEY || TURNSTILE_TEST_SECRET_KEY;

  let response: Response;
  try {
    response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });
  } catch {
    return { success: false, error: "Couldn't verify right now — please try again." };
  }

  const data = await response.json().catch(() => null);
  if (!data?.success) {
    return { success: false, error: "Verification failed — please try again." };
  }
  return { success: true };
}
