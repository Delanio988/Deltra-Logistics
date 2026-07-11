"use client";

import { useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PackageCard from "@/components/dashboard/PackageCard";
import DropOffPanel from "@/components/dashboard/DropOffPanel";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { PACKAGES, DROP_OFF_LOCATION } from "@/lib/dashboard-data";
import { useAuth } from "@/lib/auth-context";

function DashboardContent() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-navy-950">
      <DashboardHeader />

      <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
        <ScrollReveal direction="none">
          <h1 className="text-display-sm font-extrabold text-white">
            Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-2 text-white/60">Here&rsquo;s what&rsquo;s moving right now.</p>
        </ScrollReveal>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">My Packages</h2>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {PACKAGES.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isExpanded={expandedId === pkg.id}
                onToggle={() => setExpandedId((current) => (current === pkg.id ? null : pkg.id))}
              />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">Drop-Off Location</h2>
          <div className="mt-4">
            <DropOffPanel location={DROP_OFF_LOCATION} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
