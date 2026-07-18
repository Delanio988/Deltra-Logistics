import RequireAuth from "@/components/auth/RequireAuth";
import AdminBillingContent from "@/components/admin/AdminBillingContent";
import { getAllBillsWithCustomer } from "@/lib/billing-data";
import { getAllPackagesWithCustomer, getCustomerPickerList } from "@/lib/packages";

export default async function AdminBillingPage() {
  const [bills, packages, customers] = await Promise.all([
    getAllBillsWithCustomer(),
    getAllPackagesWithCustomer(),
    getCustomerPickerList(),
  ]);

  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <AdminBillingContent bills={bills} packages={packages} customers={customers} />
    </RequireAuth>
  );
}
