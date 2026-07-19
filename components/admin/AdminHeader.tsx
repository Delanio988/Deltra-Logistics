"use client";

import Link from "next/link";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Wordmark from "@/components/ui/Wordmark";
import MagneticButton from "@/components/ui/MagneticButton";
import ThemeToggle from "@/components/ui/ThemeToggle";

/** Simplified chrome for the admin area — brand, an "Admin" tag, and Logout. */
export default function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    // See components/dashboard/DashboardHeader.tsx for why flushSync is
    // needed here — RequireAuth's own redirect would otherwise race this one.
    flushSync(() => {
      logout();
    });
    router.push("/admin/login");
  };

  return (
    <header className="border-b border-fg/8 bg-surface">
      <div className="mx-auto flex h-20 max-w-container items-center justify-between px-6 lg:px-12">
        <Link href="/admin" data-cursor-hover="Admin" className="flex items-center gap-3">
          <Wordmark className="h-8" />
          <span className="rounded-full border border-accent/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
            Admin
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Admin">
          <Link href="/admin" data-cursor-hover="Dashboard" className="text-sm font-medium text-fg/70 transition-colors hover:text-accent">
            Dashboard
          </Link>
          <Link href="/admin/invoices" data-cursor-hover="Invoices" className="text-sm font-medium text-fg/70 transition-colors hover:text-accent">
            Invoices
          </Link>
          <Link href="/admin/billing" data-cursor-hover="Billing" className="text-sm font-medium text-fg/70 transition-colors hover:text-accent">
            Billing
          </Link>
          <Link href="/admin/theme" data-cursor-hover="Theme" className="text-sm font-medium text-fg/70 transition-colors hover:text-accent">
            Theme
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user && <span className="max-w-[7rem] truncate text-sm font-medium text-fg/70 sm:max-w-none">{user.name}</span>}
          <ThemeToggle />
          <MagneticButton
            onClick={handleLogout}
            cursorLabel="Logout"
            strength={0.2}
            className="border border-fg/15 text-fg hover:border-accent hover:text-accent"
          >
            Logout
          </MagneticButton>
        </div>
      </div>
    </header>
  );
}
