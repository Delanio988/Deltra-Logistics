"use client";

import Link from "next/link";
import { useDataStore } from "@/lib/data-store";
import { CUSTOMERS, PACKAGE_STATUSES, type PackageStatus } from "@/lib/dashboard-data";
import { calculateShippingCost, formatCurrency } from "@/lib/quote-config";
import { getInvoiceForPackage } from "@/lib/invoices";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";

type PackagesTableProps = {
  onStatusChange: (message: string) => void;
};

/** All packages across all customers, with an inline status control per row. */
export default function PackagesTable({ onStatusChange }: PackagesTableProps) {
  const { packages, invoices, updatePackageStatus, setPackageInvoiceRequired } = useDataStore();

  const customerName = (accountCode: string) =>
    CUSTOMERS.find((c) => c.accountCode === accountCode)?.name ?? accountCode;

  const handleStatusChange = (packageId: string, trackingNumber: string, status: PackageStatus) => {
    updatePackageStatus(packageId, status);
    onStatusChange(`${trackingNumber} updated to "${status}".`);
  };

  if (packages.length === 0) {
    return (
      <div className="rounded-2xl border border-fg/8 bg-surface p-8 text-center text-sm text-fg/50 shadow-card">
        No packages yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-fg/8 bg-surface shadow-card">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-fg/8 text-xs font-semibold uppercase tracking-widest text-fg/50">
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
            <th scope="col" className="px-6 py-4">
              Invoice
            </th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => {
            const invoice = getInvoiceForPackage(invoices, pkg.id);
            return (
              <tr key={pkg.id} className="border-b border-fg/8 last:border-0">
                <td className="px-6 py-4 font-mono text-fg">{pkg.trackingNumber}</td>
                <td className="px-6 py-4 text-fg/70">{customerName(pkg.accountCode)}</td>
                <td className="px-6 py-4 text-fg/70">{pkg.merchant}</td>
                <td className="px-6 py-4 text-fg/70">{pkg.weightLb} lb</td>
                <td className="px-6 py-4 text-fg/70">{formatCurrency(calculateShippingCost(pkg.weightLb))}</td>
                <td className="px-6 py-4">
                  <label className="sr-only" htmlFor={`status-${pkg.id}`}>
                    Status for {pkg.trackingNumber}
                  </label>
                  <select
                    id={`status-${pkg.id}`}
                    value={pkg.status}
                    onChange={(e) => handleStatusChange(pkg.id, pkg.trackingNumber, e.target.value as PackageStatus)}
                    className="rounded-full border border-fg/15 bg-fg/5 px-4 py-2 text-xs font-semibold text-fg outline-none transition-colors focus:border-accent"
                  >
                    {PACKAGE_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-surface text-fg">
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  {invoice ? (
                    invoice.status === "pending" ? (
                      <Link href="/admin/invoices" data-cursor-hover="Review">
                        <InvoiceStatusBadge status={invoice.status} />
                      </Link>
                    ) : (
                      <InvoiceStatusBadge status={invoice.status} />
                    )
                  ) : pkg.invoiceRequired ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Awaiting upload
                      </span>
                      <button
                        type="button"
                        onClick={() => setPackageInvoiceRequired(pkg.id, false)}
                        data-cursor-hover="Unflag"
                        className="text-xs font-medium text-fg/40 underline transition-colors hover:text-accent"
                      >
                        Unflag
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPackageInvoiceRequired(pkg.id, true)}
                      data-cursor-hover="Require"
                      className="text-xs font-medium text-fg/50 underline transition-colors hover:text-accent"
                    >
                      Require invoice
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
