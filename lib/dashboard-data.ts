// Mock freight-forwarding portal data. Structured so it's a drop-in swap for
// a real API later — replace the arrays below with fetched data and every
// consuming component keeps working. Live/mutable package + message state
// lives in lib/data-store.tsx (seeded from INITIAL_PACKAGES below); this file
// only holds static shape/types/seed content.

import type { TrackingStatus } from "@/lib/data";

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

// Seed data for lib/data-store.tsx. TODO: replace with a real API fetch.
export const INITIAL_PACKAGES: Package[] = [
  {
    id: "pkg-1",
    accountCode: "DLT1789-A",
    trackingNumber: "DL48213097",
    merchant: "Amazon",
    description: "Electronics — 2 boxes",
    weightLb: 6,
    dateReceived: "Jul 5, 2026",
    status: "In Transit",
    invoiceRequired: true,
  },
  {
    id: "pkg-2",
    accountCode: "DLT1789-A",
    trackingNumber: "DL29104456",
    merchant: "Best Buy",
    description: "Kitchen appliance — 1 box",
    weightLb: 14,
    dateReceived: "Jul 3, 2026",
    status: "Arrived at Local Branch",
    invoiceRequired: true,
  },
  {
    id: "pkg-3",
    accountCode: "DLT1789-A",
    trackingNumber: "DL77350281",
    merchant: "Shein",
    description: "Clothing — 1 poly bag",
    weightLb: 3,
    dateReceived: "Jun 29, 2026",
    status: "Ready for Pickup",
    invoiceRequired: true,
  },
  {
    id: "pkg-4",
    accountCode: "DLT1789-A",
    trackingNumber: "DL10293847",
    merchant: "Walmart",
    description: "Home goods — 1 crate",
    weightLb: 22,
    dateReceived: "Jun 20, 2026",
    status: "Delivered",
  },
  {
    id: "pkg-5",
    accountCode: "DLT1789-A",
    trackingNumber: "DL63581920",
    merchant: "Wayfair",
    description: "Furniture part — 1 box",
    weightLb: 9,
    dateReceived: "Jul 8, 2026",
    status: "Pre-Alerted",
    invoiceRequired: true,
  },
  {
    id: "pkg-6",
    accountCode: "DLT2044-B",
    trackingNumber: "DL39472105",
    merchant: "Target",
    description: "Toys — 1 box",
    weightLb: 5,
    dateReceived: "Jul 6, 2026",
    status: "Received at Warehouse",
  },
];

export type Customer = {
  name: string;
  accountCode: string;
  email: string;
};

// Mock customer directory used by the admin's "add package" picker.
export const CUSTOMERS: Customer[] = [
  { name: "Alex Morgan", accountCode: "DLT1789-A", email: "demo@deltra.com" },
  { name: "Jordan Reid", accountCode: "DLT2044-B", email: "jordan.reid@example.com" },
  { name: "Simone Clarke", accountCode: "DLT3310-C", email: "simone.clarke@example.com" },
];

export type Branch = {
  name: string;
  phone: string;
};

// TODO: mock branches — replace with the customer's real assigned branch from the API.
export const BRANCHES: Branch[] = [
  { name: "Montego Bay — Fairview", phone: "+1 (876) 555-0110" },
  { name: "Montego Bay — Half Moon", phone: "+1 (876) 555-0142" },
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

// TODO: mock warehouse — replace with the customer's real assigned facility from the API.
const WAREHOUSE = {
  addressLine1: "1400 Corbin St",
  city: "Elizabeth",
  region: "NJ",
  postalCode: "07201",
  country: "USA",
};

export function getOverseasAddress(customerName: string, accountCode: string): OverseasAddress {
  return {
    name: `${customerName} ${accountCode}`,
    addressLine1: WAREHOUSE.addressLine1,
    addressLine2: `Suite ${accountCode}`,
    city: WAREHOUSE.city,
    region: WAREHOUSE.region,
    postalCode: WAREHOUSE.postalCode,
    country: WAREHOUSE.country,
    service: "Standard Air",
  };
}
