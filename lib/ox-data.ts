import { createClient } from "@/lib/supabase/server";
import {
  getAllOxPackages,
  getOxCustomers,
  OxApiError,
  OxNotConfiguredError,
  type OxPackage,
  type OxCustomer,
} from "@/lib/ox-api";

export type MailboxLinkRow = {
  id: string;
  name: string;
  accountCode: string;
  mailboxNumber: number | null;
};

/** Every Deltra customer, for the admin's mailbox-number linking table. */
export async function getCustomersForMailboxLinking(): Promise<MailboxLinkRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, account_code, mailbox_number")
    .eq("role", "customer")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getCustomersForMailboxLinking]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    accountCode: row.account_code ?? "",
    mailboxNumber: row.mailbox_number,
  }));
}

export type OxFetchResult<T> = { items: T[]; error: string | null; configured: boolean };

/** A misconfigured/unreachable OX API must not 500 the admin page — degrade
 *  to an empty list instead. `configured: false` means env vars are missing
 *  (an admin setup gap, not a failure — no retry will fix it); `error` is
 *  only ever set for a genuine live API failure, worth retrying. */
export async function getOxPackagesSafe(): Promise<OxFetchResult<OxPackage>> {
  try {
    return { items: await getAllOxPackages(), error: null, configured: true };
  } catch (err) {
    if (err instanceof OxNotConfiguredError) return { items: [], error: null, configured: false };
    const message = err instanceof OxApiError ? err.message : "Couldn't load OX packages right now.";
    console.error("[getOxPackagesSafe]", err);
    return { items: [], error: message, configured: true };
  }
}

export async function getOxCustomersSafe(): Promise<OxFetchResult<OxCustomer>> {
  try {
    return { items: await getOxCustomers(), error: null, configured: true };
  } catch (err) {
    if (err instanceof OxNotConfiguredError) return { items: [], error: null, configured: false };
    const message = err instanceof OxApiError ? err.message : "Couldn't load OX customers right now.";
    console.error("[getOxCustomersSafe]", err);
    return { items: [], error: message, configured: true };
  }
}
