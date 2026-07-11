"use client";

import Link from "next/link";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Wordmark from "@/components/ui/Wordmark";
import MagneticButton from "@/components/ui/MagneticButton";

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
    <header className="border-b border-white/8 bg-navy-900">
      <div className="mx-auto flex h-20 max-w-container items-center justify-between px-6 lg:px-12">
        <Link href="/admin" data-cursor-hover="Admin" className="flex items-center gap-3">
          <Wordmark className="text-lg text-white" />
          <span className="rounded-full border border-accent/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user && <span className="hidden text-sm font-medium text-white/70 sm:inline">{user.name}</span>}
          <MagneticButton
            onClick={handleLogout}
            cursorLabel="Logout"
            strength={0.2}
            className="border border-white/15 text-white hover:border-accent hover:text-accent"
          >
            Logout
          </MagneticButton>
        </div>
      </div>
    </header>
  );
}
