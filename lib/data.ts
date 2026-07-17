// Centralized placeholder content for Deltra Logistics (placeholder brand name).
// Swap copy, numbers, and TODO-marked assets with real brand data before launch.

export const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Get a Quote", href: "/quote" },
  { label: "Tracking", href: "#tracking" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

export const STATS = [
  { value: 2, suffix: "M+", label: "Shipments delivered" },
  { value: 180, suffix: "+", label: "Countries served" },
  { value: 99.8, suffix: "%", label: "On-time performance", decimals: 1 },
  { value: 24, suffix: "/7", label: "Live support" },
] as const;

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: "ocean" | "air" | "road" | "warehouse" | "customs" | "lastmile";
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
    id: "road",
    title: "Road & Ground",
    description:
      "Dense regional trucking networks and cross-border ground transport engineered for reliable door-to-door delivery.",
    icon: "road",
  },
  {
    id: "warehouse",
    title: "Warehousing",
    description:
      "Strategically located fulfillment hubs with real-time inventory visibility, pick-and-pack, and value-added services.",
    icon: "warehouse",
  },
  {
    id: "customs",
    title: "Customs Brokerage",
    description:
      "Licensed brokers and compliance specialists who clear your cargo fast and keep you ahead of shifting trade regulations.",
    icon: "customs",
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

// Mock tracking data keyed by tracking number. Any unrecognized number falls
// back to DEFAULT_TRACKING so the widget always has something to show.
export const TRACKING_DATA: Record<string, TrackingStatus[]> = {
  DEFAULT: [
    { label: "Picked up", description: "Shipment collected from origin facility", timestamp: "Mon, 08:14" },
    { label: "In transit", description: "Departed regional hub en route to port", timestamp: "Mon, 19:40" },
    { label: "Customs", description: "Cleared customs at destination country", timestamp: "Wed, 06:02" },
    { label: "Out for delivery", description: "Loaded on final-mile vehicle", timestamp: "Thu, 09:15" },
    { label: "Delivered", description: "Signed for at destination address", timestamp: "Thu, 13:47" },
  ],
};

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
    title: "Collect at your branch",
    description: "Get notified the moment it lands, then pick up at your nearest Deltra branch — or have it delivered.",
  },
] as const;

export type BentoFeature = {
  id: string;
  title: string;
  description: string;
  icon: "globe" | "bolt" | "tag" | "radar" | "branch";
  size: "lg" | "md" | "sm";
};

export const BENTO_FEATURES: BentoFeature[] = [
  {
    id: "air-freight",
    title: "Fast air freight",
    description:
      "Scheduled flights out of our US warehouses mean your packages are airborne within days, not weeks — every run tracked door to branch.",
    icon: "bolt",
    size: "lg",
  },
  {
    id: "pricing",
    title: "Transparent pricing",
    description: "One flat rate per pound, shown up front. No surprise fees at pickup.",
    icon: "tag",
    size: "sm",
  },
  {
    id: "tracking",
    title: "Package tracking",
    description: "Every package logged the moment it hits our US warehouse, visible in your dashboard from arrival to branch.",
    icon: "radar",
    size: "sm",
  },
  {
    id: "branches",
    title: "Local branches",
    description: "Multiple Jamaican pickup locations, with real people ready to help — not just a tracking number.",
    icon: "branch",
    size: "md",
  },
  {
    id: "reach",
    title: "Global reach, local roots",
    description: "Shop from any US retailer. Collect in Jamaica.",
    icon: "globe",
    size: "md",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Deltra Logistics replatformed our entire supply chain visibility. We went from guessing ETAs to knowing them down to the hour.",
    name: "Elena Marsh",
    title: "VP Supply Chain, Nordholt Retail",
  },
  {
    quote:
      "Their customs brokerage team alone has saved us weeks of delays a year. Genuinely the most responsive partner we've worked with.",
    name: "Rafael Costa",
    title: "Head of Logistics, Aurora Manufacturing",
  },
  {
    quote:
      "We scaled from 3 markets to 40 without ever outgrowing Deltra's network. That kind of reliability is rare at this scale.",
    name: "Priya Nandan",
    title: "COO, Fernbridge Goods",
  },
] as const;

export const CLIENT_MARQUEE = [
  "Nordholt Retail",
  "Aurora Manufacturing",
  "Fernbridge Goods",
  "Vantage Industrial",
  "Solace Consumer Group",
  "Kestrel Components",
  "Larkspur Trading Co.",
  "Havenwood Imports",
] as const;
