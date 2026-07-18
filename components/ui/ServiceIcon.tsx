import type { Service } from "@/lib/data";

type ServiceIconProps = {
  icon: Service["icon"];
  className?: string;
};

/** Minimal line-art icon set for the Services grid — no external icon package needed. */
export default function ServiceIcon({ icon, className }: ServiceIconProps) {
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
    case "ocean":
      return (
        <svg {...common}>
          <path d="M4 24c3 3 6 3 9 0s6-3 9 0 6 3 9 0 6-3 9 0" />
          <path d="M4 31c3 3 6 3 9 0s6-3 9 0 6 3 9 0 6-3 9 0" />
          <path d="M13 24V13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11" />
          <path d="M17 11V7h6v4" />
        </svg>
      );
    case "air":
      return (
        <svg {...common}>
          <path d="M20 4v32M4 20h32" />
          <path d="M20 4 12 14h16z" />
          <path d="M6 26l8-6M34 26l-8-6" />
        </svg>
      );
    case "lastmile":
      return (
        <svg {...common}>
          <rect x="4" y="16" width="18" height="12" rx="1.5" />
          <path d="M22 20h6l6 5v3h-3" />
          <circle cx="12" cy="30" r="3" />
          <circle cx="28" cy="30" r="3" />
        </svg>
      );
    default:
      return null;
  }
}
