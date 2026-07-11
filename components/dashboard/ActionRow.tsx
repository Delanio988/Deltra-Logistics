"use client";

import type { ReactNode } from "react";

type ActionRowProps = {
  icon: ReactNode;
  label: string;
  sublabel: string;
  badge?: number;
  onClick?: () => void;
};

/** Icon/label/sublabel/badge row shared by AccountActionsCard and PackageSummaryCard. */
export default function ActionRow({ icon, label, sublabel, badge, onClick }: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor-hover={label}
      className="flex w-full items-center gap-4 px-3 py-3 text-left transition-colors hover:bg-white/5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-accent" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="block truncate text-xs text-white/50">{sublabel}</span>
      </span>
      {typeof badge === "number" && (
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-navy-950">{badge}</span>
      )}
    </button>
  );
}
