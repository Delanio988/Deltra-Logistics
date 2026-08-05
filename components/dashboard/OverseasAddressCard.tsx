"use client";

import { useState } from "react";
import { RETAILER_ADDRESS_FORMATS, type OverseasAddress, type RetailerId } from "@/lib/dashboard-data";
import RetailerAddressPanel from "@/components/dashboard/RetailerAddressPanel";
import ShippingNameMeta from "@/components/dashboard/ShippingNameMeta";
import { cn } from "@/lib/utils";

type OverseasAddressCardProps = {
  address: OverseasAddress;
  firstName: string;
  lastName: string;
};

type TabId = "general" | RetailerId;

const RETAILER_IDS = Object.keys(RETAILER_ADDRESS_FORMATS) as RetailerId[];

/** Freight-forwarder "ship your purchases here" US address card. General
 *  format by default; a tab per retailer with its own checkout quirks
 *  (currently just SHEIN) swaps in a field-by-field layout instead. */
export default function OverseasAddressCard({ address, firstName, lastName }: OverseasAddressCardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const fullAddress = `${address.name}, ${address.addressLine1}, ${address.city}, ${address.region} ${address.postalCode}, ${address.country}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  };

  const tabButtonClass = (isActive: boolean) =>
    cn(
      "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
      isActive ? "bg-accent text-navy-950" : "text-fg/60 hover:text-accent"
    );

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-8 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="gold-label">Overseas Shipping Address</span>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-fg/50">
          <span className="rounded-full border border-fg/15 px-3 py-1">{address.country}</span>
          <span className="rounded-full border border-accent/30 px-3 py-1 text-accent">{address.service}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-fg/10 bg-fg/[0.03] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          data-cursor-hover="General"
          className={tabButtonClass(activeTab === "general")}
        >
          General
        </button>
        {RETAILER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            data-cursor-hover={RETAILER_ADDRESS_FORMATS[id].label}
            className={tabButtonClass(activeTab === id)}
          >
            {RETAILER_ADDRESS_FORMATS[id].label}
          </button>
        ))}
      </div>

      {activeTab === "general" ? (
        <>
          <p className="mt-5 text-sm text-fg/60">Ship your online purchases to this address.</p>

          <address className="mt-4 space-y-1 not-italic text-sm leading-relaxed text-fg/85">
            <div>
              <p className="font-semibold text-fg">{address.name}</p>
              <ShippingNameMeta result={address.nameResult} retailerLabel="most stores" />
            </div>
            <p>{address.addressLine1}</p>
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
            Always include your account code (<span className="font-semibold text-fg/70">{address.accountCode}</span>) on
            every package label so our warehouse can match it to your account.
          </p>
        </>
      ) : (
        <>
          <p className="mt-5 text-sm text-fg/60">
            Use these fields exactly as shown in {RETAILER_ADDRESS_FORMATS[activeTab].label}&rsquo;s checkout.
          </p>
          <RetailerAddressPanel
            format={RETAILER_ADDRESS_FORMATS[activeTab]}
            customer={{ firstName, lastName, accountCode: address.accountCode }}
          />
        </>
      )}
    </div>
  );
}
