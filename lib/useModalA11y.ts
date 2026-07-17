"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal accessibility behavior: focuses the container on open, traps
 * Tab focus inside it, closes on Escape, locks body scroll while open, and
 * restores focus to whatever was focused before opening. Used by every
 * modal-like component (InvoiceUploadModal, InvoiceLightbox, ConfirmDialog)
 * so this isn't pasted a 4th time.
 */
export function useModalA11y(containerRef: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    container?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [containerRef, onClose]);
}
