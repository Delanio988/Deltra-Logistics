"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastProps = {
  message: string | null;
  onDismiss: () => void;
  /** Optional inline action button, e.g. "Undo" — clicking it dismisses the toast too. */
  action?: ToastAction;
};

/** Simple auto-dismissing confirmation banner, reused across the dashboard's
 *  stub actions and the admin area's add/update-package confirmations. */
export default function Toast({ message, onDismiss, action }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-6">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex items-center gap-4 rounded-full border border-accent/30 bg-surface px-6 py-3 text-sm font-semibold text-fg shadow-card"
          >
            <span>{message}</span>
            {action && (
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  onDismiss();
                }}
                data-cursor-hover={action.label}
                className="shrink-0 text-accent underline transition-colors hover:text-accent-dark"
              >
                {action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
