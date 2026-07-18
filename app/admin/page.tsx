import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import AddPackageForm from "@/components/admin/AddPackageForm";
import PackagesTable from "@/components/admin/PackagesTable";
import AdminDashboardBadges from "@/components/admin/AdminDashboardBadges";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getAllPackagesWithCustomer, getCustomerPickerList } from "@/lib/packages";
import { getAllInvoicesWithCustomer } from "@/lib/invoices-data";
import { getAllBillsWithCustomer } from "@/lib/billing-data";

export default async function AdminPage() {
  const [packages, customers, invoices, bills] = await Promise.all([
    getAllPackagesWithCustomer(),
    getCustomerPickerList(),
    getAllInvoicesWithCustomer(),
    getAllBillsWithCustomer(),
  ]);
  const pendingInvoiceCount = invoices.filter((inv) => inv.status === "pending").length;
  const billsAwaitingCollectionCount = bills.filter((b) => b.status !== "paid").length;

  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <div className="min-h-screen bg-bg">
        <AdminHeader />

        <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
          <ScrollReveal direction="none">
            <h1 className="text-display-sm font-extrabold text-fg">Warehouse dashboard</h1>
            <p className="mt-2 text-fg/60">Add packages and keep customers updated.</p>
            <AdminDashboardBadges pendingInvoiceCount={pendingInvoiceCount} billsAwaitingCollectionCount={billsAwaitingCollectionCount} />
          </ScrollReveal>

          <section className="mt-10">
            <AddPackageForm customers={customers} />
          </section>

          <section className="mt-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-fg/50">All Packages</h2>
            <div className="mt-4">
              <PackagesTable packages={packages} invoices={invoices} />
            </div>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}
