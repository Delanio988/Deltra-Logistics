// Invoice types, seed data, and pure helpers. Live/mutable invoice state
// lives in lib/data-store.tsx (seeded from INITIAL_INVOICES below) — this
// file only holds shape/types/seed content, same split as lib/dashboard-data.ts.

import type { Package } from "@/lib/dashboard-data";

export type InvoiceStatus = "pending" | "approved" | "rejected";

export type InvoiceFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Object URL for this browser session only. Missing after a reload (or
   *  for the seed/demo entries below, which were never really uploaded) —
   *  the UI shows a "preview unavailable" note rather than a broken image. */
  url?: string;
  uploadedAt?: string;
};

export type InvoiceStatusHistoryEntry = {
  status: InvoiceStatus;
  at: string;
  note?: string;
};

export type Invoice = {
  id: string;
  /** Matches Package.id — one invoice per package (re-upload replaces it). */
  packageId: string;
  accountCode: string;
  files: InvoiceFile[];
  merchant?: string;
  value?: number;
  currency?: string;
  status: InvoiceStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  /** Display-only "last touched" timestamp — not used for ordering logic
   *  (see hasUnreviewedChanges below for why). */
  updatedAt?: string;
  /** True once a customer edits an already-pending invoice (add/remove/
   *  replace a file) — this is how the admin finds out a submission
   *  changed without a full resubmit, since this app has no admin-facing
   *  notification inbox. Cleared on fresh submit/resubmit and on review. */
  hasUnreviewedChanges?: boolean;
  /** Audit trail shown in the invoice lightbox's "History" disclosure. */
  statusHistory: InvoiceStatusHistoryEntry[];
};

export const INVOICE_CURRENCIES = ["USD", "JMD", "GBP", "CAD"] as const;
export type InvoiceCurrency = (typeof INVOICE_CURRENCIES)[number];

// Seed data for lib/data-store.tsx — demonstrates every review state without
// requiring manual setup. See lib/dashboard-data.ts for the matching
// invoiceRequired flags on pkg-1/pkg-2/pkg-3/pkg-5.
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    packageId: "pkg-1",
    accountCode: "DLT1789-A",
    files: [
      { id: "inv-1-file-1", name: "amazon-receipt.pdf", size: 214_000, type: "application/pdf", uploadedAt: "Jul 6, 2026" },
    ],
    merchant: "Amazon",
    value: 142.5,
    currency: "USD",
    status: "pending",
    submittedAt: "Jul 6, 2026",
    statusHistory: [{ status: "pending", at: "Jul 6, 2026", note: "Submitted" }],
  },
  {
    id: "inv-2",
    packageId: "pkg-3",
    accountCode: "DLT1789-A",
    files: [
      { id: "inv-2-file-1", name: "shein-order.jpg", size: 892_000, type: "image/jpeg", uploadedAt: "Jun 30, 2026" },
    ],
    merchant: "Shein",
    value: 38.2,
    currency: "USD",
    status: "approved",
    submittedAt: "Jun 30, 2026",
    reviewedAt: "Jul 1, 2026",
    statusHistory: [
      { status: "pending", at: "Jun 30, 2026", note: "Submitted" },
      { status: "approved", at: "Jul 1, 2026", note: "Approved" },
    ],
  },
  {
    id: "inv-3",
    packageId: "pkg-5",
    accountCode: "DLT1789-A",
    files: [
      { id: "inv-3-file-1", name: "wayfair-invoice.png", size: 1_240_000, type: "image/png", uploadedAt: "Jul 8, 2026" },
    ],
    merchant: "Wayfair",
    value: 76,
    currency: "USD",
    status: "rejected",
    rejectionReason: "Image is blurry — the total amount isn't legible. Please re-upload a clearer photo.",
    submittedAt: "Jul 8, 2026",
    reviewedAt: "Jul 9, 2026",
    statusHistory: [
      { status: "pending", at: "Jul 8, 2026", note: "Submitted" },
      { status: "rejected", at: "Jul 9, 2026", note: "Image is blurry — the total amount isn't legible. Please re-upload a clearer photo." },
    ],
  },
];

export function getInvoiceForPackage(invoices: Invoice[], packageId: string): Invoice | undefined {
  return invoices.find((inv) => inv.packageId === packageId);
}

/** The next invoice still awaiting review, for the admin lightbox's
 *  "Next pending invoice" control — skips the one currently open. */
export function getNextPendingInvoice(invoices: Invoice[], currentInvoiceId: string): Invoice | undefined {
  return invoices.find((inv) => inv.status === "pending" && inv.id !== currentInvoiceId);
}

/**
 * Packages the customer still needs to act on: flagged as requiring an
 * invoice, and either nothing has been submitted yet or the last submission
 * was rejected. This is the single source of truth for the
 * AccountActionsCard badge count — it intentionally counts rejected
 * packages too, since they still need the customer's attention.
 */
export function getPackagesNeedingInvoiceAction(packages: Package[], invoices: Invoice[]): Package[] {
  return packages.filter((pkg) => {
    if (!pkg.invoiceRequired) return false;
    const invoice = getInvoiceForPackage(invoices, pkg.id);
    return !invoice || invoice.status === "rejected";
  });
}

/**
 * Packages with no invoice submitted at all yet — narrower than
 * getPackagesNeedingInvoiceAction. Used for the /dashboard/invoices page's
 * "Awaiting invoice" section specifically, so a rejected package (which
 * already has a submission) shows once, under "Submitted invoices" with its
 * rejection reason and re-upload action, instead of appearing in both lists.
 */
export function getPackagesAwaitingFirstUpload(packages: Package[], invoices: Invoice[]): Package[] {
  return packages.filter((pkg) => pkg.invoiceRequired && !getInvoiceForPackage(invoices, pkg.id));
}

export function formatInvoiceValue(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
