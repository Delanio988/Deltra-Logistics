"use client";

import { useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import AddPackageForm from "@/components/admin/AddPackageForm";
import PackagesTable from "@/components/admin/PackagesTable";
import Toast from "@/components/ui/Toast";
import ScrollReveal from "@/components/ui/ScrollReveal";

function AdminContent() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-navy-950">
      <AdminHeader />

      <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
        <ScrollReveal direction="none">
          <h1 className="text-display-sm font-extrabold text-white">Warehouse dashboard</h1>
          <p className="mt-2 text-white/60">Add packages and keep customers updated.</p>
        </ScrollReveal>

        <section className="mt-10">
          <AddPackageForm onSuccess={setToastMessage} />
        </section>

        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">All Packages</h2>
          <div className="mt-4">
            <PackagesTable onStatusChange={setToastMessage} />
          </div>
        </section>
      </main>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <AdminContent />
    </RequireAuth>
  );
}
