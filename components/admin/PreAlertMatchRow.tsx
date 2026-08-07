"use client";

import { useId, useState } from "react";
import { formatPreAlertValue, type PreAlertWithCustomer, type UnmatchedPackageForMatching } from "@/lib/pre-alerts";
import ContactLinks from "@/components/admin/ContactLinks";

type PreAlertMatchRowProps = {
  preAlert: PreAlertWithCustomer;
  /** Already narrowed to this pre-alert's customer's unmatched packages. */
  candidatePackages: UnmatchedPackageForMatching[];
  onMatch: (packageId: string) => void;
};

/** One row in /admin/pre-alerts: the pre-alert's details plus a picker over
 *  that same customer's received-but-unmatched packages, mirroring
 *  InvoiceReviewRow's card shape and AddPackageForm's customer <select>. */
export default function PreAlertMatchRow({ preAlert, candidatePackages, onMatch }: PreAlertMatchRowProps) {
  const pickerId = useId();
  const [selectedPackageId, setSelectedPackageId] = useState(candidatePackages[0]?.id ?? "");
  const [isMatching, setIsMatching] = useState(false);

  const handleMatch = async () => {
    if (!selectedPackageId) return;
    setIsMatching(true);
    await onMatch(selectedPackageId);
    setIsMatching(false);
  };

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-fg">{preAlert.customerName}</span>
          <ContactLinks email={preAlert.customerEmail} phone={preAlert.customerPhone} variant="compact" />
          <span className="font-mono text-sm text-fg/60">{preAlert.trackingNumber}</span>
        </div>
        <span className="text-xs text-fg/40">Submitted {preAlert.createdAt}</span>
      </div>

      <p className="mt-2 text-sm text-fg/70">
        {preAlert.merchant} — {preAlert.description}
      </p>
      {preAlert.declaredValue !== undefined && (
        <p className="mt-1 text-sm text-fg/50">
          Declared value: {formatPreAlertValue(preAlert.declaredValue, preAlert.currency ?? "USD")}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor={pickerId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
            Match to received package
          </label>
          {candidatePackages.length === 0 ? (
            <p className="mt-2 text-sm text-fg/40">No unmatched packages for this customer yet.</p>
          ) : (
            <select
              id={pickerId}
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
            >
              {candidatePackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id} className="bg-surface text-fg">
                  {pkg.trackingNumber} — {pkg.merchant} · {pkg.description}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          data-cursor-hover="Match"
          onClick={handleMatch}
          disabled={!selectedPackageId || isMatching}
          className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-accent-dark hover:text-white disabled:opacity-50"
        >
          {isMatching ? "Matching…" : "Match"}
        </button>
      </div>
    </div>
  );
}
