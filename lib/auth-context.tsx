"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "customer" | "admin";

export type AuthUser = {
  name: string;
  email: string;
  role: UserRole;
  /** Customers only — keys their packages, messages, and shipping address. */
  accountCode?: string;
};

type LoginResult = { success: true; user: AuthUser } | { success: false; error: string };

type AuthContextValue = {
  user: AuthUser | null;
  /** True until the initial localStorage check on mount resolves — consumers
   *  should wait on this before redirecting, to avoid bouncing a logged-in
   *  user to /login on first render. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "deltra_auth_session";

// Demo-only credentials. Swap the whole `login()` body below for a real API
// call (which would also return the role/accountCode from the backend) and
// this array goes away entirely.
const DEMO_CREDENTIALS: Array<{ email: string; password: string; user: AuthUser }> = [
  {
    email: "demo@deltra.com",
    password: "demo123",
    user: { name: "Alex Morgan", email: "demo@deltra.com", role: "customer", accountCode: "DLT1789-A" },
  },
  {
    email: "admin@deltra.com",
    password: "admin123",
    user: { name: "Deltra Admin", email: "admin@deltra.com", role: "admin" },
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<AuthUser>;
        // Guard against a session shape from an older version of this app
        // (e.g. before `role` existed) — without this, a stale session
        // missing `role` would make RequireAuth's role check permanently
        // fail, redirecting in a loop instead of ever rendering the page.
        if (parsed.role === "customer" || parsed.role === "admin") {
          setUser(parsed as AuthUser);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    // ---- MOCK AUTH: replace this block with a real API / NextAuth call. ----
    // A real implementation would also return `role`/`accountCode` from the
    // backend rather than a hardcoded list. The rest of the app only depends
    // on the `LoginResult` shape returned here and on `user`/`logout`, so
    // swapping this block out doesn't require touching any consuming component.
    await new Promise((resolve) => setTimeout(resolve, 500));

    const match = DEMO_CREDENTIALS.find(
      (c) => c.email === email.trim().toLowerCase() && c.password === password
    );

    if (match) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(match.user));
      setUser(match.user);
      return { success: true, user: match.user };
    }

    return { success: false, error: "Invalid email or password." };
    // ---- END MOCK AUTH ----
  };

  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
