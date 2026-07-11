"use client";

import { useState } from "react";
import type { DropOffLocation } from "@/lib/dashboard-data";

type DropOffPanelProps = {
  location: DropOffLocation;
};

export default function DropOffPanel({ location }: DropOffPanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const fullAddress = `${location.facilityName}, ${location.addressLine1}, ${location.city}, ${location.region} ${location.postalCode}, ${location.country}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  };

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

  // Keyless OSM embed — no API key needed. TODO: swap for Mapbox/Google Maps JS
  // SDK if you want custom-styled pins/branding (that route does need a key).
  const delta = 0.01;
  const bbox = `${location.lng - delta}%2C${location.lat - delta}%2C${location.lng + delta}%2C${location.lat + delta}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.lat}%2C${location.lng}`;

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/8 bg-navy-900 shadow-card lg:grid-cols-2">
      <div className="p-8">
        <span className="gold-label">Shipping Drop-Off Location</span>
        <h3 className="mt-4 text-xl font-bold text-white">{location.facilityName}</h3>
        <address className="mt-3 not-italic text-sm leading-relaxed text-white/70">
          {location.addressLine1}
          <br />
          {location.city}, {location.region} {location.postalCode}
          <br />
          {location.country}
        </address>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="font-semibold text-white/50">Hours:</dt>
            <dd className="text-white/70">{location.hours}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-white/50">Phone:</dt>
            <dd>
              <a href={`tel:${location.phone.replace(/[^\d+]/g, "")}`} className="text-white/70 hover:text-accent">
                {location.phone}
              </a>
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            data-cursor-hover="Copy"
            aria-live="polite"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-accent hover:text-accent"
          >
            {copyState === "copied" ? "Copied!" : copyState === "error" ? "Couldn't copy" : "Copy address"}
          </button>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            data-cursor-hover="Directions"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-accent-dark hover:text-white"
          >
            Get directions
          </a>
        </div>
      </div>

      <div className="min-h-[280px] bg-white/5">
        <iframe
          title={`Map showing ${location.facilityName}`}
          src={mapSrc}
          className="h-full min-h-[280px] w-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
