"use client";

import { useDataStore } from "@/lib/data-store";
import { CUSTOMERS, PACKAGE_STATUSES, type PackageStatus } from "@/lib/dashboard-data";
import { calculateShippingCost, formatCurrency } from "@/lib/quote-config";

type PackagesTableProps = {
  onStatusChange: (message: string) => void;
};

/** All packages across all customers, with an inline status control per row. */
export default function PackagesTable({ onStatusChange }: PackagesTableProps) {
  const { packages, updatePackageStatus } = useDataStore();

  const customerName = (accountCode: string) =>
    CUSTOMERS.find((c) => c.accountCode === accountCode)?.name ?? accountCode;

  const handleStatusChange = (packageId: string, trackingNumber: string, status: PackageStatus) => {
    updatePackageStatus(packageId, status);
    onStatusChange(`${trackingNumber} updated to "${status}".`);
  };

  if (packages.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-navy-900 p-8 text-center text-sm text-white/50 shadow-card">
        No packages yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/8 bg-navy-900 shadow-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/8 text-xs font-semibold uppercase tracking-widest text-white/50">
            <th scope="col" className="px-6 py-4">
              Tracking #
            </th>
            <th scope="col" className="px-6 py-4">
              Customer
            </th>
            <th scope="col" className="px-6 py-4">
              Merchant
            </th>
            <th scope="col" className="px-6 py-4">
              Weight
            </th>
            <th scope="col" className="px-6 py-4">
              Cost
            </th>
            <th scope="col" className="px-6 py-4">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id} className="border-b border-white/8 last:border-0">
              <td className="px-6 py-4 font-mono text-white">{pkg.trackingNumber}</td>
              <td className="px-6 py-4 text-white/70">{customerName(pkg.accountCode)}</td>
              <td className="px-6 py-4 text-white/70">{pkg.merchant}</td>
              <td className="px-6 py-4 text-white/70">{pkg.weightLb} lb</td>
              <td className="px-6 py-4 text-white/70">{formatCurrency(calculateShippingCost(pkg.weightLb))}</td>
              <td className="px-6 py-4">
                <label className="sr-only" htmlFor={`status-${pkg.id}`}>
                  Status for {pkg.trackingNumber}
                </label>
                <select
                  id={`status-${pkg.id}`}
                  value={pkg.status}
                  onChange={(e) => handleStatusChange(pkg.id, pkg.trackingNumber, e.target.value as PackageStatus)}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white outline-none transition-colors focus:border-accent"
                >
                  {PACKAGE_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-navy-900 text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
