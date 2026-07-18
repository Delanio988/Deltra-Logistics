// Single source of truth for contact details shown across the site —
// update here, not at individual call sites.
export const CONTACT_EMAIL = "deltralogistics8@gmail.com";
export const CONTACT_PHONE = "876-775-2874";
export const CONTACT_PHONE_E164 = "+18767752874";

export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;
export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE_E164}`;
export const WHATSAPP_URL = `https://wa.me/${CONTACT_PHONE_E164.replace("+", "")}`;
