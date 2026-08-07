import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminCustomersContent from "@/components/admin/AdminCustomersContent";
import ScrollReveal from "@/components/ui/ScrollReveal";
import BackButton from "@/components/ui/BackButton";
import { getAllCustomersWithStats } from "@/lib/customers-data";

export default async function AdminCustomersPage() {
  const customers = await getAllCustomersWithStats();

  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <div className="min-h-screen bg-bg">
        <AdminHeader />

        <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
          <ScrollReveal direction="none">
            <BackButton href="/admin" label="Back to dashboard" className="-ml-3" />
            <h1 className="mt-4 text-display-sm font-extrabold text-fg">Customers</h1>
            <p className="mt-2 text-fg/60">Search and reach any customer directly.</p>
          </ScrollReveal>

          <AdminCustomersContent customers={customers} />
        </main>
      </div>
    </RequireAuth>
  );
}
