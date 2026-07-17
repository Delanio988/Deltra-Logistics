"use client";

import { useState } from "react";
import type { OverseasAddress } from "@/lib/dashboard-data";

type OverseasAddressCardProps = {
  address: OverseasAddress;
};

/** Freight-forwarder "ship your purchases here" US address card. */
export default function OverseasAddressCard({ address }: OverseasAddressCardProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const fullAddress = `${address.name}, ${address.addressLine1}, ${address.addressLine2}, ${address.city}, ${address.region} ${address.postalCode}, ${address.country}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  };

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-8 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="gold-label">Overseas Shipping Address</span>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-fg/50">
          <span className="rounded-full border border-fg/15 px-3 py-1">{address.country}</span>
          <span className="rounded-full border border-accent/30 px-3 py-1 text-accent">{address.service}</span>
        </div>
      </div>

      <p className="mt-5 text-sm text-fg/60">Ship your online purchases to this address.</p>

      <address className="mt-4 space-y-1 not-italic text-sm leading-relaxed text-fg/85">
        <p className="font-semibold text-fg">{address.name}</p>
        <p>{address.addressLine1}</p>
        <p className="font-semibold text-accent">{address.addressLine2}</p>
        <p>
          {address.city}, {address.region} {address.postalCode}
        </p>
        <p>{address.country}</p>
      </address>

      <button
        type="button"
        onClick={handleCopy}
        data-cursor-hover="Copy"
        aria-live="polite"
        className="mt-6 rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
      >
        {copyState === "copied" ? "Copied!" : copyState === "error" ? "Couldn't copy" : "Copy address"}
      </button>

      <p className="mt-5 rounded-xl border-l-2 border-gold/60 bg-fg/[0.03] px-4 py-3 text-xs text-fg/50">
        Always include your account code (<span className="font-semibold text-fg/70">{address.addressLine2}</span>) on
        every package label so our warehouse can match it to your account.
      </p>
    </div>
  );
}
