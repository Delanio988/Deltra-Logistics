import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import MailboxLinkTable from "@/components/admin/MailboxLinkTable";
import OxSyncPanel from "@/components/admin/OxSyncPanel";
import OxReadOnlyView from "@/components/admin/OxReadOnlyView";
import ScrollReveal from "@/components/ui/ScrollReveal";
import BackButton from "@/components/ui/BackButton";
import { getCustomersForMailboxLinking, getOxPackagesSafe, getOxCustomersSafe } from "@/lib/ox-data";

export default async function AdminWarehousePage() {
  const [customers, packagesResult, customersResult] = await Promise.all([
    getCustomersForMailboxLinking(),
    getOxPackagesSafe(),
    getOxCustomersSafe(),
  ]);

  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <div className="min-h-screen bg-bg">
        <AdminHeader />

        <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
          <ScrollReveal direction="none">
            <BackButton href="/admin" label="Back to dashboard" className="-ml-3" />
            <h1 className="mt-4 text-display-sm font-extrabold text-fg">Warehouse sync (OX)</h1>
            <p className="mt-2 text-fg/60">
              Link customers to their Kajay Warehousing mailbox number, then import packages or push customer
              updates on demand.
            </p>
          </ScrollReveal>

          <ScrollReveal index={0} className="mt-10">
            <OxSyncPanel />
          </ScrollReveal>

          <section className="mt-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Mailbox number linking</h2>
            <div className="mt-4">
              <MailboxLinkTable customers={customers} />
            </div>
          </section>

          <section className="mt-12">
            <OxReadOnlyView
              packages={packagesResult.items}
              packagesError={packagesResult.error}
              packagesConfigured={packagesResult.configured}
              customers={customersResult.items}
              customersError={customersResult.error}
              customersConfigured={customersResult.configured}
            />
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}
