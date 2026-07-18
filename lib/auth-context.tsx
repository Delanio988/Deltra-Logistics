"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

export type UserRole = "customer" | "admin";

export type AuthUser = {
  name: string;
  email: string;
  role: UserRole;
  /** Customers only — keys their packages, messages, and shipping address. */
  accountCode?: string;
};

type LoginResult = { success: true; user: AuthUser } | { success: false; error: string };

type RegisterResult =
  | { success: true; status: "verify-email"; email: string }
  | { success: true; status: "signed-in"; user: AuthUser }
  | { success: false; error: string };

type ActionResult = { success: true } | { success: false; error: string };

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  /** True until the initial session check resolves — consumers should wait
   *  on this before redirecting, to avoid bouncing a logged-in user to
   *  /login on first render. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  /** Sends a password-reset email. The link lands on /auth/callback, which
   *  exchanges it for a session and forwards to /reset-password. */
  resetPassword: (email: string) => Promise<ActionResult>;
  /** Sets a new password for the currently-active (recovery) session. */
  updatePassword: (newPassword: string) => Promise<ActionResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(message: string): string {
  if (message === "Invalid login credentials") return "Invalid email or password.";
  if (message === "User already registered") return "An account with this email already exists.";
  return message;
}

async function hydrateUser(
  supabase: SupabaseClient<Database>,
  supabaseUser: User
): Promise<AuthUser | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, role, account_code")
    .eq("id", supabaseUser.id)
    .single();

  if (!profile) return null;

  return {
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    email: profile.email,
    role: profile.role as UserRole,
    accountCode: profile.account_code ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const syncUser = async (supabaseUser: User | null) => {
      if (!supabaseUser) {
        if (mounted) setUser(null);
        return;
      }
      const authUser = await hydrateUser(supabase, supabaseUser);
      if (mounted) setUser(authUser);
    };

    supabase.auth.getUser().then(({ data }) => {
      syncUser(data.user).finally(() => {
        if (mounted) setIsLoading(false);
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { success: false, error: mapAuthError(error.message) };
    }

    const authUser = await hydrateUser(supabase, data.user);
    if (!authUser) {
      await supabase.auth.signOut();
      return { success: false, error: "Account setup is incomplete. Please contact support." };
    }

    setUser(authUser);
    return { success: true, user: authUser };
  };

  const register = async (input: RegisterInput): Promise<RegisterResult> => {
    const supabase = createClient();
    const email = input.email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          phone: input.phone.trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      return { success: false, error: mapAuthError(error.message) };
    }

    // No session yet means email confirmation is pending — this is the
    // expected path with "Confirm email" enabled on the Supabase project.
    if (!data.session || !data.user) {
      return { success: true, status: "verify-email", email };
    }

    const authUser = await hydrateUser(supabase, data.user);
    if (!authUser) {
      return { success: false, error: "Account setup is incomplete. Please contact support." };
    }
    setUser(authUser);
    return { success: true, status: "signed-in", user: authUser };
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<ActionResult> => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) return { success: false, error: mapAuthError(error.message) };
    return { success: true };
  };

  const updatePassword = async (newPassword: string): Promise<ActionResult> => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: mapAuthError(error.message) };
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, resetPassword, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
