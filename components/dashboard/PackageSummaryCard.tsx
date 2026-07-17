"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useDataStore } from "@/lib/data-store";
import { getOutstandingBills } from "@/lib/billing";
import { useLenis } from "@/components/layout/SmoothScrollProvider";
import ActionRow from "@/components/dashboard/ActionRow";
import Toast from "@/components/ui/Toast";

const preAlertIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M12 3v10" strokeLinecap="round" />
    <path d="M8 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v4a1 1 0 001 1h14a1 1 0 001-1v-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const packageIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M3 8l9-5 9 5-9 5-9-5z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 8v8l9 5 9-5V8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 13v8" strokeLinecap="round" />
  </svg>
);

const billsIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 10h8M8 14h5" strokeLinecap="round" />
  </svg>
);

export default function PackageSummaryCard() {
  const { user } = useAuth();
  const { getPackagesForAccount, bills } = useDataStore();
  const lenis = useLenis();
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const accountCode = user?.accountCode ?? "";
  const packages = getPackagesForAccount(accountCode);
  const preAlertCount = packages.filter((p) => p.status === "Pre-Alerted").length;
  const notPickedUpCount = packages.filter((p) => p.status !== "Delivered").length;
  const outstandingBillCount = getOutstandingBills(bills, accountCode).length;

  const handleStub = (label: string) => setToastMessage(`${label} is coming soon in a future update.`);

  const scrollToPackages = () => {
    const target = document.getElementById("packages");
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target as HTMLElement, { offset: -88, duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-8 shadow-card">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Package Summary</h3>

      <div className="mt-4 -mx-3 divide-y divide-fg/8">
        <ActionRow
          icon={preAlertIcon}
          label="Pre-Alert"
          sublabel="Pre-alerts submitted by me"
          badge={preAlertCount}
          onClick={() => handleStub("Pre-Alert")}
        />
        <ActionRow
          icon={packageIcon}
          label="Packages"
          sublabel="Packages not yet picked up"
          badge={notPickedUpCount}
          onClick={scrollToPackages}
        />
        <ActionRow
          icon={billsIcon}
          label="Bills/Transactions"
          sublabel="Pay outstanding bills"
          badge={outstandingBillCount}
          onClick={() => router.push("/dashboard/billing")}
        />
      </div>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
