"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ToastProps = {
  message: string | null;
  onDismiss: () => void;
};

/** Simple auto-dismissing confirmation banner, reused across the dashboard's
 *  stub actions and the admin area's add/update-package confirmations. */
export default function Toast({ message, onDismiss }: ToastProps) {
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
            className="pointer-events-auto rounded-full border border-accent/30 bg-navy-900 px-6 py-3 text-sm font-semibold text-white shadow-card"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
