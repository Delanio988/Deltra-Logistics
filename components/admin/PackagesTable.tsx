"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PACKAGE_STATUSES, type PackageStatus } from "@/lib/dashboard-data";
import { calculateShippingCost, formatCurrency } from "@/lib/quote-config";
import { getInvoiceForPackage, type Invoice } from "@/lib/invoices";
import { updatePackageStatus, setPackageInvoiceRequired } from "@/lib/actions/packages";
import type { PackageWithCustomer } from "@/lib/packages";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";
import Toast from "@/components/ui/Toast";

type PackagesTableProps = {
  packages: PackageWithCustomer[];
  invoices: Invoice[];
};

/** All packages across all customers, with an inline status control per row. */
export default function PackagesTable({ packages, invoices }: PackagesTableProps) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleStatusChange = async (packageId: string, trackingNumber: string, status: PackageStatus) => {
    const result = await updatePackageStatus({ packageId, status });
    if (!result.success) {
      setToastMessage(result.error);
      return;
    }
    setToastMessage(`${trackingNumber} updated to "${status}".`);
    router.refresh();
  };

  const handleInvoiceRequiredChange = async (packageId: string, required: boolean) => {
    const result = await setPackageInvoiceRequired({ packageId, required });
    if (!result.success) setToastMessage(result.error);
    else router.refresh();
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
                <td className="px-6 py-4 text-fg/70">{pkg.customerName}</td>
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
                        onClick={() => handleInvoiceRequiredChange(pkg.id, false)}
                        data-cursor-hover="Unflag"
                        className="text-xs font-medium text-fg/40 underline transition-colors hover:text-accent"
                      >
                        Unflag
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInvoiceRequiredChange(pkg.id, true)}
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

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
