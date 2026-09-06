import { CURRENCY, RATE_PER_LB } from "@/lib/quote-config";

export const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Get a Quote", href: "/quote" },
  { label: "Tracking", href: "#tracking" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: "ocean" | "air" | "lastmile";
};

export const SERVICES: Service[] = [
  {
    id: "ocean",
    title: "Ocean Freight",
    description:
      "Full-container and LCL shipping across every major trade lane, backed by long-term carrier partnerships and real-time vessel tracking.",
    icon: "ocean",
  },
  {
    id: "air",
    title: "Air Cargo",
    description:
      "Time-critical air freight with priority booking and charter options — when speed matters more than cost, we get it there.",
    icon: "air",
  },
  {
    id: "lastmile",
    title: "Last-Mile Delivery",
    description:
      "Optimized final-mile networks that turn delivery into a brand experience — fast, tracked, and dependable.",
    icon: "lastmile",
  },
];

export type TrackingStatus = {
  label: string;
  description: string;
  timestamp: string;
};

// Illustrative example shown on the public marketing page's tracking
// preview — not a live lookup. Real per-package tracking lives behind sign-in
// on /dashboard, driven by buildPackageTimeline() in dashboard-data.ts.
export const EXAMPLE_TRACKING_STEPS: TrackingStatus[] = [
  { label: "Picked up", description: "Shipment collected from origin facility", timestamp: "Day 1" },
  { label: "In transit", description: "Departed regional hub en route to port", timestamp: "Day 1" },
  { label: "Customs", description: "Cleared customs at destination country", timestamp: "Day 3" },
  { label: "Out for delivery", description: "Loaded on final-mile vehicle", timestamp: "Day 4" },
  { label: "Delivered", description: "Signed for at destination address", timestamp: "Day 4" },
];

export const PROCESS_STEPS = [
  {
    number: "01",
    title: "Shop online in the US",
    description: "Buy from any US retailer — Amazon, Walmart, Shein, Best Buy, and thousands more ship there.",
  },
  {
    number: "02",
    title: "Ship to your Deltra address",
    description: "Use your personal Deltra US address at checkout. We receive and log every package the moment it arrives.",
  },
  {
    number: "03",
    title: "We fly it to Jamaica",
    description: "Your packages are consolidated and flown in on our next scheduled air freight run — fast and fully tracked.",
  },
  {
    number: "04",
    title: "Get it delivered or arrange pickup",
    description: "Get notified the moment it lands — we'll deliver it to you or arrange a convenient pickup, anywhere in the Montego Bay area.",
  },
] as const;

export type FeatureGridItem = {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: "radar" | "address" | "bolt" | "tag" | "box" | "sms";
  /** Solid-accent focal card — only one per grid. */
  highlight?: boolean;
};

// Six real, already-shipping capabilities — cross-checked against actual
// code, not aspirational copy. Card 06 is deliberately "SMS" only: WhatsApp
// today is a manual wa.me contact link (see Footer.tsx), not an automated
// status-push channel like Twilio SMS (lib/notifications/sms.ts) is.
export const FEATURE_GRID_ITEMS: FeatureGridItem[] = [
  {
    id: "tracking",
    number: "01",
    title: "Real-Time Tracking",
    description: "Every package logged the moment it hits our US warehouse, visible in your dashboard from arrival to delivery.",
    icon: "radar",
  },
  {
    id: "address",
    number: "02",
    title: "Personal US Shipping Address",
    description: "Your own suite address at our US warehouse — use it at checkout with any retailer, no extra signup.",
    icon: "address",
  },
  {
    id: "air-freight",
    number: "03",
    title: "Fast Air Freight",
    description: "Scheduled flights out of our US warehouse mean your packages are airborne within days, not weeks.",
    icon: "bolt",
  },
  {
    id: "pricing",
    number: "04",
    title: `Transparent ${CURRENCY}${RATE_PER_LB}/lb Pricing`,
    description: "One flat rate per pound, shown up front on /quote before you ever sign up. No surprise fees at pickup.",
    icon: "tag",
    highlight: true,
  },
  {
    id: "consolidation",
    number: "05",
    title: "Package Consolidation",
    description: "Order from several US retailers — we consolidate everything into one shipment before it flies home.",
    icon: "box",
  },
  {
    id: "sms",
    number: "06",
    title: "SMS Status Updates",
    description: "Automatic text updates as your package moves — received, in transit, ready for pickup.",
    icon: "sms",
  },
];

