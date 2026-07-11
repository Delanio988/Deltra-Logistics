"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/lib/auth-context";

type RequireAuthProps = {
  children: ReactNode;
  /** If set, only this role may view the children. */
  role?: UserRole;
  /** Where to send an unauthenticated visitor. */
  redirectTo?: string;
};

/**
 * Client-side route guard. Renders a small on-brand loading state while the
 * initial auth check runs. No session -> `redirectTo`. Wrong role -> sent to
 * the area they *do* have access to, rather than bounced back to a login
 * screen they already passed. Reusable for both the customer dashboard
 * (`role="customer"`) and the admin area (`role="admin"`).
 */
export default function RequireAuth({ children, role, redirectTo = "/login" }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const wrongRole = Boolean(role && user && user.role !== role);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(redirectTo);
      return;
    }
    if (role && user.role !== role) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [isLoading, user, role, redirectTo, router]);

  if (isLoading || !user || wrongRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <span className="h-2.5 w-2.5 animate-pulse-slow rounded-full bg-accent" aria-hidden />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  return <>{children}</>;
}
