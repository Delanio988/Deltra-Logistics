"use client";

import Link from "next/link";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Wordmark from "@/components/ui/Wordmark";
import MagneticButton from "@/components/ui/MagneticButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SeasonalGreetingBanner from "@/components/ui/SeasonalGreetingBanner";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Simplified chrome for the customer portal — no marketing nav, just brand + account. */
export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    // RequireAuth (wrapping this page) also reacts to the session clearing
    // and would otherwise race this navigation with its own redirect to
    // /login. flushSync forces that reaction to resolve first, so our
    // push to "/" is the last navigation call and wins.
    flushSync(() => {
      logout();
    });
    router.push("/");
  };

  return (
    <>
      <SeasonalGreetingBanner scope="portal" />
      <header className="border-b border-fg/8 bg-surface">
        <div className="mx-auto flex h-20 max-w-container items-center justify-between px-6 lg:px-12">
          <Link href="/dashboard" data-cursor-hover="Dashboard">
            <Wordmark className="h-8" />
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden items-center gap-3 sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-bold text-navy-950">
                  {getInitials(user.name)}
                </span>
                <span className="text-sm font-medium text-fg">{user.name}</span>
              </div>
            )}
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
    </>
  );
}
