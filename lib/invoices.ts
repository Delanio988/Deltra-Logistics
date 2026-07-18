import type { Package } from "@/lib/dashboard-data";

export type InvoiceStatus = "pending" | "approved" | "rejected";

export type InvoiceFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Real Supabase Storage object path — absent only for pre-migration seed
   *  rows that were never really uploaded anywhere. */
  storagePath?: string;
  /** A local blob preview (mid-upload) or a server-generated signed URL
   *  (already-saved files). Absent means "preview unavailable" in the UI. */
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
