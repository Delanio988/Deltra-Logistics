// Deltra-branded HTML email templates. Hand-rolled inline-styled,
// table-based markup rather than a templating framework (react-email etc.)
// — email clients (especially Outlook desktop) only reliably support a
// small, old subset of CSS, so table layout + inline styles is the safest
// baseline. Both templates share one layout (black header band with the
// logo, red accents, plain footer) so they read as one consistent system.

import { sendEmail, type SendEmailResult } from "@/lib/email";
import { formatCurrency } from "@/lib/quote-config";
import { BILL_STATUS_LABELS, type BillStatus } from "@/lib/billing";
import { SITE_URL, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/siteConfig";

const BRAND_RED = "#FF2E2E";
const BRAND_BLACK = "#0A0A0A";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEmailDate(isoDate: string): string {
  try {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/** Wraps a body-content HTML fragment in the shared branded shell: hidden
 *  preheader text, black header band + logo, white card, plain footer. */
function emailLayout({ subject, preheader, bodyHtml }: { subject: string; preheader: string; bodyHtml: string }): string {
  const logoUrl = `${SITE_URL}/deltra-logo-ondark.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
<tr>
<td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
<tr>
<td style="background-color:${BRAND_BLACK};padding:32px 24px;text-align:center;">
<img src="${logoUrl}" alt="Deltra Logistics" width="180" style="display:block;margin:0 auto;height:auto;max-width:180px;border:0;">
</td>
</tr>
<tr>
<td style="padding:32px 24px;color:${BRAND_BLACK};font-size:15px;line-height:1.5;">
${bodyHtml}
</td>
</tr>
<tr>
<td style="background-color:#f9f9f9;padding:24px;text-align:center;border-top:1px solid #eeeeee;">
<p style="margin:0 0 8px;font-size:12px;color:#666666;">Deltra Logistics — Global Shipping &amp; Logistics</p>
<p style="margin:0 0 8px;font-size:12px;color:#666666;">
<a href="mailto:${CONTACT_EMAIL}" style="color:${BRAND_RED};text-decoration:none;">${CONTACT_EMAIL}</a>
&nbsp;·&nbsp;
<a href="tel:+18767752874" style="color:${BRAND_RED};text-decoration:none;">${CONTACT_PHONE}</a>
</p>
<p style="margin:0 0 8px;font-size:12px;">
<a href="${SITE_URL}/dashboard" style="color:${BRAND_RED};text-decoration:none;">View your dashboard</a>
</p>
<p style="margin:0;font-size:11px;color:#999999;">You're receiving this transactional email because you have an active Deltra Logistics account.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function statusBadge(label: string): string {
  return `<span style="display:inline-block;padding:6px 14px;border-radius:999px;background-color:${BRAND_RED};color:#ffffff;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(
    label
  )}</span>`;
}

function detailRow(label: string, value: string, isLast = false): string {
  const borderStyle = isLast ? "" : "border-bottom:1px solid #eeeeee;";
  return `<tr>
<td style="padding:10px 0;${borderStyle}font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(label)}</td>
<td style="padding:10px 0;${borderStyle}font-size:14px;color:${BRAND_BLACK};text-align:right;">${escapeHtml(value)}</td>
</tr>`;
}

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr>
<td style="border-radius:999px;background-color:${BRAND_RED};">
<a href="${url}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(
    label
  )}</a>
</td>
</tr>
</table>`;
}

// ============================================================
// Email A — Package Received
// ============================================================

export type PackageReceivedEmailInput = {
  firstName: string;
  trackingNumber: string;
  merchant: string;
  description: string;
  weightLb: number;
  dateReceived: string;
  invoiceRequired: boolean;
};

export function buildPackageReceivedEmailContent(input: PackageReceivedEmailInput) {
  const subject = `Your package has arrived — ${input.trackingNumber}`;
  const preheader = `${input.trackingNumber} (${input.merchant}) just landed at our US warehouse.`;
  const greeting = input.firstName ? `Hi ${escapeHtml(input.firstName)},` : "Hi there,";

  const detailsTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
${detailRow("Tracking Number", input.trackingNumber)}
${detailRow("Merchant", input.merchant)}
${detailRow("Description", input.description)}
${detailRow("Weight", `${input.weightLb} lb`)}
${detailRow("Date Received", formatEmailDate(input.dateReceived), true)}
</table>`;

  const invoiceNote = input.invoiceRequired
    ? `<p style="margin:20px 0 0;padding:14px 16px;background-color:#fff5f0;border-left:3px solid ${BRAND_RED};border-radius:4px;font-size:13px;color:${BRAND_BLACK};">
This package needs a purchase invoice before it can clear customs. Upload it from your dashboard when you get a chance.
</p>
${ctaButton("Upload Invoice", `${SITE_URL}/dashboard/invoices`)}`
    : "";

  const bodyHtml = `<h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:${BRAND_BLACK};">Your package has arrived!</h1>
<p style="margin:0 0 20px;color:#666666;">${greeting} great news — your package just reached our US warehouse.</p>
${statusBadge("Received at Warehouse")}
${detailsTable}
<p style="margin:20px 0 0;color:#444444;">Here's what happens next: we'll process it, then move it on toward Jamaica. You'll get another update the moment it's ready for pickup or delivery.</p>
${ctaButton("View Dashboard", `${SITE_URL}/dashboard`)}
${invoiceNote}`;

  const html = emailLayout({ subject, preheader, bodyHtml });

  const text = [
    `Your package has arrived!`,
    ``,
    `${greeting.replace(/&amp;/g, "&")} Your package just reached our US warehouse.`,
    ``,
    `Tracking Number: ${input.trackingNumber}`,
    `Merchant: ${input.merchant}`,
    `Description: ${input.description}`,
    `Weight: ${input.weightLb} lb`,
    `Date Received: ${formatEmailDate(input.dateReceived)}`,
    ``,
    `We'll let you know as it moves through processing and is ready for pickup or delivery.`,
    input.invoiceRequired ? `\nThis package needs a purchase invoice before it can clear customs: ${SITE_URL}/dashboard/invoices` : "",
    ``,
    `View your dashboard: ${SITE_URL}/dashboard`,
    ``,
    `— Deltra Logistics · ${CONTACT_EMAIL} · ${CONTACT_PHONE}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, preheader, html, text };
}

export async function sendPackageReceivedEmail(input: PackageReceivedEmailInput & { to: string }): Promise<SendEmailResult> {
  const { subject, html, text } = buildPackageReceivedEmailContent(input);
  return sendEmail({ to: input.to, subject, html, text });
}

// ============================================================
// Email B — Package Ready (invoice-style)
// ============================================================

export type PackageReadyEmailLineItem = { label: string; amount: number };

export type PackageReadyEmailInput = {
  firstName: string;
  trackingNumber: string;
  merchant: string;
  description: string;
  weightLb: number;
  lineItems: PackageReadyEmailLineItem[];
  total: number;
  amountPaid: number;
  status: BillStatus;
  dueDate: string;
};

export function buildPackageReadyEmailContent(input: PackageReadyEmailInput) {
  const subject = `Your package is ready — ${input.trackingNumber}`;
  const preheader = `${input.trackingNumber} is ready, and your bill is available for ${formatCurrency(input.total)}.`;
  const greeting = input.firstName ? `Hi ${escapeHtml(input.firstName)},` : "Hi there,";
  const balanceDue = Math.max(0, input.total - input.amountPaid);

  const lineItemRows = input.lineItems
    .map(
      (item) => `<tr>
<td style="padding:10px 16px;font-size:13px;color:${BRAND_BLACK};border-bottom:1px solid #f0f0f0;">${escapeHtml(item.label)}</td>
<td style="padding:10px 16px;font-size:13px;color:${BRAND_BLACK};text-align:right;border-bottom:1px solid #f0f0f0;">${formatCurrency(item.amount)}</td>
</tr>`
    )
    .join("");

  const priceTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #eeeeee;border-radius:8px;overflow:hidden;">
<tr style="background-color:#f9f9f9;">
<td style="padding:10px 16px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;color:#999999;">Item</td>
<td style="padding:10px 16px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;color:#999999;text-align:right;">Amount</td>
</tr>
${lineItemRows}
<tr>
<td style="padding:14px 16px;font-size:15px;font-weight:800;color:${BRAND_BLACK};border-top:2px solid ${BRAND_BLACK};">Total Due</td>
<td style="padding:14px 16px;font-size:15px;font-weight:800;color:${BRAND_RED};text-align:right;border-top:2px solid ${BRAND_BLACK};">${formatCurrency(
    input.total
  )}</td>
</tr>
${
  input.amountPaid > 0
    ? `<tr>
<td style="padding:0 16px 14px;font-size:12px;color:#666666;">Paid so far</td>
<td style="padding:0 16px 14px;font-size:12px;color:#666666;text-align:right;">${formatCurrency(input.amountPaid)}</td>
</tr>
<tr>
<td style="padding:0 16px 14px;font-size:13px;font-weight:bold;color:${BRAND_BLACK};">Balance Due</td>
<td style="padding:0 16px 14px;font-size:13px;font-weight:bold;color:${BRAND_BLACK};text-align:right;">${formatCurrency(balanceDue)}</td>
</tr>`
    : ""
}
</table>`;

  const detailsTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
${detailRow("Tracking Number", input.trackingNumber)}
${detailRow("Merchant", input.merchant)}
${detailRow("Description", input.description)}
${detailRow("Weight", `${input.weightLb} lb`, true)}
</table>`;

  const bodyHtml = `<h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:${BRAND_BLACK};">Your package is ready!</h1>
<p style="margin:0 0 20px;color:#666666;">${greeting} your package has cleared and is ready for pickup or delivery.</p>
${statusBadge("Ready for Pickup")}
${detailsTable}
<h2 style="margin:24px 0 4px;font-size:14px;font-weight:bold;color:${BRAND_BLACK};text-transform:uppercase;letter-spacing:0.05em;">Bill breakdown</h2>
${priceTable}
<p style="margin:0 0 4px;font-size:13px;color:#666666;">Payment status: <strong style="color:${BRAND_BLACK};">${BILL_STATUS_LABELS[input.status]}</strong></p>
<p style="margin:0 0 20px;font-size:13px;color:#666666;">Due date: ${formatEmailDate(input.dueDate)}</p>
${ctaButton("View & Pay Bill", `${SITE_URL}/dashboard/billing`)}
<p style="margin:20px 0 0;color:#444444;">No branch to visit — we deliver and arrange pickup throughout the Montego Bay area. Reach out any time to arrange yours.</p>`;

  const html = emailLayout({ subject, preheader, bodyHtml });

  const text = [
    `Your package is ready!`,
    ``,
    `${greeting.replace(/&amp;/g, "&")} Your package has cleared and is ready for pickup or delivery.`,
    ``,
    `Tracking Number: ${input.trackingNumber}`,
    `Merchant: ${input.merchant}`,
    `Description: ${input.description}`,
    `Weight: ${input.weightLb} lb`,
    ``,
    `Bill breakdown:`,
    ...input.lineItems.map((item) => `  ${item.label}: ${formatCurrency(item.amount)}`),
    `  Total Due: ${formatCurrency(input.total)}`,
    input.amountPaid > 0 ? `  Paid so far: ${formatCurrency(input.amountPaid)}\n  Balance Due: ${formatCurrency(balanceDue)}` : "",
    ``,
    `Payment status: ${BILL_STATUS_LABELS[input.status]}`,
    `Due date: ${formatEmailDate(input.dueDate)}`,
    ``,
    `View & pay your bill: ${SITE_URL}/dashboard/billing`,
    ``,
    `No branch to visit — we deliver and arrange pickup throughout the Montego Bay area.`,
    ``,
    `— Deltra Logistics · ${CONTACT_EMAIL} · ${CONTACT_PHONE}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, preheader, html, text };
}

export async function sendPackageReadyEmail(input: PackageReadyEmailInput & { to: string }): Promise<SendEmailResult> {
  const { subject, html, text } = buildPackageReadyEmailContent(input);
  return sendEmail({ to: input.to, subject, html, text });
}
