// profiles.phone is free-text at signup ("{country.dial} {digits}", e.g.
// "+1 8765550110") — never normalized server-side, so it may contain
// spaces/dashes/parens after the dial code (see lib/notifications/sms.ts's
// looksLikeE164 guard for the same caveat). Everything here works off a
// digits-only version rather than assuming a clean format.

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Formats a stored phone string for display. Recognizes the common NANP
 *  case (11 digits starting with "1", or a bare 10-digit number — covers
 *  every "+1" country in lib/countries.ts, which is all of them except the
 *  UK) as "+1 876-XXX-XXXX". Anything else falls back to the original,
 *  lightly trimmed, rather than guessing at a format we can't confirm. */
export function formatPhoneDisplay(phone: string): string {
  const digits = digitsOnly(phone);

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length === 10) {
    return `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return phone.trim();
}

/** `tel:` links want a leading "+" and nothing else. */
export function telHref(phone: string): string {
  return `tel:+${digitsOnly(phone)}`;
}

/** wa.me wants the full international number, digits only, no leading "+". */
export function whatsAppHref(phone: string): string {
  return `https://wa.me/${digitsOnly(phone)}`;
}
