"use client";

import { useState } from "react";
import Link from "next/link";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import Wordmark from "@/components/ui/Wordmark";
import MagneticButton from "@/components/ui/MagneticButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/warehouse", label: "Warehouse" },
  { href: "/admin/theme", label: "Theme" },
];

/** Simplified chrome for the admin area — brand, an "Admin" tag, and Logout.
 *  The nav links only show inline at lg+; below that, a hamburger opens a
 *  dropdown with the same links (there was previously no way to reach them
 *  on mobile at all). */
export default function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
          {ADMIN_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-cursor-hover={link.label}
              className="text-sm font-medium text-fg/70 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          {user && <span className="max-w-[5rem] truncate text-sm font-medium text-fg/70 sm:max-w-none">{user.name}</span>}
          <ThemeToggle />
          <MagneticButton
            onClick={handleLogout}
            cursorLabel="Logout"
            strength={0.2}
            className="hidden border border-fg/15 text-fg hover:border-accent hover:text-accent lg:inline-flex"
          >
            Logout
          </MagneticButton>
          <button
            type="button"
            onClick={() => setIsMobileOpen((v) => !v)}
            aria-expanded={isMobileOpen}
            aria-label="Toggle admin navigation menu"
            className="flex h-10 w-8 shrink-0 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              className={cn("h-[2px] w-6 bg-fg transition-transform duration-300", isMobileOpen && "translate-y-[7px] rotate-45")}
            />
            <span className={cn("h-[2px] w-6 bg-fg transition-opacity duration-300", isMobileOpen && "opacity-0")} />
            <span
              className={cn("h-[2px] w-6 bg-fg transition-transform duration-300", isMobileOpen && "-translate-y-[7px] -rotate-45")}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-surface lg:hidden"
            aria-label="Admin mobile"
          >
            <div className="flex flex-col gap-1 px-6 pb-6 pt-2">
              {ADMIN_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="border-b border-fg/10 py-4 text-lg font-medium text-fg/90"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsMobileOpen(false);
                  handleLogout();
                }}
                className="py-4 text-left text-lg font-medium text-fg/90"
              >
                Logout
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
