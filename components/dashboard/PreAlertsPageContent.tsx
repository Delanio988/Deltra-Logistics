"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PreAlertFormModal from "@/components/dashboard/PreAlertFormModal";
import PreAlertStatusBadge from "@/components/ui/PreAlertStatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import ScrollReveal from "@/components/ui/ScrollReveal";
import BackButton from "@/components/ui/BackButton";
import { formatPreAlertValue, type PreAlert } from "@/lib/pre-alerts";
import { formatFileSize, isThumbnailableImage } from "@/lib/pre-alert-uploads";
import { deletePreAlert } from "@/lib/actions/pre-alerts";

const FileIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path d="M6 3h9l3 3v15H6z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
  </svg>
);

type FormTarget = "create" | PreAlert;

export default function PreAlertsPageContent({ preAlerts }: { preAlerts: PreAlert[] }) {
  const router = useRouter();
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PreAlert | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const restoreFocus = () => {
    const el = triggerRef.current;
    if (el && document.body.contains(el)) el.focus();
    else headingRef.current?.focus();
  };

  const openCreate = (trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setFormTarget("create");
  };
  const openEdit = (preAlert: PreAlert, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setFormTarget(preAlert);
  };
  const closeForm = () => {
    setFormTarget(null);
    restoreFocus();
  };

  const requestDelete = (preAlert: PreAlert, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setDeleteTarget(preAlert);
  };
  const cancelDelete = () => {
    setDeleteTarget(null);
    restoreFocus();
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deletePreAlert({ id: deleteTarget.id });
    setIsDeleting(false);
    setDeleteTarget(null);
    restoreFocus();
    if (result.success) {
      setToast(`Deleted your pre-alert for ${deleteTarget.trackingNumber}.`);
      router.refresh();
    } else {
      setToast(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <DashboardHeader />

      <main className="mx-auto max-w-container px-6 py-12 lg:px-12 lg:py-16">
        <ScrollReveal direction="none">
          <BackButton href="/dashboard" label="Back to dashboard" className="-ml-3" />
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 ref={headingRef} tabIndex={-1} className="text-display-sm font-extrabold text-fg outline-none">
                Pre-Alerts
              </h1>
              <p className="mt-2 text-fg/60">Let us know what&rsquo;s on the way so we can match it the moment it arrives.</p>
            </div>
            <button
              type="button"
              data-cursor-hover="New Pre-Alert"
              onClick={(e) => openCreate(e.currentTarget)}
              className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-accent-dark hover:text-white"
            >
              New Pre-Alert
            </button>
          </div>
        </ScrollReveal>

        <ScrollReveal index={0} className="mt-10">
          {preAlerts.length === 0 ? (
            <div className="rounded-2xl border border-fg/8 bg-surface p-8 text-center shadow-card">
              <p className="text-sm font-medium text-fg/70">No pre-alerts yet — let us know what&rsquo;s on the way.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {preAlerts.map((preAlert) => {
                const isPending = preAlert.status === "pending";
                const file = preAlert.files[0];

                return (
                  <li key={preAlert.id} className="rounded-2xl border border-fg/8 bg-surface p-6 shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-fg">{preAlert.trackingNumber}</span>
                        <PreAlertStatusBadge status={preAlert.status} />
                      </div>
                      <span className="text-xs text-fg/40">Submitted {preAlert.createdAt}</span>
                    </div>

                    <p className="mt-2 text-sm text-fg/70">
                      {preAlert.merchant} — {preAlert.description}
                    </p>
                    {preAlert.declaredValue !== undefined && (
                      <p className="mt-1 text-sm text-fg/50">
                        Declared value: {formatPreAlertValue(preAlert.declaredValue, preAlert.currency ?? "USD")}
                      </p>
                    )}

                    {file &&
                      (file.url ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-cursor-hover="View"
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/5 py-1 pl-2 pr-3 text-xs text-fg/70 transition-colors hover:text-accent"
                        >
                          {isThumbnailableImage(file.type) ? (
                            // eslint-disable-next-line @next/next/no-img-element -- transient signed-url thumbnail
                            <img src={file.url} alt="" className="h-4 w-4 rounded object-cover" />
                          ) : (
                            <span aria-hidden>{FileIcon}</span>
                          )}
                          <span className="max-w-[10rem] truncate">{file.name}</span>
                          <span className="text-fg/40">{formatFileSize(file.size)}</span>
                        </a>
                      ) : (
                        <div className="mt-3">
                          <span className="inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/5 py-1 pl-2 pr-3 text-xs text-fg/70">
                            <span aria-hidden>{FileIcon}</span>
                            <span className="max-w-[10rem] truncate">{file.name}</span>
                            <span className="text-fg/40">{formatFileSize(file.size)}</span>
                          </span>
                          <p className="mt-1 text-xs text-fg/35">Preview unavailable — reload to refresh the link.</p>
                        </div>
                      ))}

                    {isPending ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          data-cursor-hover="Edit"
                          onClick={(e) => openEdit(preAlert, e.currentTarget)}
                          className="rounded-full border border-fg/15 px-5 py-2 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          data-cursor-hover="Delete"
                          onClick={(e) => requestDelete(preAlert, e.currentTarget)}
                          className="rounded-full border border-fg/15 px-5 py-2 text-xs font-semibold text-fg/60 transition-colors hover:border-accent hover:text-accent"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-fg/40">
                        {preAlert.status === "matched"
                          ? "Matched to a received package — no further changes needed."
                          : "This pre-alert has expired."}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollReveal>
      </main>

      <AnimatePresence>
        {formTarget && (
          <PreAlertFormModal
            key={formTarget === "create" ? "create" : formTarget.id}
            existingPreAlert={formTarget === "create" ? undefined : formTarget}
            onClose={closeForm}
            onSubmitted={setToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDialog
            title="Delete this pre-alert?"
            message={`This can't be undone. ${deleteTarget.trackingNumber} will be removed from your pre-alerts.`}
            confirmLabel={isDeleting ? "Deleting…" : "Delete"}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          />
        )}
      </AnimatePresence>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
