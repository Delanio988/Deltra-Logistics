import type { TrackingStatus } from "@/lib/data";
import { formatShippingName, type FormatShippingNameResult } from "@/lib/formatShippingName";

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
  "Arrived at Local Branch": "Cleared customs and arrived in Jamaica, ready for delivery or pickup",
  "Ready for Pickup": "Ready — we'll arrange delivery or a pickup time with you",
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
  phone: string | null;
};

// No physical branch/storefront — every package is delivered or picked up by
// arrangement within this area. See lib/siteConfig.ts for the contact number.
export const SERVICE_AREA = "Montego Bay area";

export type OverseasAddress = {
  /** Auto-shortened "{Name}-{Code}" string — see lib/formatShippingName.ts.
   *  The account code portion is always complete; only the name shortens. */
  name: string;
  /** Full detail behind `name` (which shortening step was used, whether it
   *  still overflows the limit) so the UI can show the live character
   *  count and "why" note next to it. */
  nameResult: FormatShippingNameResult;
  accountCode: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  service: string;
};

const WAREHOUSE = {
  addressLine1: "5587 NW 72nd Ave",
  city: "Miami",
  region: "FL",
  regionFull: "Florida",
  postalCode: "33166",
  country: "USA",
  countryFull: "United States",
};

/** Generous default for the general "ships to most stores" address — most
 *  retailers don't enforce anything like SHEIN's 34-character limit, so
 *  shortening should essentially never kick in here for a real name. */
const GENERAL_NAME_CHAR_LIMIT = 60;

export function getOverseasAddress(firstName: string, lastName: string, accountCode: string): OverseasAddress {
  const nameResult = formatShippingName(firstName, lastName, accountCode, GENERAL_NAME_CHAR_LIMIT, "-");
  return {
    name: nameResult.value,
    nameResult,
    accountCode,
    addressLine1: WAREHOUSE.addressLine1,
    city: WAREHOUSE.city,
    region: WAREHOUSE.region,
    postalCode: WAREHOUSE.postalCode,
    country: WAREHOUSE.country,
    service: "Standard Air",
  };
}

// ============================================================
// Retailer-specific address formats
// ============================================================
// Most stores accept the general format above as-is. A handful have their
// own checkout quirks (name-field limits, different address-line layouts)
// that need a dedicated set of fields — each gets an entry here, keyed by
// retailer id, so adding another one later is just another key + config.
// Only build an entry for a retailer once its actual checkout constraints
// are known — don't invent quirks speculatively.

export type RetailerAddressField = {
  label: string;
  value: string;
};

export type RetailerCustomerInput = {
  firstName: string;
  lastName: string;
  accountCode: string;
};

export type RetailerId = "shein";

export type RetailerAddressFormat = {
  /** Tab label shown in the UI. */
  label: string;
  /** Combined "{Name}-{Code}" character limit this retailer enforces. */
  nameCharLimit: number;
  /** Character joining the shortened name to the account code. Configurable
   *  per retailer in case one rejects hyphens — defaults to "-". The
   *  account code's own characters are never touched either way. */
  nameSeparator?: string;
  /** The rest of the address fields (everything except Name), in display order. */
  getAddressFields: () => RetailerAddressField[];
};

function getSheinAddressFields(): RetailerAddressField[] {
  return [
    { label: "Address Line 1", value: WAREHOUSE.addressLine1 },
    { label: "City", value: WAREHOUSE.city },
    { label: "State", value: WAREHOUSE.regionFull },
    { label: "Zip Code", value: WAREHOUSE.postalCode },
    { label: "Country", value: WAREHOUSE.countryFull },
  ];
}

export const RETAILER_ADDRESS_FORMATS: Record<RetailerId, RetailerAddressFormat> = {
  shein: {
    label: "SHEIN",
    nameCharLimit: 34,
    nameSeparator: "-",
    getAddressFields: getSheinAddressFields,
  },
};
