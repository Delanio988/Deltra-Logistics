import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPreAlertsContent from "@/components/admin/AdminPreAlertsContent";
import ScrollReveal from "@/components/ui/ScrollReveal";
import BackButton from "@/components/ui/BackButton";
import { getAllPendingPreAlertsWithCustomer, getUnmatchedPackagesForMatching } from "@/lib/pre-alerts-data";

export default async function AdminPreAlertsPage() {
  const [preAlerts, unmatchedPackages] = await Promise.all([
    getAllPendingPreAlertsWithCustomer(),
    getUnmatchedPackagesForMatching(),
  ]);

  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <div className="min-h-screen bg-bg">
        <AdminHeader />

        <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
          <ScrollReveal direction="none">
            <BackButton href="/admin" label="Back to dashboard" className="-ml-3" />
            <h1 className="mt-4 text-display-sm font-extrabold text-fg">Pre-Alerts</h1>
            <p className="mt-2 text-fg/60">Match incoming pre-alerts to received packages.</p>
          </ScrollReveal>

          <AdminPreAlertsContent preAlerts={preAlerts} unmatchedPackages={unmatchedPackages} />
        </main>
      </div>
    </RequireAuth>
  );
}
