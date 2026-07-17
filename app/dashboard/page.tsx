"use client";

import { useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AccountSummaryCard from "@/components/dashboard/AccountSummaryCard";
import AccountActionsCard from "@/components/dashboard/AccountActionsCard";
import PackageSummaryCard from "@/components/dashboard/PackageSummaryCard";
import OverseasAddressCard from "@/components/dashboard/OverseasAddressCard";
import RateCalculator from "@/components/dashboard/RateCalculator";
import PackageCard from "@/components/dashboard/PackageCard";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getOverseasAddress } from "@/lib/dashboard-data";
import { useDataStore } from "@/lib/data-store";
import { useAuth } from "@/lib/auth-context";

function DashboardContent() {
  const { user } = useAuth();
  const { getPackagesForAccount } = useDataStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const accountCode = user?.accountCode ?? "";
  const packages = getPackagesForAccount(accountCode);
  const overseasAddress = getOverseasAddress(user?.name ?? "Customer", accountCode);

  return (
    <div className="min-h-screen bg-bg">
      <DashboardHeader />

      <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
        <ScrollReveal direction="none">
          <h1 className="text-display-sm font-extrabold text-fg">
            Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-2 text-fg/60">Here&rsquo;s what&rsquo;s moving right now.</p>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ScrollReveal index={0}>
            <AccountSummaryCard />
          </ScrollReveal>
          <ScrollReveal index={1}>
            <AccountActionsCard />
          </ScrollReveal>
          <ScrollReveal index={2}>
            <PackageSummaryCard />
          </ScrollReveal>
          <ScrollReveal index={3}>
            <OverseasAddressCard address={overseasAddress} />
          </ScrollReveal>
        </div>

        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Get a Quote</h2>
          <div className="mt-4">
            <RateCalculator title="Estimate a new shipment" />
          </div>
        </section>

        <section id="packages" className="mt-12 scroll-mt-24">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-fg/50">My Packages</h2>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {packages.length === 0 ? (
              <p className="rounded-2xl border border-fg/8 bg-surface p-8 text-sm text-fg/50 shadow-card">
                No packages yet — once you pre-alert or ship a package, it&rsquo;ll show up here.
              </p>
            ) : (
              packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isExpanded={expandedId === pkg.id}
                  onToggle={() => setExpandedId((current) => (current === pkg.id ? null : pkg.id))}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth role="customer">
      <DashboardContent />
    </RequireAuth>
  );
}
