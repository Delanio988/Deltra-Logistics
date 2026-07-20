"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCustomerMailboxNumber } from "@/lib/actions/ox-sync";
import type { MailboxLinkRow } from "@/lib/ox-data";
import Toast from "@/components/ui/Toast";

type MailboxLinkTableProps = {
  customers: MailboxLinkRow[];
};

/** Deltra doesn't own OX's mailbox numbering — an admin looks up each
 *  customer's real mailbox number (from the OX customers list below, or
 *  from onboarding records) and links it here. Saves on blur/Enter. */
export default function MailboxLinkTable({ customers }: MailboxLinkTableProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(customers.map((c) => [c.id, c.mailboxNumber?.toString() ?? ""]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = async (customer: MailboxLinkRow) => {
    const raw = (drafts[customer.id] ?? "").trim();
    const parsed = raw === "" ? null : Number(raw);
    if (raw !== "" && (!Number.isInteger(parsed) || (parsed as number) <= 0)) {
      setToastMessage("Mailbox number must be a positive whole number.");
      setDrafts((prev) => ({ ...prev, [customer.id]: customer.mailboxNumber?.toString() ?? "" }));
      return;
    }
    if (parsed === customer.mailboxNumber) return;

    setSavingId(customer.id);
    const result = await setCustomerMailboxNumber({ customerId: customer.id, mailboxNumber: parsed });
    setSavingId(null);

    if (!result.success) {
      setToastMessage(result.error);
      setDrafts((prev) => ({ ...prev, [customer.id]: customer.mailboxNumber?.toString() ?? "" }));
      return;
    }
    setToastMessage(`Mailbox number ${parsed ? `set to ${parsed}` : "cleared"} for ${customer.name}.`);
    router.refresh();
  };

  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-fg/8 bg-surface p-8 text-center text-sm text-fg/50 shadow-card">
        No customers yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-fg/8 bg-surface shadow-card">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-fg/8 text-xs font-semibold uppercase tracking-widest text-fg/50">
            <th scope="col" className="px-6 py-4">
              Customer
            </th>
            <th scope="col" className="px-6 py-4">
              Account code
            </th>
            <th scope="col" className="px-6 py-4">
              OX mailbox number
            </th>
            <th scope="col" className="px-6 py-4" />
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b border-fg/8 last:border-0">
              <td className="px-6 py-4 text-fg">{customer.name}</td>
              <td className="px-6 py-4 font-mono text-fg/70">{customer.accountCode}</td>
              <td className="px-6 py-4">
                <label className="sr-only" htmlFor={`mailbox-${customer.id}`}>
                  OX mailbox number for {customer.name}
                </label>
                <input
                  id={`mailbox-${customer.id}`}
                  type="number"
                  min="1"
                  step="1"
                  value={drafts[customer.id] ?? ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [customer.id]: e.target.value }))}
                  onBlur={() => handleSave(customer)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="Not linked"
                  className="w-32 rounded-full border border-fg/15 bg-fg/5 px-4 py-2 text-sm text-fg outline-none transition-colors focus:border-accent"
                />
              </td>
              <td className="px-6 py-4 text-xs text-fg/40">{savingId === customer.id ? "Saving…" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
