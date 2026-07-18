import RequireAuth from "@/components/auth/RequireAuth";
import BillingPageContent from "@/components/dashboard/BillingPageContent";
import { getPackagesForCurrentUser } from "@/lib/packages";
import { getBillsForCurrentUser, getTransactionsForCurrentUser, getWalletBalanceForCurrentUser } from "@/lib/billing-data";
import { isFygaroConfigured } from "@/lib/payments/fygaro";

export default async function BillingPage() {
  const [packages, bills, transactions, walletBalance] = await Promise.all([
    getPackagesForCurrentUser(),
    getBillsForCurrentUser(),
    getTransactionsForCurrentUser(),
    getWalletBalanceForCurrentUser(),
  ]);

  return (
    <RequireAuth role="customer">
      <BillingPageContent
        packages={packages}
        bills={bills}
        transactions={transactions}
        walletBalance={walletBalance}
        hostedCheckoutEnabled={isFygaroConfigured()}
      />
    </RequireAuth>
  );
}
