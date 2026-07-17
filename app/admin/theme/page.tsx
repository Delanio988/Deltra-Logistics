"use client";

import { useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import SeasonalThemeForm from "@/components/admin/SeasonalThemeForm";
import Toast from "@/components/ui/Toast";
import ScrollReveal from "@/components/ui/ScrollReveal";

function AdminThemeContent() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-bg">
      <AdminHeader />

      <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
        <ScrollReveal direction="none">
          <h1 className="text-display-sm font-extrabold text-fg">Seasonal Theme</h1>
          <p className="mt-2 text-fg/60">Add festive decorations and a greeting banner for holidays.</p>
        </ScrollReveal>

        <ScrollReveal index={0} className="mt-10">
          <SeasonalThemeForm onChange={setToastMessage} />
        </ScrollReveal>
      </main>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

export default function AdminThemePage() {
  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <AdminThemeContent />
    </RequireAuth>
  );
}
