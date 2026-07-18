import RequireAuth from "@/components/auth/RequireAuth";
import InvoicesPageContent from "@/components/dashboard/InvoicesPageContent";
import { getPackagesForCurrentUser } from "@/lib/packages";
import { getInvoicesForCurrentUser } from "@/lib/invoices-data";

export default async function InvoicesPage() {
  const [packages, invoices] = await Promise.all([getPackagesForCurrentUser(), getInvoicesForCurrentUser()]);

  return (
    <RequireAuth role="customer">
      <InvoicesPageContent packages={packages} invoices={invoices} />
    </RequireAuth>
  );
}
