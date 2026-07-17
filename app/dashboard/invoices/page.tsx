"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import RequireAuth from "@/components/auth/RequireAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import InvoiceUploadModal from "@/components/dashboard/InvoiceUploadModal";
import InvoiceLightbox from "@/components/ui/InvoiceLightbox";
import InvoiceStatusBadge from "@/components/ui/InvoiceStatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useAuth } from "@/lib/auth-context";
import { useDataStore } from "@/lib/data-store";
import type { Package } from "@/lib/dashboard-data";
import {
  formatInvoiceValue,
  getInvoiceForPackage,
  getPackagesAwaitingFirstUpload,
  type Invoice,
} from "@/lib/invoices";
import { ACCEPT_ATTR, formatFileSize, isThumbnailableImage, replaceInvoiceFile, validateInvoiceFile } from "@/lib/uploads";

type ActiveUpload = { pkg: Package; invoice?: Invoice };
type ViewingFile = { invoice: Invoice; pkg: Package; index: number };
type ConfirmAction =
  | { type: "remove-file"; invoice: Invoice; pkg: Package; fileId: string; fileName: string }
  | { type: "withdraw"; invoice: Invoice; pkg: Package };
type ToastState = { message: string; action?: { label: string; onClick: () => void } };

const ReplaceIcon = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 9a8 8 0 0114-4M20 15a8 8 0 01-14 4" strokeLinecap="round" />
    <path d="M18 2v5h-5M6 22v-5h5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RemoveIcon = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);

const SpinnerIcon = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 3a9 9 0 106.7 3" strokeLinecap="round" />
  </svg>
);

const LOCKED_TOOLTIP = "Approved invoices can't be changed. Contact your branch if something's wrong.";

function LockedButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      tabIndex={0}
      title={LOCKED_TOOLTIP}
      onClick={(e) => e.preventDefault()}
      className="cursor-not-allowed rounded-full border border-fg/10 px-5 py-2 text-xs font-semibold text-fg/30"
    >
      {label}
    </button>
  );
}

function InvoicesContent() {
  const { user } = useAuth();
  const {
    getPackagesForAccount,
    getInvoicesForAccount,
    removeInvoiceFile,
    replaceInvoiceFileInInvoice,
    withdrawInvoice,
    restoreInvoice,
  } = useDataStore();

  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);
  const [viewing, setViewing] = useState<ViewingFile | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [replacingFileId, setReplacingFileId] = useState<string | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<{ invoice: Invoice; fileId: string } | null>(null);

  const accountCode = user?.accountCode ?? "";
  const packages = getPackagesForAccount(accountCode);
  const invoices = getInvoicesForAccount(accountCode);
  const awaiting = getPackagesAwaitingFirstUpload(packages, invoices);
  const submitted = packages
    .map((pkg) => ({ pkg, invoice: getInvoiceForPackage(invoices, pkg.id) }))
    .filter((row): row is { pkg: Package; invoice: Invoice } => Boolean(row.invoice));

  // Falls back to the page heading if the element that opened a modal isn't
  // in the document anymore by the time it closes (e.g. withdrawing removes
  // the very card its "Withdraw" button lived on).
  const restoreFocus = () => {
    const el = triggerRef.current;
    if (el && document.body.contains(el)) el.focus();
    else headingRef.current?.focus();
  };

  const showToast = (message: string, action?: ToastState["action"]) => setToast({ message, action });

  const openUpload = (pkg: Package, invoice: Invoice | undefined, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setActiveUpload({ pkg, invoice });
  };
  const closeUpload = () => {
    setActiveUpload(null);
    restoreFocus();
  };

  const openViewer = (invoice: Invoice, pkg: Package, index: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setViewing({ invoice, pkg, index });
  };
  const closeViewer = () => {
    setViewing(null);
    restoreFocus();
  };

  const cancelConfirm = () => {
    setConfirmAction(null);
    restoreFocus();
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "remove-file") {
      removeInvoiceFile(confirmAction.invoice.id, confirmAction.fileId);
      showToast(`Removed ${confirmAction.fileName}.`);
    } else {
      const removed = withdrawInvoice(confirmAction.invoice.id);
      if (removed) {
        showToast(`Withdrew your invoice submission for ${confirmAction.pkg.trackingNumber}.`, {
          label: "Undo",
          onClick: () => restoreInvoice(removed),
        });
      }
    }
    setConfirmAction(null);
    restoreFocus();
  };

  const startReplace = (invoice: Invoice, fileId: string) => {
    replaceTargetRef.current = { invoice, fileId };
    replaceInputRef.current?.click();
  };

  const requestRemoveFile = (invoice: Invoice, pkg: Package, fileId: string, fileName: string, trigger: HTMLElement) => {
    if (invoice.files.length <= 1) return;
    triggerRef.current = trigger;
    setConfirmAction({ type: "remove-file", invoice, pkg, fileId, fileName });
  };

  const requestWithdraw = (invoice: Invoice, pkg: Package, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setConfirmAction({ type: "withdraw", invoice, pkg });
  };

  const handleReplaceSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const target = replaceTargetRef.current;
    if (!file || !target) return;

    const err = validateInvoiceFile(file);
    if (err) {
      showToast(err);
      return;
    }

    const oldFile = target.invoice.files.find((f) => f.id === target.fileId);
    setReplacingFileId(target.fileId);
    const result = await replaceInvoiceFile(oldFile ?? {}, file);
    replaceInvoiceFileInInvoice(target.invoice.id, target.fileId, result);
    setReplacingFileId(null);
    showToast(`Replaced ${oldFile?.name ?? "the file"} with ${file.name}.`);
  };

  return (
    <div className="min-h-screen bg-bg">
      <DashboardHeader />
      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleReplaceSelected}
      />

      <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
        <ScrollReveal direction="none">
          <Link href="/dashboard" className="text-sm font-medium text-fg/60 transition-colors hover:text-accent">
            ← Back to dashboard
          </Link>
          <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-display-sm font-extrabold text-fg outline-none">
            Invoices
          </h1>
          <p className="mt-2 text-fg/60">Upload proof of purchase for packages that need customs clearance.</p>
        </ScrollReveal>

        <ScrollReveal index={0} className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Awaiting invoice</h2>
          {awaiting.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-fg/8 bg-surface p-8 text-center shadow-card">
              <p className="text-sm font-medium text-fg/70">You&rsquo;re all caught up — no invoices required.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {awaiting.map((pkg) => (
                <li
                  key={pkg.id}
                  className="flex flex-col gap-4 rounded-2xl border border-fg/8 bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-fg">{pkg.trackingNumber}</span>
                      <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        Invoice Required
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-fg/70">
                      {pkg.merchant} — {pkg.description}
                    </p>
                    <p className="mt-1 text-sm text-fg/50">
                      {pkg.weightLb} lb · Received {pkg.dateReceived}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-cursor-hover="Upload"
                    onClick={(e) => openUpload(pkg, undefined, e.currentTarget)}
                    className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-accent-dark hover:text-white"
                  >
                    Upload Invoice
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollReveal>

        {submitted.length > 0 && (
          <ScrollReveal index={1} className="mt-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Submitted invoices</h2>
            <ul className="mt-4 space-y-3">
              {submitted.map(({ pkg, invoice }) => {
                const isPending = invoice.status === "pending";
                const isRejected = invoice.status === "rejected";
                const isApproved = invoice.status === "approved";

                return (
                  <li key={invoice.id} className="rounded-2xl border border-fg/8 bg-surface p-6 shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-fg">{pkg.trackingNumber}</span>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                      <span className="text-xs text-fg/40">Submitted {invoice.submittedAt}</span>
                    </div>
                    <p className="mt-2 text-sm text-fg/70">
                      {pkg.merchant} — {pkg.description}
                    </p>
                    {(invoice.merchant || invoice.value !== undefined) && (
                      <p className="mt-1 text-sm text-fg/50">
                        {invoice.merchant && <>Purchased from {invoice.merchant}</>}
                        {invoice.merchant && invoice.value !== undefined && " · "}
                        {invoice.value !== undefined && formatInvoiceValue(invoice.value, invoice.currency ?? "USD")}
                      </p>
                    )}

                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {invoice.files.map((file, i) => (
                        <li
                          key={file.id}
                          className="flex items-center gap-0.5 rounded-full border border-fg/10 bg-fg/5 py-1 pl-1 pr-1.5"
                        >
                          <button
                            type="button"
                            onClick={(e) => openViewer(invoice, pkg, i, e.currentTarget)}
                            data-cursor-hover="View"
                            className="flex items-center gap-2 rounded-full px-2 py-0.5 text-xs text-fg/70 transition-colors hover:text-accent"
                          >
                            {file.url && isThumbnailableImage(file.type) ? (
                              // eslint-disable-next-line @next/next/no-img-element -- transient blob: thumbnail
                              <img src={file.url} alt="" className="h-4 w-4 rounded object-cover" />
                            ) : null}
                            <span className="max-w-[8rem] truncate">{file.name}</span>
                            <span className="text-fg/40">{formatFileSize(file.size)}</span>
                          </button>
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => startReplace(invoice, file.id)}
                                disabled={replacingFileId === file.id}
                                aria-label={`Replace ${file.name}`}
                                data-cursor-hover="Replace"
                                className="flex h-6 w-6 items-center justify-center rounded-full text-fg/40 transition-colors hover:bg-fg/5 hover:text-accent disabled:opacity-50"
                              >
                                {replacingFileId === file.id ? SpinnerIcon : ReplaceIcon}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => requestRemoveFile(invoice, pkg, file.id, file.name, e.currentTarget)}
                                disabled={invoice.files.length <= 1}
                                aria-label={`Remove ${file.name}`}
                                title={invoice.files.length <= 1 ? "Withdraw the submission to remove the last file." : undefined}
                                data-cursor-hover="Remove"
                                className="flex h-6 w-6 items-center justify-center rounded-full text-fg/40 transition-colors hover:bg-fg/5 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                {RemoveIcon}
                              </button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                    {!invoice.files.some((f) => f.url) && (
                      <p className="mt-2 text-xs text-fg/35">Preview unavailable after reload — demo storage only.</p>
                    )}

                    {isRejected && (
                      <div className="mt-4 rounded-xl border-l-2 border-accent/60 bg-accent/5 px-4 py-3">
                        <p className="text-xs text-fg/70">
                          <span className="font-semibold text-accent-text">Reason: </span>
                          {invoice.rejectionReason}
                        </p>
                        <button
                          type="button"
                          data-cursor-hover="Re-upload"
                          onClick={(e) => openUpload(pkg, invoice, e.currentTarget)}
                          className="mt-3 rounded-full border border-accent/40 px-5 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/10"
                        >
                          Re-upload
                        </button>
                      </div>
                    )}

                    {isPending && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          data-cursor-hover="Add files"
                          onClick={(e) => openUpload(pkg, invoice, e.currentTarget)}
                          className="rounded-full border border-fg/15 px-5 py-2 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
                        >
                          Add files
                        </button>
                        <button
                          type="button"
                          data-cursor-hover="Withdraw"
                          onClick={(e) => requestWithdraw(invoice, pkg, e.currentTarget)}
                          className="rounded-full border border-fg/15 px-5 py-2 text-xs font-semibold text-fg/60 transition-colors hover:border-accent hover:text-accent"
                        >
                          Withdraw submission
                        </button>
                      </div>
                    )}

                    {isApproved && (
                      <div className="mt-4 rounded-xl border border-fg/8 bg-fg/[0.03] px-4 py-3">
                        <p className="text-xs text-fg/60">This invoice has been approved and can no longer be changed. Contact your branch if something&rsquo;s wrong.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <LockedButton label="Add files" />
                          <LockedButton label="Withdraw submission" />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollReveal>
        )}
      </main>

      <AnimatePresence>
        {activeUpload && (
          <InvoiceUploadModal
            key={activeUpload.pkg.id}
            pkg={activeUpload.pkg}
            existingInvoice={activeUpload.invoice}
            onClose={closeUpload}
            onSubmitted={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewing && (
          <InvoiceLightbox
            key={viewing.invoice.id}
            files={viewing.invoice.files}
            initialIndex={viewing.index}
            trackingNumber={viewing.pkg.trackingNumber}
            description={viewing.pkg.description}
            statusHistory={viewing.invoice.statusHistory}
            onClose={closeViewer}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmAction && (
          <ConfirmDialog
            title={confirmAction.type === "withdraw" ? "Withdraw this submission?" : "Remove this file?"}
            message={
              confirmAction.type === "withdraw"
                ? `This puts ${confirmAction.pkg.trackingNumber} back to "Invoice Required." You can undo this from the confirmation toast for a few seconds.`
                : "This can't be undone."
            }
            confirmLabel={confirmAction.type === "withdraw" ? "Withdraw" : "Remove"}
            onConfirm={handleConfirm}
            onCancel={cancelConfirm}
          />
        )}
      </AnimatePresence>

      <Toast message={toast?.message ?? null} action={toast?.action} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <RequireAuth role="customer">
      <InvoicesContent />
    </RequireAuth>
  );
}
