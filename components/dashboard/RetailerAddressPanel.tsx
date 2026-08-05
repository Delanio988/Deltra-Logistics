"use client";

import { useState } from "react";
import { formatShippingName } from "@/lib/formatShippingName";
import type { RetailerAddressFormat, RetailerCustomerInput } from "@/lib/dashboard-data";
import ShippingNameMeta from "@/components/dashboard/ShippingNameMeta";

type RetailerAddressPanelProps = {
  format: RetailerAddressFormat;
  customer: RetailerCustomerInput;
};

const CheckIcon = (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Renders one retailer's address block: an auto-shortened "Name" field
 * (via formatShippingName, live character count + why-note underneath)
 * followed by that retailer's plain address fields, each with its own
 * copy button, plus a "Copy all" for the whole block. Driven entirely by
 * the RetailerAddressFormat config — adding another retailer tab means
 * adding a config entry, not touching this component.
 */
export default function RetailerAddressPanel({ format, customer }: RetailerAddressPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const nameResult = formatShippingName(
    customer.firstName,
    customer.lastName,
    customer.accountCode,
    format.nameCharLimit,
    format.nameSeparator ?? "-"
  );
  const fields = [{ label: "Name", value: nameResult.value }, ...format.getAddressFields()];

  const showCopied = (key: string) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000);
  };

  const copyField = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showCopied(key);
    } catch {
      // Clipboard access denied — the value is still visible to copy manually.
    }
  };

  const copyAll = async () => {
    const block = fields.map((f) => `${f.label}: ${f.value}`).join("\n");
    try {
      await navigator.clipboard.writeText(block);
      showCopied("all");
    } catch {
      // Clipboard access denied — the value is still visible to copy manually.
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-2">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-fg/8 bg-fg/[0.03] px-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-fg/40">{field.label}</p>
              <p className="truncate text-sm font-medium text-fg">{field.value}</p>
              {field.label === "Name" && <ShippingNameMeta result={nameResult} retailerLabel={format.label} />}
            </div>
            <button
              type="button"
              onClick={() => copyField(field.label, field.value)}
              data-cursor-hover="Copy"
              className="flex shrink-0 items-center gap-1 rounded-full border border-fg/15 px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
            >
              {copiedKey === field.label ? (
                <>
                  {CheckIcon} Copied
                </>
              ) : (
                "Copy"
              )}
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={copyAll}
        data-cursor-hover="Copy all"
        className="w-full rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
      >
        {copiedKey === "all" ? "Copied all fields!" : "Copy all"}
      </button>
    </div>
  );
}
