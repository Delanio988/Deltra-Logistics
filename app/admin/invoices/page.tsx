import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminInvoicesContent from "@/components/admin/AdminInvoicesContent";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getAllPackagesWithCustomer } from "@/lib/packages";
import { getAllInvoicesWithCustomer } from "@/lib/invoices-data";

export default async function AdminInvoicesPage() {
  const [invoices, packages] = await Promise.all([getAllInvoicesWithCustomer(), getAllPackagesWithCustomer()]);

  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <div className="min-h-screen bg-bg">
        <AdminHeader />

        <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
          <ScrollReveal direction="none">
            <h1 className="text-display-sm font-extrabold text-fg">Invoices</h1>
            <p className="mt-2 text-fg/60">Review customer-submitted invoices and approve or reject them.</p>
          </ScrollReveal>

          <AdminInvoicesContent invoices={invoices} packages={packages} />
        </main>
      </div>
    </RequireAuth>
  );
}
