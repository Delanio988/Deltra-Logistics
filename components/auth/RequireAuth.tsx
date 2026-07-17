"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/lib/auth-context";
import Skeleton from "@/components/ui/Skeleton";

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
      <div className="min-h-screen bg-bg">
        <div className="border-b border-fg/8 bg-surface">
          <div className="mx-auto flex h-20 max-w-container items-center justify-between px-6 lg:px-12">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
        <div className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="mt-4 h-4 w-96 max-w-full" />
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  return <>{children}</>;
}
