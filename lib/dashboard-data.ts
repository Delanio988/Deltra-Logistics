import type { TrackingStatus } from "@/lib/data";
import { CONTACT_PHONE } from "@/lib/siteConfig";

export type PackageStatus =
  | "Pre-Alerted"
  | "Received at Warehouse"
  | "In Transit"
  | "Arrived at Local Branch"
  | "Ready for Pickup"
  | "Delivered";

// Order matters — it's also the timeline step order for <StatusTimeline>.
export const PACKAGE_STATUSES: PackageStatus[] = [
  "Pre-Alerted",
  "Received at Warehouse",
  "In Transit",
  "Arrived at Local Branch",
  "Ready for Pickup",
  "Delivered",
];

export const STATUS_STEP_INDEX = Object.fromEntries(
  PACKAGE_STATUSES.map((status, i) => [status, i])
) as Record<PackageStatus, number>;

const STEP_DESCRIPTIONS: Record<PackageStatus, string> = {
  "Pre-Alerted": "Customer submitted a pre-alert for this shipment",
  "Received at Warehouse": "Package received and logged at our US warehouse",
  "In Transit": "Departed the warehouse en route to Jamaica",
  "Arrived at Local Branch": "Cleared customs and arrived at your local branch",
  "Ready for Pickup": "Ready for collection at your local branch",
  Delivered: "Collected by / delivered to the customer",
};

export function buildPackageTimeline(status: PackageStatus): TrackingStatus[] {
  const currentIndex = STATUS_STEP_INDEX[status];
  return PACKAGE_STATUSES.map((label, i) => ({
    label,
    description: STEP_DESCRIPTIONS[label],
    timestamp: i <= currentIndex ? "Completed" : "Pending",
  }));
}

export type Package = {
  id: string;
  /** Which customer this belongs to — matches Customer.accountCode. */
  accountCode: string;
  trackingNumber: string;
  merchant: string;
  description: string;
  weightLb: number;
  dateReceived: string;
  status: PackageStatus;
  /** Admin-set flag — customs requires a purchase invoice before this
   *  package can be cleared. Review state (submitted/pending/approved/
   *  rejected) lives in the separate Invoice record — see lib/invoices.ts. */
  invoiceRequired?: boolean;
};

export type Customer = {
  name: string;
  accountCode: string;
  email: string;
};

export type Branch = {
  name: string;
  phone: string;
};

// Same contact number for both branches for now — update lib/siteConfig.ts if
// each branch gets its own direct line.
export const BRANCHES: Branch[] = [
  { name: "Montego Bay — Fairview", phone: CONTACT_PHONE },
  { name: "Montego Bay — Half Moon", phone: CONTACT_PHONE },
];

export type OverseasAddress = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  service: string;
};

const WAREHOUSE = {
  addressLine1: "2099 NW 141st Street",
  city: "Opa-locka",
  region: "FL",
  postalCode: "33054",
  country: "USA",
};

export function getOverseasAddress(customerName: string, accountCode: string): OverseasAddress {
  return {
    name: `${customerName}-${accountCode}`,
    addressLine1: WAREHOUSE.addressLine1,
    addressLine2: `Unit 8 ${accountCode}`,
    city: WAREHOUSE.city,
    region: WAREHOUSE.region,
    postalCode: WAREHOUSE.postalCode,
    country: WAREHOUSE.country,
    service: "Standard Air",
  };
}
