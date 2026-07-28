import type { FeatureGridItem } from "@/lib/data";

type FeatureGridIconProps = {
  icon: FeatureGridItem["icon"];
  className?: string;
};

/** Minimal stroke-style icon set for FeatureGrid, matching the vocabulary
 *  used elsewhere on the site (viewBox 0 0 40 40, stroke=currentColor). */
export default function FeatureGridIcon({ icon, className }: FeatureGridIconProps) {
  const common = {
    className,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "radar":
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="15" />
          <circle cx="20" cy="20" r="8" />
          <circle cx="20" cy="20" r="1.5" fill="currentColor" />
          <path d="M20 20 30 10" />
        </svg>
      );
    case "address":
      return (
        <svg {...common}>
          <path d="M20 5c-7 0-12 5-12 12 0 9 12 18 12 18s12-9 12-18c0-7-5-12-12-12z" />
          <circle cx="20" cy="17" r="4" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <path d="M22 4 8 22h9l-3 14 16-20h-9z" strokeLinejoin="round" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M6 6h13l15 15-15 15L4 21V6z" strokeLinejoin="round" />
          <circle cx="14" cy="14" r="2.5" />
        </svg>
      );
    case "box":
      return (
        <svg {...common}>
          <path d="M20 6 34 13v14L20 34 6 27V13z" />
          <path d="M6 13l14 7 14-7" />
          <path d="M20 20v14" />
        </svg>
      );
    case "sms":
      return (
        <svg {...common}>
          <rect x="6" y="9" width="28" height="19" rx="4" />
          <path d="M14 28v6l-6-6" />
          <circle cx="14" cy="18" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="20" cy="18" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="26" cy="18" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}
