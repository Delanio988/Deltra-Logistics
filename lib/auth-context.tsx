"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AuthUser = {
  name: string;
  email: string;
};

type LoginResult = { success: true } | { success: false; error: string };

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

// Demo-only credential. Swap the whole `login()` body below for a real API
// call and this constant goes away entirely.
const DEMO_CREDENTIALS = {
  email: "demo@deltra.com",
  password: "demo123",
  name: "Alex Morgan",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    // ---- MOCK AUTH: replace this block with a real API / NextAuth call. ----
    // The rest of the app only depends on the `LoginResult` shape returned
    // here and on `user`/`logout`, so swapping this block for e.g.
    // `signIn("credentials", { email, password })` doesn't require touching
    // any consuming component.
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (
      email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
      password === DEMO_CREDENTIALS.password
    ) {
      const authedUser: AuthUser = { name: DEMO_CREDENTIALS.name, email: DEMO_CREDENTIALS.email };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(authedUser));
      setUser(authedUser);
      return { success: true };
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
