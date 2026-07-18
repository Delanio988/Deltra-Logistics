"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getPackagesNeedingInvoiceAction, type Invoice } from "@/lib/invoices";
import { markMessagesRead } from "@/lib/actions/messages";
import type { Package } from "@/lib/dashboard-data";
import type { Message } from "@/lib/messages";
import ActionRow from "@/components/dashboard/ActionRow";
import Toast from "@/components/ui/Toast";

const invoiceIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M6 3h9l3 3v15H6z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
  </svg>
);

const usersIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3 3-5 6-5s6 2 6 5" strokeLinecap="round" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M15 20c.3-2 1.8-3.3 3.5-3.6" strokeLinecap="round" />
  </svg>
);

const messageIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type AccountActionsCardProps = {
  packages: Package[];
  invoices: Invoice[];
  messages: Message[];
};

export default function AccountActionsCard({ packages, invoices, messages }: AccountActionsCardProps) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMessages, setShowMessages] = useState(false);

  const unreadCount = messages.filter((m) => !m.read).length;
  const invoiceCount = getPackagesNeedingInvoiceAction(packages, invoices).length;

  const handleStub = (label: string) => setToastMessage(`${label} is coming soon in a future update.`);

  const handleMessagesToggle = async () => {
    const opening = !showMessages;
    setShowMessages(opening);
    if (opening && unreadCount > 0) {
      const result = await markMessagesRead();
      if (result.success) router.refresh();
    }
  };

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-8 shadow-card">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-fg/50">Account Actions</h3>

      <div className="mt-4 -mx-3 divide-y divide-fg/8">
        <ActionRow
          icon={invoiceIcon}
          label="Submit Required Invoice"
          sublabel="Packages requiring invoice"
          badge={invoiceCount}
          onClick={() => router.push("/dashboard/invoices")}
        />
        <ActionRow
          icon={usersIcon}
          label="Authorised Users"
          sublabel="People who can use my account"
          badge={1}
          onClick={() => handleStub("Authorised Users")}
        />
        <ActionRow
          icon={messageIcon}
          label="Messages"
          sublabel="All previous messages sent to me"
          badge={unreadCount}
          onClick={handleMessagesToggle}
        />
      </div>

      <AnimatePresence initial={false}>
        {showMessages && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="mt-4 space-y-3 border-t border-fg/8 pt-4">
              {messages.length === 0 ? (
                <li className="text-sm text-fg/40">No messages yet.</li>
              ) : (
                messages.map((m) => (
                  <li key={m.id} className="rounded-lg bg-fg/5 p-4">
                    <p className="text-sm font-semibold text-fg">{m.title}</p>
                    <p className="mt-1 text-sm text-fg/60">{m.body}</p>
                    <p className="mt-1 text-xs text-fg/35">{m.timestamp}</p>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
