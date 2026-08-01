import type { PackageStatus } from "@/lib/dashboard-data";

export type PreAlertStatus = "pending" | "matched" | "expired";

export type PreAlertFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Real Supabase Storage object path — what actually gets persisted. */
  storagePath?: string;
  /** A server-generated signed URL, present once resolved by lib/pre-alerts-data.ts.
   *  Absent means "preview unavailable" in the UI. */
  url?: string;
  uploadedAt?: string;
};

export type PreAlert = {
  id: string;
  merchant: string;
  trackingNumber: string;
  description: string;
  declaredValue?: number;
  currency?: string;
  status: PreAlertStatus;
  matchedPackageId?: string;
  createdAt: string;
  files: PreAlertFile[];
};

export type PreAlertWithCustomer = PreAlert & { customerId: string; customerName: string; accountCode: string };

/** A package not yet linked to any pre-alert — for the admin's match picker. */
export type UnmatchedPackageForMatching = {
  id: string;
  customerId: string;
  accountCode: string;
  trackingNumber: string;
  merchant: string;
  description: string;
  weightLb: number;
  status: PackageStatus;
};

export const PRE_ALERT_CURRENCIES = ["USD", "JMD", "GBP", "CAD"] as const;
export type PreAlertCurrency = (typeof PRE_ALERT_CURRENCIES)[number];

export function formatPreAlertValue(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
