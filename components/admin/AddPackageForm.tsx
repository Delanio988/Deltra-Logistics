"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PACKAGE_STATUSES, type Customer, type PackageStatus } from "@/lib/dashboard-data";
import { calculateShippingCost, formatCurrency } from "@/lib/quote-config";
import { addPackage } from "@/lib/actions/packages";
import MagneticButton from "@/components/ui/MagneticButton";
import Toast from "@/components/ui/Toast";

type AddPackageFormProps = {
  customers: Customer[];
};

const DEFAULT_STATUS: PackageStatus = "Received at Warehouse";

function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AddPackageForm({ customers }: AddPackageFormProps) {
  const router = useRouter();
  const accountId = useId();
  const trackingId = useId();
  const merchantId = useId();
  const descriptionId = useId();
  const weightId = useId();
  const dateId = useId();
  const statusId = useId();
  const invoiceRequiredId = useId();

  const [accountCode, setAccountCode] = useState(customers[0]?.accountCode ?? "");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [dateReceived, setDateReceived] = useState("");
  const [status, setStatus] = useState<PackageStatus>(DEFAULT_STATUS);
  const [invoiceRequired, setInvoiceRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const parsedWeight = parseFloat(weight);
  const hasValidWeight = Number.isFinite(parsedWeight) && parsedWeight > 0;
  const estimatedCost = hasValidWeight ? calculateShippingCost(parsedWeight) : 0;

  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-fg/8 bg-surface p-8 text-center text-sm text-fg/50 shadow-card">
        No customers yet — packages can be added once at least one customer has signed up.
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasValidWeight || !trackingNumber.trim() || !merchant.trim() || !description.trim() || !dateReceived) return;

    setIsSubmitting(true);
    const result = await addPackage({
      accountCode,
      trackingNumber: trackingNumber.trim(),
      merchant: merchant.trim(),
      description: description.trim(),
      weightLb: parsedWeight,
      dateReceived,
      status,
      invoiceRequired,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setToastMessage(result.error);
      return;
    }

    const customer = customers.find((c) => c.accountCode === accountCode);
    setToastMessage(`Package ${trackingNumber.trim()} added for ${customer?.name ?? accountCode}.`);

    setTrackingNumber("");
    setMerchant("");
    setDescription("");
    setWeight("");
    setDateReceived("");
    setStatus(DEFAULT_STATUS);
    setInvoiceRequired(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-fg/8 bg-surface p-8 shadow-card">
      <h2 className="text-xl font-bold text-fg">Add a package</h2>
      <p className="mt-2 text-sm text-fg/60">
        Adding a package notifies the customer automatically and updates their dashboard.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={accountId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
            Customer
          </label>
          <select
            id={accountId}
            value={accountCode}
            onChange={(e) => setAccountCode(e.target.value)}
            className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
          >
            {customers.map((c) => (
              <option key={c.accountCode} value={c.accountCode} className="bg-surface text-fg">
                {c.name} ({c.accountCode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={trackingId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
            Tracking number
          </label>
          <input
            id={trackingId}
            required
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. DL55201933"
            className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor={merchantId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
            Merchant / courier
          </label>
          <input
            id={merchantId}
            required
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Amazon"
            className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={descriptionId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
            Description
          </label>
          <input
            id={descriptionId}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Electronics — 1 box"
            className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor={weightId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
            Weight (lb)
          </label>
          <input
            id={weightId}
            type="number"
            min="0"
            step="0.1"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 8"
            className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor={dateId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
            Date received
          </label>
          <input
            id={dateId}
            type="date"
            required
            value={dateReceived}
            onChange={(e) => setDateReceived(e.target.value)}
            className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent [color-scheme:light] dark:[color-scheme:dark]"
          />
          {dateReceived && <p className="mt-1 text-xs text-fg/35">{formatDate(dateReceived)}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={statusId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
            Initial status
          </label>
          <select
            id={statusId}
            value={status}
            onChange={(e) => setStatus(e.target.value as PackageStatus)}
            className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
          >
            {PACKAGE_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-surface text-fg">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor={invoiceRequiredId} className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-fg/70">
        <input
          id={invoiceRequiredId}
          type="checkbox"
          checked={invoiceRequired}
          onChange={(e) => setInvoiceRequired(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-fg/20 bg-fg/5 accent-accent"
        />
        <span>
          Requires customs invoice
          <span className="block text-xs text-fg/40">Customer must upload proof of purchase before this package can be cleared.</span>
        </span>
      </label>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-fg/10 bg-fg/5 px-5 py-4">
        <span className="text-sm font-medium text-fg/70">Shipping cost (auto-calculated)</span>
        <span className="text-lg font-bold text-accent">{hasValidWeight ? formatCurrency(estimatedCost) : "—"}</span>
      </div>

      <MagneticButton
        type="submit"
        disabled={isSubmitting}
        cursorLabel="Add"
        className="mt-6 w-full justify-center bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white disabled:opacity-60"
      >
        {isSubmitting ? "Adding…" : "Add package"}
      </MagneticButton>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </form>
  );
}
