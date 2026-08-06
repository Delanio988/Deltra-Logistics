"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PRE_ALERT_CURRENCIES, type PreAlert } from "@/lib/pre-alerts";
import {
  ACCEPT_ATTR,
  MAX_FILE_SIZE_MB,
  formatFileSize,
  isThumbnailableImage,
  uploadPreAlertFile,
  validatePreAlertFile,
  type UploadedPreAlertFile,
} from "@/lib/pre-alert-uploads";
import { createPreAlert, updatePreAlert } from "@/lib/actions/pre-alerts";
import { useModalA11y } from "@/lib/useModalA11y";
import { useReducedMotion } from "@/lib/useReducedMotion";
import MagneticButton from "@/components/ui/MagneticButton";
import { cn } from "@/lib/utils";

type PendingFile = {
  localId: string;
  file: File;
  status: "uploading" | "done";
  progress: number;
  result?: UploadedPreAlertFile;
};

type PreAlertFormModalProps = {
  /** Set when editing an already-submitted pre-alert (only ever passed while
   *  it's still "Awaiting Arrival" — the UI hides editing once matched). */
  existingPreAlert?: PreAlert;
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
 * Create or edit a pre-alert. Rendered by the caller inside <AnimatePresence>
 * so its exit animation plays — mirrors InvoiceUploadModal's shell, but for a
 * single required-fields form instead of an always-optional file list.
 */
export default function PreAlertFormModal({ existingPreAlert, onClose, onSubmitted }: PreAlertFormModalProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const isEditMode = Boolean(existingPreAlert);
  const headingId = useId();
  const fileInputId = useId();
  const merchantId = useId();
  const trackingId = useId();
  const descriptionId = useId();
  const valueId = useId();
  const currencyId = useId();

  const containerRef = useRef<HTMLDivElement>(null);
  const hasSubmittedRef = useRef(false);
  const pendingFileRef = useRef<PendingFile | null>(null);
  const dragCounterRef = useRef(0);

  const [merchant, setMerchant] = useState(existingPreAlert?.merchant ?? "");
  const [trackingNumber, setTrackingNumber] = useState(existingPreAlert?.trackingNumber ?? "");
  const [description, setDescription] = useState(existingPreAlert?.description ?? "");
  const [value, setValue] = useState(existingPreAlert?.declaredValue?.toString() ?? "");
  const [currency, setCurrency] = useState(existingPreAlert?.currency ?? PRE_ALERT_CURRENCIES[0]);
  const [existingFile, setExistingFile] = useState(existingPreAlert?.files[0]);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  pendingFileRef.current = pendingFile;

  useModalA11y(containerRef, onClose);

  // A local preview URL for a file added but never submitted is revoked on
  // unmount, so closing the modal without submitting doesn't leak it.
  useEffect(() => {
    return () => {
      if (!hasSubmittedRef.current && pendingFileRef.current?.result?.url) {
        URL.revokeObjectURL(pendingFileRef.current.result.url);
      }
    };
  }, []);

  const markTouched = (field: string) => setTouched((t) => ({ ...t, [field]: true }));
  const showError = (field: string, message: string | null) => (touched[field] ? message : null);

  const merchantError = !merchant.trim() ? "Merchant / store is required." : null;
  const trackingNumberError = !trackingNumber.trim() ? "Tracking number is required." : null;
  const descriptionError = !description.trim() ? "Description is required." : null;
  const parsedValue = value.trim() ? parseFloat(value) : NaN;
  const valueError = !value.trim()
    ? "Declared value is required."
    : !Number.isFinite(parsedValue) || parsedValue <= 0
      ? "Enter a valid positive value."
      : null;

  const isUploading = pendingFile?.status === "uploading";
  const isFormValid = !merchantError && !trackingNumberError && !descriptionError && !valueError && !isUploading;

  const addFile = (file: File) => {
    const err = validatePreAlertFile(file);
    if (err) {
      setFileError(err);
      return;
    }
    setFileError(null);
    const entry: PendingFile = { localId: crypto.randomUUID(), file, status: "uploading", progress: 0 };
    setPendingFile(entry);
    uploadPreAlertFile(file, (pct) => {
      setPendingFile((prev) => (prev?.localId === entry.localId ? { ...prev, progress: pct } : prev));
    }).then((result) => {
      setPendingFile((prev) => (prev?.localId === entry.localId ? { ...prev, status: "done", progress: 100, result } : prev));
    });
  };

  const handleFilesSelected = (fileList: FileList | File[]) => {
    const [file] = Array.from(fileList);
    if (file) addFile(file);
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

  const handleRemovePendingFile = () => {
    if (pendingFile?.result?.url) URL.revokeObjectURL(pendingFile.result.url);
    setPendingFile(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ merchant: true, trackingNumber: true, description: true, value: true });
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const trimmedTracking = trackingNumber.trim();
    const result =
      isEditMode && existingPreAlert
        ? await updatePreAlert({
            id: existingPreAlert.id,
            merchant: merchant.trim(),
            trackingNumber: trimmedTracking,
            description: description.trim(),
            declaredValue: parsedValue,
            currency,
            newFile: pendingFile?.result,
            removedFileIds: existingPreAlert.files[0] && !existingFile ? [existingPreAlert.files[0].id] : [],
          })
        : await createPreAlert({
            merchant: merchant.trim(),
            trackingNumber: trimmedTracking,
            description: description.trim(),
            declaredValue: parsedValue,
            currency,
            file: pendingFile?.result,
          });

    setIsSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    hasSubmittedRef.current = true;
    onSubmitted(isEditMode ? `Pre-alert for ${trimmedTracking} updated.` : `Pre-alert for ${trimmedTracking} submitted.`);
    router.refresh();
    onClose();
  };

  const currentFile: { name: string; size: number; type: string; url?: string } | null = existingFile
    ? { name: existingFile.name, size: existingFile.size, type: existingFile.type, url: existingFile.url }
    : pendingFile
      ? { name: pendingFile.file.name, size: pendingFile.file.size, type: pendingFile.file.type, url: pendingFile.result?.url }
      : null;

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
          <h2 id={headingId} className="text-xl font-bold text-fg">
            {isEditMode ? "Edit pre-alert" : "New pre-alert"}
          </h2>
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

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <div>
            <label htmlFor={merchantId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
              Merchant / store <span className="text-accent">*</span>
            </label>
            <input
              id={merchantId}
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              onBlur={() => markTouched("merchant")}
              placeholder="e.g. Amazon"
              className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
            />
            {showError("merchant", merchantError) && <p className="mt-1.5 text-xs text-red-400">{merchantError}</p>}
          </div>

          <div>
            <label htmlFor={trackingId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
              Tracking number <span className="text-accent">*</span>
            </label>
            <input
              id={trackingId}
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onBlur={() => markTouched("trackingNumber")}
              placeholder="e.g. 1Z999AA10123456784"
              className="mt-2 w-full rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm font-mono text-fg outline-none transition-colors focus:border-accent"
            />
            {showError("trackingNumber", trackingNumberError) && (
              <p className="mt-1.5 text-xs text-red-400">{trackingNumberError}</p>
            )}
          </div>

          <div>
            <label htmlFor={descriptionId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
              Description <span className="text-accent">*</span>
            </label>
            <textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => markTouched("description")}
              rows={2}
              placeholder="What's inside — e.g. Running shoes, size 10"
              className="mt-2 w-full rounded-2xl border border-fg/15 bg-fg/5 px-4 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
            />
            {showError("description", descriptionError) && (
              <p className="mt-1.5 text-xs text-red-400">{descriptionError}</p>
            )}
          </div>

          <div>
            <label htmlFor={valueId} className="text-xs font-semibold uppercase tracking-widest text-fg/50">
              Declared value <span className="text-accent">*</span>
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
                {PRE_ALERT_CURRENCIES.map((c) => (
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
                onBlur={() => markTouched("value")}
                placeholder="0.00"
                className="w-full min-w-0 flex-1 rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
              />
            </div>
            {showError("value", valueError) && <p className="mt-1.5 text-xs text-red-400">{valueError}</p>}
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-fg/50">
              Receipt / invoice <span className="normal-case font-normal text-fg/35">(optional)</span>
            </span>

            {currentFile ? (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-fg/8 bg-fg/[0.03] p-3">
                {isThumbnailableImage(currentFile.type) && currentFile.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- transient blob: preview, not a static asset
                  <img src={currentFile.url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fg/5 text-fg/50" aria-hidden>
                    {FileIcon}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{currentFile.name}</p>
                  <p className="text-xs text-fg/40">{formatFileSize(currentFile.size)}</p>
                  {pendingFile?.status === "uploading" && (
                    <div
                      className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-fg/10"
                      role="progressbar"
                      aria-label={`Uploading ${currentFile.name}`}
                      aria-valuenow={pendingFile.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pendingFile.progress}%` }} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExistingFile(undefined);
                    handleRemovePendingFile();
                  }}
                  aria-label={`Remove ${currentFile.name}`}
                  data-cursor-hover="Remove"
                  className="shrink-0 rounded-full p-1.5 text-fg/40 transition-colors hover:bg-fg/5 hover:text-accent"
                >
                  {CloseIcon}
                </button>
              </div>
            ) : (
              <div onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <label
                  htmlFor={fileInputId}
                  className={cn(
                    "mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-6 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                    isDragActive
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-fg/15 text-fg/60 hover:border-accent/50 hover:text-accent"
                  )}
                >
                  <span aria-hidden>{UploadIcon}</span>
                  <span className="text-sm font-medium">
                    Drag and drop a file here, or <span className="text-accent underline">browse</span>
                  </span>
                  <span className="text-xs text-fg/40">JPG, PNG, WEBP, HEIC, or PDF · up to {MAX_FILE_SIZE_MB}MB</span>
                  <input
                    id={fileInputId}
                    type="file"
                    accept={ACCEPT_ATTR}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                </label>
              </div>
            )}
            {fileError && (
              <p role="alert" className="mt-2 text-xs text-red-400">
                {fileError}
              </p>
            )}
          </div>

          {submitError && (
            <p role="alert" className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-xs text-accent-text">
              {submitError}
            </p>
          )}

          <MagneticButton
            type="submit"
            disabled={isSubmitting || isUploading}
            cursorLabel="Submit"
            className="w-full justify-center bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white disabled:opacity-50"
          >
            {isUploading ? "Uploading…" : isSubmitting ? "Saving…" : isEditMode ? "Save changes" : "Submit pre-alert"}
          </MagneticButton>
        </form>
      </motion.div>
    </motion.div>
  );
}
