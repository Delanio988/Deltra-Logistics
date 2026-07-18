import RequireAuth from "@/components/auth/RequireAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { getPackagesForCurrentUser } from "@/lib/packages";
import { getInvoicesForCurrentUser } from "@/lib/invoices-data";
import { getMessagesForCurrentUser } from "@/lib/messages-data";
import { getBillsForCurrentUser, getWalletBalanceForCurrentUser } from "@/lib/billing-data";

export default async function DashboardPage() {
  const [packages, invoices, messages, bills, walletBalance] = await Promise.all([
    getPackagesForCurrentUser(),
    getInvoicesForCurrentUser(),
    getMessagesForCurrentUser(),
    getBillsForCurrentUser(),
    getWalletBalanceForCurrentUser(),
  ]);

  return (
    <RequireAuth role="customer">
      <div className="min-h-screen bg-bg">
        <DashboardHeader />
        <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
          <DashboardContent
            packages={packages}
            invoices={invoices}
            messages={messages}
            bills={bills}
            walletBalance={walletBalance}
          />
        </main>
      </div>
    </RequireAuth>
  );
}
