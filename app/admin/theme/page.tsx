import RequireAuth from "@/components/auth/RequireAuth";
import AdminHeader from "@/components/admin/AdminHeader";
import SeasonalThemeForm from "@/components/admin/SeasonalThemeForm";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminThemePage() {
  const settings = await getSiteSettings();

  return (
    <RequireAuth role="admin" redirectTo="/admin/login">
      <div className="min-h-screen bg-bg">
        <AdminHeader />

        <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
          <ScrollReveal direction="none">
            <h1 className="text-display-sm font-extrabold text-fg">Seasonal Theme</h1>
            <p className="mt-2 text-fg/60">Add festive decorations and a greeting banner for holidays.</p>
          </ScrollReveal>

          <ScrollReveal index={0} className="mt-10">
            <SeasonalThemeForm initialSettings={settings} />
          </ScrollReveal>
        </main>
      </div>
    </RequireAuth>
  );
}
