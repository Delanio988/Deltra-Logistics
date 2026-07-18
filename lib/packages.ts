import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import type { Customer, Package, PackageStatus } from "@/lib/dashboard-data";

export type PackageWithCustomer = Package & { customerName: string };

function formatDbDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapPackageRow(row: Tables<"packages">, accountCode: string): Package {
  return {
    id: row.id,
    accountCode,
    trackingNumber: row.tracking_number,
    merchant: row.merchant,
    description: row.description,
    weightLb: row.weight_lb,
    dateReceived: formatDbDate(row.date_received),
    status: row.status as PackageStatus,
    invoiceRequired: row.invoice_required,
  };
}

/** RLS scopes this to the caller's own rows — no explicit filter needed. */
export async function getPackagesForCurrentUser(): Promise<Package[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*, profiles(account_code)")
    .order("date_received", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapPackageRow(row, row.profiles?.account_code ?? ""));
}

/** Admin view — every package, with the owning customer's display name. */
export async function getAllPackagesWithCustomer(): Promise<PackageWithCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*, profiles(first_name, last_name, account_code)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const profile = row.profiles;
    const accountCode = profile?.account_code ?? "";
    const customerName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : accountCode;
    return { ...mapPackageRow(row, accountCode), customerName };
  });
}

/** Real customers for the admin's "add a package" picker. */
export async function getCustomerPickerList(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, account_code, email")
    .eq("role", "customer")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.account_code)
    .map((row) => ({
      name: `${row.first_name} ${row.last_name}`.trim(),
      accountCode: row.account_code as string,
      email: row.email,
    }));
}
