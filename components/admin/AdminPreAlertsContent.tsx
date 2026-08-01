"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PreAlertMatchRow from "@/components/admin/PreAlertMatchRow";
import Toast from "@/components/ui/Toast";
import { matchPreAlert } from "@/lib/actions/pre-alerts";
import type { PreAlertWithCustomer, UnmatchedPackageForMatching } from "@/lib/pre-alerts";

export default function AdminPreAlertsContent({
  preAlerts,
  unmatchedPackages,
}: {
  preAlerts: PreAlertWithCustomer[];
  unmatchedPackages: UnmatchedPackageForMatching[];
}) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleMatch = async (preAlertId: string, packageId: string, trackingNumber: string) => {
    const result = await matchPreAlert({ preAlertId, packageId });
    if (result.success) {
      setToastMessage(`Matched pre-alert ${trackingNumber} to the received package.`);
      router.refresh();
    } else {
      setToastMessage(result.error);
    }
  };

  return (
    <>
      <div className="mt-10 space-y-4">
        {preAlerts.length === 0 ? (
          <div className="rounded-2xl border border-fg/8 bg-surface p-8 text-center text-sm text-fg/50 shadow-card">
            No pre-alerts awaiting a match.
          </div>
        ) : (
          preAlerts.map((preAlert) => (
            <PreAlertMatchRow
              key={preAlert.id}
              preAlert={preAlert}
              candidatePackages={unmatchedPackages.filter((pkg) => pkg.customerId === preAlert.customerId)}
              onMatch={(packageId) => handleMatch(preAlert.id, packageId, preAlert.trackingNumber)}
            />
          ))
        )}
      </div>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  );
}
