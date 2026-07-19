// Single source of truth for contact details shown across the site —
// update here, not at individual call sites.

// Canonical origin for auth email links (redirectTo/emailRedirectTo) and OG
// metadata — never build these from window.location.origin, since Supabase
// only honors a redirectTo that's on its Redirect URLs allow-list and falls
// back to the dashboard's Site URL otherwise; a fixed value here also avoids
// www vs non-www ambiguity.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const CONTACT_EMAIL = "deltralogistics8@gmail.com";
export const CONTACT_PHONE = "876-775-2874";
export const CONTACT_PHONE_E164 = "+18767752874";

export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;
export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE_E164}`;
export const WHATSAPP_URL = `https://wa.me/${CONTACT_PHONE_E164.replace("+", "")}`;
