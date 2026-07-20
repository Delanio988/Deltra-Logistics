// Server-only client for the Kajay Warehousing "OX" courier API — never
// import this from a "use client" component (OX_API_KEY must stay server-side).
// Docs: base URL + endpoints below, auth via a static `x-ox-api-key` header.

import type { PackageStatus } from "@/lib/dashboard-data";

export type OxPackage = {
  trackingNo: string;
  manifestNumber: string;
  description: string;
  value: number;
  customsFee: number;
  serviceFee: number;
  weight: number;
  status: string;
  createdOn: string;
  readyDate: string | null;
  deliveredDate: string | null;
  isHalfPound: boolean;
  isExpress: boolean;
  isBarrel: boolean;
  owner: { businessName: string };
  recipient: {
    firstName: string;
    lastName: string;
    mailboxNumber: number;
  };
  invoice: {
    items: unknown[];
    amount: number;
    status: string;
    discount: number;
    created: string;
  };
};

export type OxCustomer = {
  firstName: string;
  lastName: string;
  mailboxNumber: number;
  code: string;
};

export class OxApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OxApiError";
  }
}

/** Thrown when OX_API_BASE_URL/OX_API_KEY are missing — distinct from a live
 *  API failure so callers can show "not set up yet" instead of an error, and
 *  skip offering a retry (retrying won't help until env vars are set). */
export class OxNotConfiguredError extends OxApiError {
  constructor() {
    super("This integration isn't configured yet.");
  }
}

function getConfig() {
  const baseUrl = process.env.OX_API_BASE_URL;
  const apiKey = process.env.OX_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new OxNotConfiguredError();
  }
  return { baseUrl, apiKey };
}

async function oxFetch<T>(path: string, init?: { method?: string; query?: Record<string, string>; body?: unknown }): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const url = new URL(`${baseUrl}${path}`);
  for (const [key, value] of Object.entries(init?.query ?? {})) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: init?.method ?? "GET",
      headers: {
        "x-ox-api-key": apiKey,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new OxApiError("Could not reach the OX API.");
  }

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    const message = json?.message || json?.error || `OX API request failed (${response.status}).`;
    throw new OxApiError(message);
  }
  return json as T;
}

/** Fetches every page of packages (OX paginates via limit/skip). */
export async function getAllOxPackages(): Promise<OxPackage[]> {
  const limit = 100;
  let skip = 0;
  const all: OxPackage[] = [];

  for (;;) {
    const page = await oxFetch<{ data: OxPackage[]; pagination: { total: number } }>("/OxApiKeys/packages", {
      query: { limit: String(limit), skip: String(skip) },
    });
    all.push(...page.data);
    if (page.data.length < limit || all.length >= page.pagination.total) break;
    skip += limit;
  }

  return all;
}

export async function getOxCustomers(): Promise<OxCustomer[]> {
  const page = await oxFetch<{ data: OxCustomer[] }>("/OxApiKeys/customers");
  return page.data;
}

/** Creates or updates an OX courier customer, matched by mailboxNumber. */
export async function upsertOxCustomer(input: {
  firstName: string;
  lastName: string;
  mailboxNumber: number;
}): Promise<{ customerId: string; isNew: boolean }> {
  const result = await oxFetch<{ data: { customerId: string }; isNew: boolean }>("/OxApiKeys/customer", {
    method: "POST",
    body: {
      firstName: input.firstName,
      lastName: input.lastName,
      mailboxNumber: String(input.mailboxNumber),
    },
  });
  return { customerId: result.data.customerId, isNew: result.isNew };
}

// Deliberately no wrapper for POST /OxApiKeys/remove-by-mailbox-number —
// that endpoint deletes the courier's customer record and hasn't been asked
// for; add it explicitly if/when a real deprovisioning flow is needed.

/** OX's status vocabulary isn't fully documented — only "Ready" is confirmed.
 *  Unknown values return null so callers can leave an existing Deltra status
 *  untouched rather than guess and risk corrupting a package's real state. */
export function mapOxStatusToDeltraStatus(oxStatus: string): PackageStatus | null {
  switch (oxStatus.trim().toLowerCase()) {
    case "ready":
      return "Ready for Pickup";
    case "delivered":
      return "Delivered";
    case "in transit":
    case "intransit":
      return "In Transit";
    case "received":
    case "received at warehouse":
      return "Received at Warehouse";
    default:
      return null;
  }
}
