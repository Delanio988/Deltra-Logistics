"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { motion } from "framer-motion";
import type { Package } from "@/lib/dashboard-data";
import { INVOICE_CURRENCIES, type Invoice } from "@/lib/invoices";
import {
  ACCEPT_ATTR,
  MAX_FILES_PER_INVOICE,
  MAX_FILE_SIZE_MB,
  formatFileSize,
  isThumbnailableImage,
  uploadInvoiceFile,
  validateInvoiceFile,
  type UploadedInvoiceFile,
} from "@/lib/uploads";
import { useDataStore } from "@/lib/data-store";
import { useModalA11y } from "@/lib/useModalA11y";
import { useReducedMotion } from "@/lib/useReducedMotion";
import MagneticButton from "@/components/ui/MagneticButton";
import { cn } from "@/lib/utils";

type PendingFile = {
  localId: string;
  file: File;
  status: "uploading" | "done";
  progress: number;
  result?: UploadedInvoiceFile;
};

type InvoiceUploadModalProps = {
  pkg: Package;
  /** Set when re-uploading after a rejection — pre-fills the optional fields. */
  existingInvoice?: Invoice;
  onClose: () => void;
  onSubmitted: (message: string) => void;
};

const FileIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M6 3h9l3 3v15H6z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
  </svg>
);

const UploadIcon = (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M12 16V4M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);

/**
 * Upload (or re-upload) an invoice for a specific package. Rendered by the
 * caller inside <AnimatePresence> so its exit animation plays — this
 * component only owns the two nested motion.divs, not its own
 * AnimatePresence (nesting one here would unmount before the exit
 * transition could run).
 */
export default function InvoiceUploadModal({ pkg, existingInvoice, onClose, onSubmitted }: InvoiceUploadModalProps) {
  const { submitInvoice, addInvoiceFiles } = useDataStore();
  const prefersReducedMotion = useReducedMotion();
  // A pending invoice's modal adds files alongside what's already there
  // instead of replacing everything — a fresh upload or a rejected
  // resubmit both still replace the whole file list.
  const isAppendMode = existingInvoice?.status === "pending";
  const existingFileCount = isAppendMode ? existingInvoice.files.length : 0;
  const headingId = useId();
  const fileInputId = useId();
  const merchantId = useId();
  const valueId = useId();
  const currencyId = useId();

  const containerRef = useRef<HTMLDivElement>(null);
  const hasSubmittedRef = useRef(false);
  const pendingFilesRef = useRef<PendingFile[]>([]);
  const dragCounterRef = useRef(0);

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [merchant, setMerchant] = useState(existingInvoice?.merchant ?? "");
  const [value, setValue] = useState(existingInvoice?.value?.toString() ?? "");
  const [currency, setCurrency] = useState(existingInvoice?.currency ?? INVOICE_CURRENCIES[0]);

  pendingFilesRef.current = pendingFiles;

  useModalA11y(containerRef, onClose);

  // Object URLs for any files the user added but never submitted are
  // revoked on unmount, so closing the modal without submitting doesn't
  // leak them.
  useEffect(() => {
    return () => {
      if (!hasSubmittedRef.current) {
        pendingFilesRef.current.forEach((f) => {
          if (f.result?.url) URL.revokeObjectURL(f.result.url);
        });
      }
    };
  }, []);

  const addFiles = (files: File[]) => {
    const entries: PendingFile[] = files.map((file) => ({
      localId: crypto.randomUUID(),
      file,
      status: "uploading",
      progress: 0,
    }));
    setPendingFiles((prev) => [...prev, ...entries]);
    entries.forEach((entry) => {
      uploadInvoiceFile(entry.file, (pct) => {
        setPendingFiles((prev) => prev.map((f) => (f.localId === entry.localId ? { ...f, progress: pct } : f)));
      }).then((result) => {
        setPendingFiles((prev) =>
          prev.map((f) => (f.localId === entry.localId ? { ...f, status: "done", progress: 100, result } : f))
        );
      });
    });
  };

  const handleFilesSelected = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    const errors: string[] = [];
    const valid: File[] = [];
    for (const file of incoming) {
      const err = validateInvoiceFile(file);
      if (err) errors.push(err);
      else valid.push(file);
    }

    const remainingSlots = Math.max(0, MAX_FILES_PER_INVOICE - existingFileCount - pendingFiles.length);
    let accepted = valid;
    if (valid.length > remainingSlots) {
      accepted = valid.slice(0, remainingSlots);
      const dropped = valid.length - accepted.length;
      errors.push(`Only ${MAX_FILES_PER_INVOICE} files allowed per invoice — ${dropped} file(s) not added.`);
    }

    setFileErrors(errors);
    if (accepted.length > 0) addFiles(accepted);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFilesSelected(e.target.files);
    e.target.value = "";
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDragActive(true);
  };
  const handleDragOver = (e: DragEvent) => e.preventDefault();
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragActive(false);
    }
  };
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragActive(false);
    if (e.dataTransfer.files?.length) handleFilesSelected(e.dataTransfer.files);
  };

  const handleRemove = (localId: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.localId === localId);
      if (target?.result?.url) URL.revokeObjectURL(target.result.url);
      return prev.filter((f) => f.localId !== localId);
    });
  };

  const doneFiles = pendingFiles.filter((f): f is PendingFile & { result: UploadedInvoiceFile } => f.status === "done" && Boolean(f.result));
  const isUploading = pendingFiles.some((f) => f.status === "uploading");
  const canSubmit = doneFiles.length > 0 && !isUploading;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const parsedValue = value.trim() ? parseFloat(value) : NaN;
    const resolvedMerchant = merchant.trim() || undefined;
    const resolvedValue = Number.isFinite(parsedValue) ? parsedValue : undefined;

    if (isAppendMode && existingInvoice) {
      addInvoiceFiles({
        invoiceId: existingInvoice.id,
        files: doneFiles.map((f) => f.result),
        merchant: resolvedMerchant,
        value: resolvedValue,
        currency,
      });
      hasSubmittedRef.current = true;
      onSubmitted(`Added ${doneFiles.length} file(s) to your invoice for ${pkg.trackingNumber}.`);
    } else {
      submitInvoice({
        packageId: pkg.id,
        accountCode: pkg.accountCode,
        files: doneFiles.map((f) => f.result),
        merchant: resolvedMerchant,
        value: resolvedValue,
        currency,
      });
      hasSubmittedRef.current = true;
      onSubmitted(`Invoice ${existingInvoice ? "re-submitted" : "submitted"} for ${pkg.trackingNumber} — pending review.`);
    }
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-fg/8 bg-surface p-6 shadow-card outline-none sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={headingId} className="text-xl font-bold text-fg">
              {isAppendMode ? "Add files to invoice" : existingInvoice ? "Re-upload invoice" : "Upload invoice"}
            </h2>
            <p className="mt-1 truncate text-sm text-fg/60">
              <span className="font-mono">{pkg.trackingNumber}</span> — {pkg.merchant} · {pkg.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-cursor-hover="Close"
            className="shrink-0 rounded-full p-2 text-fg/50 transition-colors hover:bg-fg/5 hover:text-accent"
          >
            {CloseIcon}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <div onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              <label
                htmlFor={fileInputId}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                  isDragActive
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-fg/15 text-fg/60 hover:border-accent/50 hover:text-accent"
                )}
              >
                <span aria-hidden>{UploadIcon}</span>
                <span className="text-sm font-medium">
                  Drag and drop files here, or <span className="text-accent underline">browse</span>
                </span>
                <span className="text-xs text-fg/40">
                  JPG, PNG, WEBP, HEIC, or PDF · up to {MAX_FILE_SIZE_MB}MB each
                  {isAppendMode
                    ? ` · ${Math.max(0, MAX_FILES_PER_INVOICE - existingFileCount)} more file(s) allowed`
                    : ` · up to ${MAX_FILES_PER_INVOICE} files`}
                </span>
                <input
                  id={fileInputId}
                  type="file"
                  multiple
                  accept={ACCEPT_ATTR}
                  capture="environment"
                  onChange={handleInputChange}
                  className="sr-only"
                />
              </label>
            </div>

            {fileErrors.length > 0 && (
              <div
                role="alert"
                className="mt-3 space-y-1 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-xs text-accent-text"
              >
                {fileErrors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
          </div>

          {pendingFiles.length > 0 && (
            <ul className="space-y-2">
              {pendingFiles.map((f) => (
                <li key={f.localId} className="flex items-center gap-3 rounded-xl border border-fg/8 bg-fg/[0.03] p-3">
                  {f.status === "done" && f.result && isThumbnailableImage(f.result.type) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- transient blob: preview, not a static asset
                    <img src={f.result.url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fg/5 text-fg/50"
                      aria-hidden
                    >
                      {FileIcon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{f.file.name}</p>
                    <p className="text-xs text-fg/40">{formatFileSize(f.file.size)}</p>
                    {f.status === "uploading" && (
                      <div
                        className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-fg/10"
                        role="progressbar"
                        aria-label={`Uploading ${f.file.name}`}
                        aria-valuenow={f.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${f.progress}%` }} />
                      </div>
                    )}
                  </div>
                  {f.status === "done" && (
                    <span className="shrink-0 text-green-600 dark:text-green-400" aria-hidden>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(f.localId)}
                    aria-label={`Remove ${f.file.name}`}
                    data-cursor-hover="Remove"
                    className="shrink-0 rounded-full p-1.5 text-fg/40 transition-colors hover:bg-fg/5 hover:text-accent"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={merchantId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
                Merchant / store <span className="normal-case font-normal text-fg/35">(optional)</span>
              </label>
              <input
                id={merchantId}
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Amazon"
                className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor={valueId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
                Item value <span className="normal-case font-normal text-fg/35">(optional)</span>
              </label>
              <div className="mt-2 flex gap-2">
                <label htmlFor={currencyId} className="sr-only">
                  Currency
                </label>
                <select
                  id={currencyId}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-24 shrink-0 rounded-full border border-fg/15 bg-fg/5 px-3 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
                >
                  {INVOICE_CURRENCIES.map((c) => (
                    <option key={c} value={c} className="bg-surface text-fg">
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  id={valueId}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-w-0 flex-1 rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
                />
              </div>
            </div>
          </div>

          <MagneticButton
            type="submit"
            disabled={!canSubmit}
            cursorLabel="Submit"
            className="w-full justify-center bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white disabled:opacity-50"
          >
            {isUploading ? "Uploading…" : isAppendMode ? "Add files" : existingInvoice ? "Re-submit invoice" : "Submit invoice"}
          </MagneticButton>
        </form>
      </motion.div>
    </motion.div>
  );
}
