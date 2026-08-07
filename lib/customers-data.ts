import { createClient } from "@/lib/supabase/server";

export type CustomerWithStats = {
  id: string;
  name: string;
  accountCode: string;
  email: string;
  phone: string | null;
  packageCount: number;
};

/** Every customer, with a package count, for the admin's dedicated
 *  Customers directory — the go-to place to look someone up and reach them
 *  directly, without digging through packages/invoices/billing first. */
export async function getAllCustomersWithStats(): Promise<CustomerWithStats[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, account_code, email, phone, packages!packages_customer_id_fkey(count)")
    .eq("role", "customer")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getAllCustomersWithStats]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    accountCode: row.account_code ?? "",
    email: row.email,
    phone: row.phone,
    packageCount: row.packages?.[0]?.count ?? 0,
  }));
}
