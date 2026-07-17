"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CUSTOMERS, INITIAL_PACKAGES, type Customer, type Package, type PackageStatus } from "@/lib/dashboard-data";
import { INITIAL_INVOICES, type Invoice, type InvoiceStatus } from "@/lib/invoices";
import { deleteInvoiceFile, type UploadedInvoiceFile } from "@/lib/uploads";
import {
  INITIAL_BILLS,
  INITIAL_TRANSACTIONS,
  billBalanceDue,
  buildShippingLineItem,
  computeBillTotal,
  getWalletBalance as deriveWalletBalance,
  sumBalanceDue,
  type Bill,
  type BillStatus,
  type LineItem,
  type Transaction,
} from "@/lib/billing";
import { formatCurrency } from "@/lib/quote-config";
import {
  DEFAULT_SEASONAL_SETTINGS,
  isBannerVisible,
  resolveActiveSeasonalTheme,
  type SeasonalSettings,
  type SeasonalTheme,
} from "@/lib/seasonal-themes";

export type Message = {
  id: string;
  accountCode: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
};

type NewPackageInput = Omit<Package, "id">;

type NewInvoiceInput = {
  packageId: string;
  accountCode: string;
  files: UploadedInvoiceFile[];
  merchant?: string;
  value?: number;
  currency?: string;
};

type AddInvoiceFilesInput = {
  invoiceId: string;
  files: UploadedInvoiceFile[];
  merchant?: string;
  value?: number;
  currency?: string;
};

type PayBillsResult = { success: boolean; error?: string; shortfall?: number; transaction?: Transaction };

type DataStoreValue = {
  packages: Package[];
  messages: Message[];
  customers: Customer[];
  invoices: Invoice[];
  bills: Bill[];
  transactions: Transaction[];
  getPackagesForAccount: (accountCode: string) => Package[];
  getMessagesForAccount: (accountCode: string) => Message[];
  getInvoicesForAccount: (accountCode: string) => Invoice[];
  getBillsForAccount: (accountCode: string) => Bill[];
  getTransactionsForAccount: (accountCode: string) => Transaction[];
  getWalletBalance: (accountCode: string) => number;
  addPackage: (input: NewPackageInput) => void;
  updatePackageStatus: (packageId: string, status: PackageStatus) => void;
  markMessagesRead: (accountCode: string) => void;
  addCustomer: (customer: Customer) => void;
  submitInvoice: (input: NewInvoiceInput) => void;
  reviewInvoice: (invoiceId: string, decision: Extract<InvoiceStatus, "approved" | "rejected">, rejectionReason?: string) => void;
  setPackageInvoiceRequired: (packageId: string, required: boolean) => void;
  addInvoiceFiles: (input: AddInvoiceFilesInput) => void;
  removeInvoiceFile: (invoiceId: string, fileId: string) => void;
  replaceInvoiceFileInInvoice: (invoiceId: string, oldFileId: string, newFile: UploadedInvoiceFile) => void;
  withdrawInvoice: (invoiceId: string) => Invoice | undefined;
  restoreInvoice: (invoice: Invoice) => void;
  payBillsFromWallet: (billIds: string[]) => PayBillsResult;
  markBillsPendingBranch: (billIds: string[]) => void;
  addLineItemToBill: (packageId: string, item: LineItem) => void;
  markBillPaidByAdmin: (billId: string) => void;
  creditWallet: (accountCode: string, amount: number, note?: string) => void;
  issueRefund: (accountCode: string, amount: number, note?: string) => void;
  seasonalSettings: SeasonalSettings;
  updateSeasonalSettings: (partial: Partial<SeasonalSettings>) => void;
  getActiveSeasonalTheme: (pageScope: "portal" | "public") => SeasonalTheme;
  isSeasonalBannerVisible: (pageScope: "portal" | "public") => boolean;
  dismissSeasonalBanner: (themeId: string) => void;
};

const DataStoreContext = createContext<DataStoreValue | null>(null);

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateOffset(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const PACKAGES_KEY = "deltra_mock_packages";
const MESSAGES_KEY = "deltra_mock_messages";
const CUSTOMERS_KEY = "deltra_mock_customers";
const INVOICES_KEY = "deltra_mock_invoices";
const BILLS_KEY = "deltra_mock_bills";
const TRANSACTIONS_KEY = "deltra_mock_transactions";
const SEASONAL_SETTINGS_KEY = "deltra_mock_seasonal_settings";
// sessionStorage (not localStorage): "dismissed for their session" means it
// should survive a refresh but not a new tab/browser session.
const BANNER_DISMISSED_KEY = "deltra_mock_seasonal_banner_dismissed";

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
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [seasonalSettings, setSeasonalSettings] = useState<SeasonalSettings>(DEFAULT_SEASONAL_SETTINGS);
  const [bannerDismissedThemeId, setBannerDismissedThemeId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage once on mount (client-only, avoids SSR mismatch).
  useEffect(() => {
    try {
      const storedPackages = window.localStorage.getItem(PACKAGES_KEY);
      if (storedPackages) setPackages(JSON.parse(storedPackages) as Package[]);
      const storedMessages = window.localStorage.getItem(MESSAGES_KEY);
      if (storedMessages) setMessages(JSON.parse(storedMessages) as Message[]);
      const storedCustomers = window.localStorage.getItem(CUSTOMERS_KEY);
      if (storedCustomers) setCustomers(JSON.parse(storedCustomers) as Customer[]);
      const storedInvoices = window.localStorage.getItem(INVOICES_KEY);
      if (storedInvoices) setInvoices(JSON.parse(storedInvoices) as Invoice[]);
      const storedBills = window.localStorage.getItem(BILLS_KEY);
      if (storedBills) setBills(JSON.parse(storedBills) as Bill[]);
      const storedTransactions = window.localStorage.getItem(TRANSACTIONS_KEY);
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions) as Transaction[]);
      const storedSeasonalSettings = window.localStorage.getItem(SEASONAL_SETTINGS_KEY);
      if (storedSeasonalSettings) setSeasonalSettings(JSON.parse(storedSeasonalSettings) as SeasonalSettings);
      const storedBannerDismissed = window.sessionStorage.getItem(BANNER_DISMISSED_KEY);
      if (storedBannerDismissed) setBannerDismissedThemeId(storedBannerDismissed);
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

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  }, [customers, isHydrated]);

  // Object URLs (URL.createObjectURL) are already dead after a reload
  // regardless of whether we "save" them, and raw base64 could blow past
  // localStorage's ~5MB quota after a couple of photos — so only the file
  // metadata is persisted. Previews for these entries show a "preview
  // unavailable after reload" note instead of a broken image (see
  // components/dashboard/InvoiceUploadModal.tsx and its consumers).
  useEffect(() => {
    if (!isHydrated) return;
    const persistable = invoices.map((inv) => ({
      ...inv,
      files: inv.files.map((file) => ({ id: file.id, name: file.name, size: file.size, type: file.type })),
    }));
    window.localStorage.setItem(INVOICES_KEY, JSON.stringify(persistable));
  }, [invoices, isHydrated]);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  }, [bills, isHydrated]);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  }, [transactions, isHydrated]);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem(SEASONAL_SETTINGS_KEY, JSON.stringify(seasonalSettings));
  }, [seasonalSettings, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (bannerDismissedThemeId) window.sessionStorage.setItem(BANNER_DISMISSED_KEY, bannerDismissedThemeId);
    else window.sessionStorage.removeItem(BANNER_DISMISSED_KEY);
  }, [bannerDismissedThemeId, isHydrated]);

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
    if (pkg.invoiceRequired) {
      addMessage(
        pkg.accountCode,
        "Invoice required",
        `${pkg.trackingNumber} needs a purchase invoice before it can be cleared. Upload it from your dashboard.`
      );
    }
  };

  const updatePackageStatus = (packageId: string, status: PackageStatus) => {
    // TODO: replace with a real backend + database call.
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg || pkg.status === status) return;
    setPackages((prev) => prev.map((p) => (p.id === packageId ? { ...p, status } : p)));
    addMessage(pkg.accountCode, "Package status updated", `${pkg.trackingNumber} is now ${status}.`);

    // A package ready for pickup has a real bill to pay — auto-create one
    // (base shipping charge) the first time it reaches this status, so admin
    // doesn't have to remember a separate "create bill" step.
    if (status === "Ready for Pickup" && !bills.some((b) => b.packageId === packageId)) {
      const lineItem = buildShippingLineItem(pkg.weightLb);
      const newBill: Bill = {
        id: crypto.randomUUID(),
        accountCode: pkg.accountCode,
        packageId,
        lineItems: [lineItem],
        total: lineItem.amount,
        amountPaid: 0,
        status: "unpaid",
        dueDate: formatDateOffset(14),
      };
      setBills((prev) => [...prev, newBill]);
      addMessage(
        pkg.accountCode,
        "Bill ready",
        `A bill of ${formatCurrency(lineItem.amount)} is ready for ${pkg.trackingNumber} — view it under Bills/Transactions.`
      );
    }
  };

  const getPackagesForAccount = (accountCode: string) => packages.filter((p) => p.accountCode === accountCode);
  const getMessagesForAccount = (accountCode: string) => messages.filter((m) => m.accountCode === accountCode);
  const markMessagesRead = (accountCode: string) => {
    setMessages((prev) => prev.map((m) => (m.accountCode === accountCode ? { ...m, read: true } : m)));
  };
  const addCustomer = (customer: Customer) => {
    // TODO: replace with a real backend + database call (this is what
    // app/signup/page.tsx calls right after a successful registration, so
    // new signups show up in the admin's "Add a package" customer picker).
    setCustomers((prev) => (prev.some((c) => c.accountCode === customer.accountCode) ? prev : [...prev, customer]));
  };

  const getInvoicesForAccount = (accountCode: string) => invoices.filter((inv) => inv.accountCode === accountCode);

  const submitInvoice = (input: NewInvoiceInput) => {
    // TODO: replace with a real backend + database call. One invoice per
    // package: re-submitting (e.g. after a rejection) replaces the files and
    // resets status to "pending"; the full history of attempts lives in
    // statusHistory rather than as separate records.
    const pkg = packages.find((p) => p.id === input.packageId);
    if (!pkg) return;
    const now = formatToday();

    setInvoices((prev) => {
      const existing = prev.find((inv) => inv.packageId === input.packageId);
      const record: Invoice = {
        id: existing?.id ?? crypto.randomUUID(),
        packageId: input.packageId,
        accountCode: input.accountCode,
        files: input.files,
        merchant: input.merchant,
        value: input.value,
        currency: input.currency,
        status: "pending",
        submittedAt: now,
        updatedAt: now,
        hasUnreviewedChanges: false,
        statusHistory: [
          ...(existing?.statusHistory ?? []),
          { status: "pending", at: now, note: existing ? "Re-submitted" : "Submitted" },
        ],
      };
      return existing ? prev.map((inv) => (inv.packageId === input.packageId ? record : inv)) : [record, ...prev];
    });

    addMessage(
      input.accountCode,
      "Invoice submitted",
      `Your invoice for ${pkg.trackingNumber} has been submitted and is pending review.`
    );
  };

  const reviewInvoice = (
    invoiceId: string,
    decision: Extract<InvoiceStatus, "approved" | "rejected">,
    rejectionReason?: string
  ) => {
    // TODO: replace with a real backend + database call. Server-side
    // authorization must confirm the caller is an admin — this is entirely
    // client-side today and trivially bypassable.
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;
    const pkg = packages.find((p) => p.id === invoice.packageId);
    const reviewedAt = formatToday();

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: decision,
              reviewedAt,
              updatedAt: reviewedAt,
              hasUnreviewedChanges: false,
              rejectionReason: decision === "rejected" ? rejectionReason : undefined,
              statusHistory: [
                ...inv.statusHistory,
                { status: decision, at: reviewedAt, note: decision === "approved" ? "Approved" : rejectionReason },
              ],
            }
          : inv
      )
    );

    const tracking = pkg?.trackingNumber ?? "your package";
    if (decision === "approved") {
      addMessage(invoice.accountCode, "Invoice approved", `Your invoice for ${tracking} has been approved.`);
    } else {
      addMessage(invoice.accountCode, "Invoice rejected", `Your invoice for ${tracking} was rejected: ${rejectionReason}`);
    }
  };

  const setPackageInvoiceRequired = (packageId: string, required: boolean) => {
    // TODO: replace with a real backend + database call.
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg || pkg.invoiceRequired === required) return;
    setPackages((prev) => prev.map((p) => (p.id === packageId ? { ...p, invoiceRequired: required } : p)));
    if (required) {
      addMessage(
        pkg.accountCode,
        "Invoice required",
        `${pkg.trackingNumber} needs a purchase invoice before it can be cleared. Upload it from your dashboard.`
      );
    }
  };

  // ---- Customer-side edits to an already-submitted invoice. Each of these
  // sets hasUnreviewedChanges so the admin sees an "updated by customer"
  // note without needing a full resubmit (see lib/invoices.ts for why a
  // boolean flag rather than comparing date strings). ----

  const addInvoiceFiles = (input: AddInvoiceFilesInput) => {
    // TODO: replace with a real backend + database call.
    const invoice = invoices.find((inv) => inv.id === input.invoiceId);
    if (!invoice) return;
    const pkg = packages.find((p) => p.id === invoice.packageId);
    const now = formatToday();

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === input.invoiceId
          ? {
              ...inv,
              files: [...inv.files, ...input.files],
              merchant: input.merchant ?? inv.merchant,
              value: input.value ?? inv.value,
              currency: input.currency ?? inv.currency,
              updatedAt: now,
              hasUnreviewedChanges: true,
              statusHistory: [...inv.statusHistory, { status: inv.status, at: now, note: `Customer added ${input.files.length} file(s)` }],
            }
          : inv
      )
    );

    if (pkg) {
      addMessage(
        invoice.accountCode,
        "Invoice updated",
        `You added ${input.files.length} file(s) to your invoice for ${pkg.trackingNumber}.`
      );
    }
  };

  const removeInvoiceFile = (invoiceId: string, fileId: string) => {
    // TODO: replace with a real backend + database call.
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;
    const file = invoice.files.find((f) => f.id === fileId);
    const pkg = packages.find((p) => p.id === invoice.packageId);
    const now = formatToday();

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              files: inv.files.filter((f) => f.id !== fileId),
              updatedAt: now,
              hasUnreviewedChanges: true,
              statusHistory: [...inv.statusHistory, { status: inv.status, at: now, note: `Customer removed a file (${file?.name ?? "file"})` }],
            }
          : inv
      )
    );

    if (file) deleteInvoiceFile(file);
    if (pkg) addMessage(invoice.accountCode, "Invoice updated", `You removed a file from your invoice for ${pkg.trackingNumber}.`);
  };

  const replaceInvoiceFileInInvoice = (invoiceId: string, oldFileId: string, newFile: UploadedInvoiceFile) => {
    // TODO: replace with a real backend + database call.
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;
    const pkg = packages.find((p) => p.id === invoice.packageId);
    const now = formatToday();

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              files: inv.files.map((f) => (f.id === oldFileId ? newFile : f)),
              updatedAt: now,
              hasUnreviewedChanges: true,
              statusHistory: [...inv.statusHistory, { status: inv.status, at: now, note: "Customer replaced a file" }],
            }
          : inv
      )
    );

    if (pkg) addMessage(invoice.accountCode, "Invoice updated", `You replaced a file in your invoice for ${pkg.trackingNumber}.`);
  };

  const withdrawInvoice = (invoiceId: string): Invoice | undefined => {
    // TODO: replace with a real backend + database call.
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return undefined;
    const pkg = packages.find((p) => p.id === invoice.packageId);
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    if (pkg) {
      addMessage(
        invoice.accountCode,
        "Invoice withdrawn",
        `You withdrew your invoice submission for ${pkg.trackingNumber}. Upload a new one when you're ready.`
      );
    }
    return invoice;
  };

  const restoreInvoice = (invoice: Invoice) => {
    // Undo for withdrawInvoice — re-inserts the exact removed record. Safe
    // to do without touching storage since withdrawing never deletes the
    // underlying files, only the invoice record referencing them.
    setInvoices((prev) => (prev.some((inv) => inv.id === invoice.id) ? prev : [invoice, ...prev]));
  };

  // ---- Billing: bills, wallet balance, and transactions. Wallet balance is
  // derived (deriveWalletBalance reads the last transaction's balanceAfter),
  // so every mutation below appends a Transaction rather than touching a
  // separate balance field — see lib/billing.ts for why. ----

  const getBillsForAccount = (accountCode: string) => bills.filter((b) => b.accountCode === accountCode);
  const getTransactionsForAccount = (accountCode: string) => transactions.filter((t) => t.accountCode === accountCode);
  const getWalletBalance = (accountCode: string) => deriveWalletBalance(transactions, accountCode);

  const addTransaction = (input: {
    accountCode: string;
    type: Transaction["type"];
    amount: number;
    description: string;
    reference?: string;
    balanceAfter: number;
  }): Transaction => {
    const txn: Transaction = { id: crypto.randomUUID(), createdAt: formatToday(), ...input };
    // Appended (not prepended) — getWalletBalance reads the *last* entry as
    // the current balance, so storage order must stay oldest-first.
    setTransactions((prev) => [...prev, txn]);
    return txn;
  };

  const payBillsFromWallet = (billIds: string[]): PayBillsResult => {
    // TODO: replace with a real backend + payment processor call. This only
    // handles the wallet-balance path — card/bank never reach here (see
    // initiateHostedPayment in lib/billing.ts).
    const selected = bills.filter((b) => billIds.includes(b.id));
    if (selected.length === 0) return { success: false, error: "No bills selected." };
    const accountCode = selected[0].accountCode;
    const balance = deriveWalletBalance(transactions, accountCode);
    const now = formatToday();

    if (selected.length === 1) {
      const bill = selected[0];
      const due = billBalanceDue(bill);
      if (balance <= 0) {
        return { success: false, error: "Your wallet balance is J$0.00 — top up to pay this bill." };
      }
      const payAmount = Math.min(balance, due);
      const newAmountPaid = bill.amountPaid + payAmount;
      const newStatus: BillStatus = newAmountPaid >= bill.total ? "paid" : "partially_paid";
      const newBalance = balance - payAmount;
      const pkg = packages.find((p) => p.id === bill.packageId);

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id ? { ...b, amountPaid: newAmountPaid, status: newStatus, paidAt: newStatus === "paid" ? now : b.paidAt } : b
        )
      );
      const transaction = addTransaction({
        accountCode,
        type: "payment",
        amount: -payAmount,
        description: `Payment — ${pkg?.trackingNumber ?? "package"}`,
        reference: pkg?.trackingNumber,
        balanceAfter: newBalance,
      });
      addMessage(accountCode, "Payment received", `We received your payment of ${formatCurrency(payAmount)} for ${pkg?.trackingNumber ?? "your package"}.`);

      return { success: true, shortfall: bill.total - newAmountPaid, transaction };
    }

    // Multi-select "Pay Selected": requires full coverage — no splitting a
    // partial payment across several bills at once.
    const due = sumBalanceDue(selected);
    if (balance < due) {
      return {
        success: false,
        error: `Your wallet balance (${formatCurrency(balance)}) is ${formatCurrency(due - balance)} short of the combined total (${formatCurrency(due)}).`,
      };
    }
    const newBalance = balance - due;
    setBills((prev) => prev.map((b) => (billIds.includes(b.id) ? { ...b, amountPaid: b.total, status: "paid", paidAt: now } : b)));
    const trackingList = selected
      .map((b) => packages.find((p) => p.id === b.packageId)?.trackingNumber)
      .filter(Boolean)
      .join(", ");
    const transaction = addTransaction({
      accountCode,
      type: "payment",
      amount: -due,
      description: `Payment — ${selected.length} bills (${trackingList})`,
      balanceAfter: newBalance,
    });
    addMessage(accountCode, "Payment received", `We received your payment of ${formatCurrency(due)} across ${selected.length} bills.`);
    return { success: true, shortfall: 0, transaction };
  };

  const markBillsPendingBranch = (billIds: string[]) => {
    const selected = bills.filter((b) => billIds.includes(b.id));
    if (selected.length === 0) return;
    setBills((prev) => prev.map((b) => (billIds.includes(b.id) ? { ...b, status: "pending_branch" } : b)));
    addMessage(
      selected[0].accountCode,
      "Pay at branch",
      `You chose to pay ${selected.length > 1 ? `${selected.length} bills` : "a bill"} in cash at the branch.`
    );
  };

  const addLineItemToBill = (packageId: string, item: LineItem) => {
    // TODO: replace with a real backend + database call.
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;
    const existing = bills.find((b) => b.packageId === packageId);

    if (existing) {
      const newLineItems = [...existing.lineItems, item];
      const newTotal = computeBillTotal(newLineItems);
      const newStatus: BillStatus =
        existing.status === "pending_branch"
          ? "pending_branch"
          : existing.amountPaid <= 0
            ? "unpaid"
            : existing.amountPaid < newTotal
              ? "partially_paid"
              : "paid";
      setBills((prev) =>
        prev.map((b) => (b.id === existing.id ? { ...b, lineItems: newLineItems, total: newTotal, status: newStatus } : b))
      );
    } else {
      const newBill: Bill = {
        id: crypto.randomUUID(),
        accountCode: pkg.accountCode,
        packageId,
        lineItems: [item],
        total: item.amount,
        amountPaid: 0,
        status: "unpaid",
        dueDate: formatDateOffset(14),
      };
      setBills((prev) => [...prev, newBill]);
    }

    addMessage(pkg.accountCode, "New charge added", `${item.label} (${formatCurrency(item.amount)}) was added to your bill for ${pkg.trackingNumber}.`);
  };

  const markBillPaidByAdmin = (billId: string) => {
    // Cash collected at the branch — real money changed hands, but not
    // through the wallet, so balanceAfter carries forward unchanged.
    const bill = bills.find((b) => b.id === billId);
    if (!bill || bill.status === "paid") return;
    const pkg = packages.find((p) => p.id === bill.packageId);
    const now = formatToday();
    const remaining = billBalanceDue(bill);

    setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, amountPaid: b.total, status: "paid", paidAt: now } : b)));
    addTransaction({
      accountCode: bill.accountCode,
      type: "payment",
      amount: -remaining,
      description: `Payment — cash at branch (${pkg?.trackingNumber ?? "package"})`,
      reference: pkg?.trackingNumber,
      balanceAfter: deriveWalletBalance(transactions, bill.accountCode),
    });
    addMessage(bill.accountCode, "Payment confirmed", `Your payment for ${pkg?.trackingNumber ?? "your package"} was confirmed as paid in cash at the branch.`);
  };

  const creditWallet = (accountCode: string, amount: number, note?: string) => {
    // TODO: replace with a real backend + database call.
    if (amount <= 0) return;
    const newBalance = deriveWalletBalance(transactions, accountCode) + amount;
    addTransaction({
      accountCode,
      type: "topup",
      amount,
      description: note?.trim() ? `Wallet top-up — ${note.trim()}` : "Wallet top-up",
      balanceAfter: newBalance,
    });
    addMessage(accountCode, "Wallet credited", `${formatCurrency(amount)} was added to your wallet.${note?.trim() ? ` (${note.trim()})` : ""}`);
  };

  const issueRefund = (accountCode: string, amount: number, note?: string) => {
    // TODO: replace with a real backend + database call.
    if (amount <= 0) return;
    const newBalance = deriveWalletBalance(transactions, accountCode) + amount;
    addTransaction({
      accountCode,
      type: "refund",
      amount,
      description: note?.trim() ? `Refund — ${note.trim()}` : "Refund",
      balanceAfter: newBalance,
    });
    addMessage(accountCode, "Refund issued", `A refund of ${formatCurrency(amount)} was credited to your wallet.${note?.trim() ? ` (${note.trim()})` : ""}`);
  };

  // ---- Seasonal themes: a decorative layer on top of light/dark mode, not
  // a replacement for it. See lib/seasonal-themes.ts for the registry and
  // resolution logic — this is just a thin reactive wrapper around it. ----

  const updateSeasonalSettings = (partial: Partial<SeasonalSettings>) => {
    // TODO: replace with a real backend-driven site setting. With no backend,
    // this only reflects within the current browser — an admin's selection
    // won't sync to customers on other devices/browsers.
    setSeasonalSettings((prev) => ({ ...prev, ...partial }));
  };

  const getActiveSeasonalTheme = (pageScope: "portal" | "public") =>
    resolveActiveSeasonalTheme(seasonalSettings, pageScope, new Date());

  const isSeasonalBannerVisible = (pageScope: "portal" | "public") =>
    isBannerVisible(getActiveSeasonalTheme(pageScope), bannerDismissedThemeId);

  const dismissSeasonalBanner = (themeId: string) => {
    setBannerDismissedThemeId(themeId);
  };

  return (
    <DataStoreContext.Provider
      value={{
        packages,
        messages,
        customers,
        invoices,
        bills,
        transactions,
        getPackagesForAccount,
        getMessagesForAccount,
        getInvoicesForAccount,
        getBillsForAccount,
        getTransactionsForAccount,
        getWalletBalance,
        addPackage,
        updatePackageStatus,
        markMessagesRead,
        addCustomer,
        submitInvoice,
        reviewInvoice,
        setPackageInvoiceRequired,
        addInvoiceFiles,
        removeInvoiceFile,
        replaceInvoiceFileInInvoice,
        withdrawInvoice,
        restoreInvoice,
        payBillsFromWallet,
        markBillsPendingBranch,
        addLineItemToBill,
        markBillPaidByAdmin,
        creditWallet,
        issueRefund,
        seasonalSettings,
        updateSeasonalSettings,
        getActiveSeasonalTheme,
        isSeasonalBannerVisible,
        dismissSeasonalBanner,
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
