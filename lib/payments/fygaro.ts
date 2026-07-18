import crypto from "node:crypto";

/** Fygaro Links (payment buttons) hosted checkout — see
 *  https://help.fygaro.com/en-us/article/fygaro-links-integration-api-h78p9y/
 *  The merchant configures a Payment Button in the Fygaro dashboard and gets
 *  a static URL; a specific charge is requested by appending amount/reference
 *  query params to that URL and redirecting the customer there. */

export function isFygaroConfigured(): boolean {
  return Boolean(process.env.FYGARO_PAYMENT_BUTTON_URL);
}

export function isFygaroWebhookConfigured(): boolean {
  return Boolean(process.env.FYGARO_WEBHOOK_SECRET);
}

type FygaroCheckoutInput = {
  /** Amount in JMD, up to 2 decimals per Fygaro's documented format. */
  amount: number;
  /** Our own identifier — a bill id, or "topup:<profileId>" for a wallet
   *  top-up — echoed back as customReference in the webhook payload. */
  reference: string;
  note?: string;
};

/** Returns null when FYGARO_PAYMENT_BUTTON_URL isn't configured — callers
 *  must fall back to the existing "coming soon" UI in that case rather than
 *  redirect to an empty URL. */
export function buildFygaroCheckoutUrl({ amount, reference, note }: FygaroCheckoutInput): string | null {
  const baseUrl = process.env.FYGARO_PAYMENT_BUTTON_URL;
  if (!baseUrl) return null;

  const url = new URL(baseUrl);
  url.searchParams.set("amount", amount.toFixed(2));
  url.searchParams.set("client_reference", reference);
  if (note) url.searchParams.set("client_note", note);
  return url.toString();
}

const MAX_SIGNATURE_AGE_SECONDS = 300;

/**
 * Verifies a Fygaro webhook per their documented Hook scheme: the
 * `Fygaro-Signature` header carries `t=<unix timestamp>,v1=<hex hmac>`, and
 * the hash is HMAC-SHA256(secret, `${timestamp}.${rawBody}`). Rejects stale
 * signatures (replay protection) and uses a constant-time comparison.
 * rawBody must be the exact, unparsed request body — never re-serialized
 * JSON, which can byte-for-byte differ from what was signed.
 */
export function verifyFygaroSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;

  const parts: Record<string, string> = {};
  for (const kv of signatureHeader.split(",")) {
    const [key, value] = kv.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }

  const timestamp = parts.t;
  const providedHash = parts.v1;
  if (!timestamp || !providedHash) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > MAX_SIGNATURE_AGE_SECONDS) return false;

  const expectedHex = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

  const expectedBuf = Buffer.from(expectedHex, "hex");
  const providedBuf = Buffer.from(providedHash, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export const WALLET_TOPUP_REFERENCE_PREFIX = "topup:";

export function buildWalletTopupReference(customerId: string): string {
  return `${WALLET_TOPUP_REFERENCE_PREFIX}${customerId}`;
}
