"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { INITIAL_PACKAGES, type Package, type PackageStatus } from "@/lib/dashboard-data";

export type Message = {
  id: string;
  accountCode: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
};

type NewPackageInput = Omit<Package, "id">;

type DataStoreValue = {
  packages: Package[];
  messages: Message[];
  getPackagesForAccount: (accountCode: string) => Package[];
  getMessagesForAccount: (accountCode: string) => Message[];
  addPackage: (input: NewPackageInput) => void;
  updatePackageStatus: (packageId: string, status: PackageStatus) => void;
  markMessagesRead: (accountCode: string) => void;
};

const DataStoreContext = createContext<DataStoreValue | null>(null);

const PACKAGES_KEY = "deltra_mock_packages";
const MESSAGES_KEY = "deltra_mock_messages";

/**
 * Mock shared "database" for the demo: admin actions (add package, change
 * status) need to show up in the customer's dashboard and Messages badge.
 * Since there's no real backend yet, this holds that state in React context,
 * persisted to localStorage so it survives a reload — but it's still
 * per-browser only; a real admin and a real customer on different devices
 * would not see each other's changes until this is replaced with a real
 * backend + database (see the TODOs below).
 */
export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [packages, setPackages] = useState<Package[]>(INITIAL_PACKAGES);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage once on mount (client-only, avoids SSR mismatch).
  useEffect(() => {
    try {
      const storedPackages = window.localStorage.getItem(PACKAGES_KEY);
      if (storedPackages) setPackages(JSON.parse(storedPackages) as Package[]);
      const storedMessages = window.localStorage.getItem(MESSAGES_KEY);
      if (storedMessages) setMessages(JSON.parse(storedMessages) as Message[]);
    } catch {
      // Corrupt storage — fall back to the seed data already in state.
    }
    setIsHydrated(true);
  }, []);

  // Persist on every change, but only after initial hydration so we don't
  // overwrite real stored data with the default seed on first render.
  useEffect(() => {
    if (isHydrated) window.localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
  }, [packages, isHydrated]);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, [messages, isHydrated]);

  const addMessage = (accountCode: string, title: string, body: string) => {
    // ---- MOCK NOTIFICATION: a real backend would also send an email/SMS/push here. ----
    const message: Message = {
      id: crypto.randomUUID(),
      accountCode,
      title,
      body,
      timestamp: new Date().toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      read: false,
    };
    setMessages((prev) => [message, ...prev]);
    // ---- END MOCK NOTIFICATION ----
  };

  const addPackage = (input: NewPackageInput) => {
    // TODO: replace with a real backend + database call.
    const pkg: Package = { ...input, id: crypto.randomUUID() };
    setPackages((prev) => [pkg, ...prev]);
    addMessage(pkg.accountCode, "New package added", `${pkg.trackingNumber} (${pkg.merchant}) has been added to your account.`);
  };

  const updatePackageStatus = (packageId: string, status: PackageStatus) => {
    // TODO: replace with a real backend + database call.
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg || pkg.status === status) return;
    setPackages((prev) => prev.map((p) => (p.id === packageId ? { ...p, status } : p)));
    addMessage(pkg.accountCode, "Package status updated", `${pkg.trackingNumber} is now ${status}.`);
  };

  const getPackagesForAccount = (accountCode: string) => packages.filter((p) => p.accountCode === accountCode);
  const getMessagesForAccount = (accountCode: string) => messages.filter((m) => m.accountCode === accountCode);
  const markMessagesRead = (accountCode: string) => {
    setMessages((prev) => prev.map((m) => (m.accountCode === accountCode ? { ...m, read: true } : m)));
  };

  return (
    <DataStoreContext.Provider
      value={{
        packages,
        messages,
        getPackagesForAccount,
        getMessagesForAccount,
        addPackage,
        updatePackageStatus,
        markMessagesRead,
      }}
    >
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within a DataStoreProvider");
  return ctx;
}
