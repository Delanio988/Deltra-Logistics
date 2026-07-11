"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Client-side route guard. Renders a small on-brand loading state while the
 * initial auth check runs, redirects to /login if there's no session, and
 * otherwise renders children. Reusable for any future protected route.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <span className="h-2.5 w-2.5 animate-pulse-slow rounded-full bg-accent" aria-hidden />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  return <>{children}</>;
}
