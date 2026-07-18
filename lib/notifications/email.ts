import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function isEmailConfigured(): boolean {
  return Boolean(resend && process.env.EMAIL_FROM);
}

/** No-ops (logs and returns) when RESEND_API_KEY/EMAIL_FROM aren't
 *  configured, so every call site stays safe to call unconditionally. */
export async function sendEmail(input: { to: string; subject: string; text: string }): Promise<void> {
  if (!resend || !process.env.EMAIL_FROM) {
    console.info(`[email] Not configured — skipped "${input.subject}" to ${input.to}`);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  } catch (error) {
    console.error("[email] Failed to send notification:", error);
  }
}
