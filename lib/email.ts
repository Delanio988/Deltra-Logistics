// Generic branded-email sender, isolated to this one file so switching
// providers later (e.g. to a dedicated transactional service once package
// volume outgrows Gmail's usual ~500/day sending ceiling) means rewriting
// only sendEmail() here — lib/email-templates.ts and every call site stay
// untouched. This is a separate system from lib/notify.ts's plain-text
// Resend/Twilio notifications (in-app message + generic email/SMS on every
// status change) — these are additional, richer, branded HTML emails sent
// only at the two package-lifecycle moments that warrant them.

import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

export function isGmailEmailConfigured(): boolean {
  return Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);
}

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!cachedTransporter) {
    // nodemailer's "gmail" service preset handles Gmail's host/port/TLS
    // details — an App Password (not the account's real login password) is
    // required here, which itself requires 2-Step Verification to be on.
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return cachedTransporter;
}

// Gmail's standard account sending ceiling is ~500 messages/day. This isn't
// enforced (we still attempt every send and let Gmail be the actual source
// of truth), but a loud log line as volume approaches that ceiling means a
// sudden wave of send failures shows up as a warning first, not a mystery.
const DAILY_VOLUME_WARNING_THRESHOLD = 450;
let sentCount = 0;
let sentCountDayKey = "";

function trackDailyVolumeAndWarn(): void {
  const todayKey = new Date().toISOString().slice(0, 10);
  if (sentCountDayKey !== todayKey) {
    sentCountDayKey = todayKey;
    sentCount = 0;
  }
  sentCount += 1;
  if (sentCount === DAILY_VOLUME_WARNING_THRESHOLD) {
    console.warn(
      `[email] Approaching Gmail's ~500/day sending ceiling (${sentCount} sent so far today, this process only — restarts reset the count). Consider migrating to a dedicated transactional provider if volume keeps growing.`
    );
  }
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Plain-text fallback — required for deliverability and for clients that
   *  don't render HTML. */
  text: string;
};

export type SendEmailResult = { success: true } | { success: false; error: string };

/**
 * Sends one branded email via Gmail SMTP. Never throws — a missing/invalid
 * config or a failed send both resolve to `{ success: false, error }`, since
 * every call site treats email as best-effort and must never block or fail
 * the admin action that triggered it.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!isGmailEmailConfigured()) {
    console.warn(
      `[email] GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping send to ${input.to} ("${input.subject}"). Email is built and ready, just waiting on credentials.`
    );
    return { success: false, error: "Gmail credentials not configured" };
  }

  try {
    await getTransporter().sendMail({
      from: `"Deltra Logistics" <${GMAIL_USER}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    trackDailyVolumeAndWarn();
    console.info(`[email] Sent "${input.subject}" to ${input.to}.`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[email] Failed to send "${input.subject}" to ${input.to}: ${message}`);
    return { success: false, error: message };
  }
}
