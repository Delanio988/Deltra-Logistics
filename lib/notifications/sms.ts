import twilio from "twilio";

const client =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export function isSmsConfigured(): boolean {
  return Boolean(client && process.env.TWILIO_PHONE_NUMBER);
}

/** Twilio requires E.164 (+18765550110) — profiles.phone is free-text at
 *  signup and may not be in that format, so we skip rather than guess a
 *  country code, which risks messaging the wrong number. */
function looksLikeE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/** No-ops (logs and returns) when Twilio isn't configured or the phone
 *  number isn't in E.164 format, so every call site stays safe to call
 *  unconditionally. */
export async function sendSms(input: { to: string; body: string }): Promise<void> {
  if (!client || !process.env.TWILIO_PHONE_NUMBER) {
    console.info(`[sms] Not configured — skipped message to ${input.to}`);
    return;
  }
  if (!looksLikeE164(input.to)) {
    console.info(`[sms] Skipped — "${input.to}" isn't in E.164 format`);
    return;
  }

  try {
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: input.to,
      body: input.body,
    });
  } catch (error) {
    console.error("[sms] Failed to send notification:", error);
  }
}
