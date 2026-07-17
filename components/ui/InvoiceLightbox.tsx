"use client";

import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { InvoiceFile, InvoiceStatusHistoryEntry } from "@/lib/invoices";
import { formatFileSize, isThumbnailableImage } from "@/lib/uploads";
import { useModalA11y } from "@/lib/useModalA11y";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

const FileIcon = (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M6 3h9l3 3v15H6z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
  </svg>
);

const ChevronLeft = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRight = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-cursor-hover={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-fg/60 transition-colors hover:bg-fg/5 hover:text-accent",
        className
      )}
    >
      {children}
    </button>
  );
}

function FileFallbackCard({ file, note }: { file: InvoiceFile; note: string }) {
  return (
    <div className="flex max-w-xs flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/60" aria-hidden>
        {FileIcon}
      </span>
      <p className="text-sm font-medium text-white">{file.name}</p>
      <p className="text-xs text-white/50">
        {file.type || "Unknown type"} · {formatFileSize(file.size)}
      </p>
      <p className="text-xs text-white/40">{note}</p>
    </div>
  );
}

type InvoiceLightboxProps = {
  files: InvoiceFile[];
  initialIndex?: number;
  trackingNumber: string;
  description: string;
  statusHistory?: InvoiceStatusHistoryEntry[];
  onClose: () => void;
  /** Admin's context panel + approve/reject/next-pending controls. Omitted
   *  entirely for the customer's view-only usage. */
  footer?: ReactNode;
};

/**
 * Shared invoice file viewer — used by both the admin review flow and the
 * customer's read-only "review what I submitted" flow. Rendered by the
 * caller inside <AnimatePresence> (like the other modals in this app) so
 * this component only owns its own motion.divs, not a nested AnimatePresence.
 */
export default function InvoiceLightbox({
  files,
  initialIndex = 0,
  trackingNumber,
  description,
  statusHistory,
  onClose,
  footer,
}: InvoiceLightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const prefersReducedMotion = useReducedMotion();
  useModalA11y(containerRef, onClose);

  const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 0), Math.max(files.length - 1, 0)));
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);

  const file = files[index] as InvoiceFile | undefined;
  const hasMultiple = files.length > 1;
  const canZoom = Boolean(file?.url) && file !== undefined && isThumbnailableImage(file.type) && !imageError;

  const goPrev = () => setIndex((i) => (i - 1 + files.length) % files.length);
  const goNext = () => setIndex((i) => (i + 1) % files.length);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Reset the view transform + error state whenever the viewed file changes.
  useEffect(() => {
    resetView();
    setImageError(false);
  }, [index]);

  // Arrow-key file navigation — a separate listener from useModalA11y's
  // Escape/Tab handling, and careful not to hijack arrow keys while the
  // admin footer's rejection-reason textarea (or any input) has focus.
  useEffect(() => {
    if (!hasMultiple) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isEditable) return;
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + files.length) % files.length);
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % files.length);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasMultiple, files.length]);

  // Pinch-to-zoom on touch devices — attached imperatively (not via JSX
  // touch props) so preventDefault reliably stops the page's native
  // pinch/scroll gesture instead of fighting it.
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !canZoom) return;

    const getDistance = (touches: TouchList) => {
      const [a, b] = [touches[0], touches[1]];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) pinchRef.current = { startDist: getDistance(e.touches), startZoom: zoom };
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const ratio = getDistance(e.touches) / pinchRef.current.startDist;
        setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchRef.current.startZoom * ratio)));
      }
    };
    const handleTouchEnd = () => {
      pinchRef.current = null;
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [canZoom, zoom]);

  const dragRef = useRef<{ startX: number; startY: number; startPan: { x: number; y: number } } | null>(null);
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPan: pan };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.startPan.x + (e.clientX - dragRef.current.startX), y: dragRef.current.startPan.y + (e.clientY - dragRef.current.startY) });
  };
  const handlePointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const renderFileContent = () => {
    if (!file) return <p className="text-sm text-white/60">No files to preview.</p>;
    if (!file.url) return <FileFallbackCard file={file} note="Preview unavailable after reload — demo storage only." />;
    if (imageError) return <FileFallbackCard file={file} note="This image couldn't be loaded." />;
    if (isThumbnailableImage(file.type)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- transient blob: preview, not a static asset
        <img
          src={file.url}
          alt={file.name}
          draggable={false}
          onError={() => setImageError(true)}
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.15s ease-out",
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
        />
      );
    }
    if (file.type === "application/pdf") {
      return <iframe src={file.url} title={file.name} className="h-full w-full border-0 bg-white" />;
    }
    return <FileFallbackCard file={file} note="This file type can't be previewed inline." />;
  };

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
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
        className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-fg/10 bg-surface shadow-card outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-fg/8 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p id={headingId} className="truncate text-sm font-semibold text-fg">
              {file?.name ?? "No files"}
            </p>
            <p className="truncate text-xs text-fg/50">
              <span className="font-mono">{trackingNumber}</span> — {description}
              {file && (
                <>
                  {" · "}
                  {file.type || "Unknown type"} · {formatFileSize(file.size)}
                  {file.uploadedAt && ` · Uploaded ${file.uploadedAt}`}
                </>
              )}
              {hasMultiple && ` · ${index + 1} of ${files.length}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {canZoom && (
              <>
                <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M8 11h6M21 21l-4.3-4.3" strokeLinecap="round" />
                  </svg>
                </IconButton>
                <IconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M11 8v6M8 11h6M21 21l-4.3-4.3" strokeLinecap="round" />
                  </svg>
                </IconButton>
                <IconButton label="Rotate" onClick={() => setRotation((r) => (r + 90) % 360)}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M4 9a8 8 0 1114 6" strokeLinecap="round" />
                    <path d="M4 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconButton>
                <IconButton label="Reset view" onClick={resetView}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M9 9h6v6H9z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconButton>
              </>
            )}
            <IconButton label="Close" onClick={onClose}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </IconButton>
          </div>
        </div>

        <div ref={viewerRef} className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
          {hasMultiple && (
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous file"
              data-cursor-hover="Previous"
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 hover:text-accent sm:left-4"
            >
              {ChevronLeft}
            </button>
          )}
          <div
            className="flex h-full w-full items-center justify-center p-6"
            style={{ touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {renderFileContent()}
          </div>
          {hasMultiple && (
            <button
              type="button"
              onClick={goNext}
              aria-label="Next file"
              data-cursor-hover="Next"
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 hover:text-accent sm:right-4"
            >
              {ChevronRight}
            </button>
          )}
        </div>

        {hasMultiple && (
          <div className="flex gap-2 overflow-x-auto border-t border-fg/8 px-4 py-3 sm:px-6">
            {files.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`View ${f.name}`}
                aria-current={i === index}
                className={cn(
                  "h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                  i === index ? "border-accent" : "border-fg/10 hover:border-accent/50"
                )}
              >
                {f.url && isThumbnailableImage(f.type) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- transient blob: thumbnail
                  <img src={f.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-fg/5 text-fg/40" aria-hidden>
                    {FileIcon}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-fg/8 px-4 py-3 sm:px-6">
          <div className="flex gap-2">
            <a
              href={file?.url ?? "#"}
              download={file?.name}
              aria-disabled={!file?.url}
              onClick={(e) => {
                if (!file?.url) e.preventDefault();
              }}
              data-cursor-hover={file?.url ? "Download" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                file?.url ? "border-fg/15 text-fg hover:border-accent hover:text-accent" : "cursor-not-allowed border-fg/8 text-fg/30"
              )}
            >
              Download
            </a>
            <a
              href={file?.url ?? "#"}
              target={file?.url ? "_blank" : undefined}
              rel="noreferrer"
              aria-disabled={!file?.url}
              onClick={(e) => {
                if (!file?.url) e.preventDefault();
              }}
              data-cursor-hover={file?.url ? "Open" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                file?.url ? "border-fg/15 text-fg hover:border-accent hover:text-accent" : "cursor-not-allowed border-fg/8 text-fg/30"
              )}
            >
              Open in new tab
            </a>
          </div>
          {statusHistory && statusHistory.length > 0 && (
            <details className="text-xs text-fg/60">
              <summary className="cursor-pointer select-none font-medium text-fg/70 hover:text-accent">History</summary>
              <ul className="mt-2 space-y-1">
                {statusHistory.map((h, i) => (
                  <li key={i}>
                    {h.at} — {h.note ?? h.status}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {footer && <div className="border-t border-fg/8 bg-fg/[0.02] px-4 py-4 sm:px-6">{footer}</div>}
      </motion.div>
    </motion.div>
  );
}
