"use client";

import { useId, useRef } from "react";
import { motion } from "framer-motion";
import { useModalA11y } from "@/lib/useModalA11y";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as a destructive (red) action. Defaults to true. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Generic "are you sure?" dialog — used anywhere a destructive, one-click-
 * would-be-dangerous action needs a confirm step (removing an invoice file,
 * withdrawing a submission). Renders on top of whatever modal opened it
 * (higher z-index), so the caller doesn't need to close its own modal first.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const prefersReducedMotion = useReducedMotion();
  useModalA11y(containerRef, onCancel);

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <motion.div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl border border-fg/8 bg-surface p-6 shadow-card outline-none"
      >
        <h2 id={headingId} className="text-lg font-bold text-fg">
          {title}
        </h2>
        <p className="mt-2 text-sm text-fg/70">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            data-cursor-hover="Cancel"
            className="rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold text-fg/70 transition-colors hover:border-accent hover:text-accent"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            data-cursor-hover={confirmLabel}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
              destructive
                ? "bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white"
                : "border border-fg/15 text-fg hover:border-accent hover:text-accent"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
