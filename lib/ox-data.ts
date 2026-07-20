import { createClient } from "@/lib/supabase/server";
import { getAllOxPackages, getOxCustomers, OxApiError, type OxPackage, type OxCustomer } from "@/lib/ox-api";

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

/** A misconfigured/unreachable OX API must not 500 the admin page — degrade
 *  to an empty list plus a visible error message instead. */
export async function getOxPackagesSafe(): Promise<{ packages: OxPackage[]; error: string | null }> {
  try {
    return { packages: await getAllOxPackages(), error: null };
  } catch (err) {
    const message = err instanceof OxApiError ? err.message : "Failed to load OX packages.";
    console.error("[getOxPackagesSafe]", message);
    return { packages: [], error: message };
  }
}

export async function getOxCustomersSafe(): Promise<{ customers: OxCustomer[]; error: string | null }> {
  try {
    return { customers: await getOxCustomers(), error: null };
  } catch (err) {
    const message = err instanceof OxApiError ? err.message : "Failed to load OX customers.";
    console.error("[getOxCustomersSafe]", message);
    return { customers: [], error: message };
  }
}
