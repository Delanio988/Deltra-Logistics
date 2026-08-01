import RequireAuth from "@/components/auth/RequireAuth";
import PreAlertsPageContent from "@/components/dashboard/PreAlertsPageContent";
import { getPreAlertsForCurrentUser } from "@/lib/pre-alerts-data";

export default async function PreAlertsPage() {
  const preAlerts = await getPreAlertsForCurrentUser();

  return (
    <RequireAuth role="customer">
      <PreAlertsPageContent preAlerts={preAlerts} />
    </RequireAuth>
  );
}
