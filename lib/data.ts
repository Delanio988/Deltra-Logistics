// Centralized placeholder content for Deltra Logistics (placeholder brand name).
// Swap copy, numbers, and TODO-marked assets with real brand data before launch.

export const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Network", href: "#network" },
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

export const FEATURES = [
  {
    number: "01",
    title: "Global reach, local expertise",
    description:
      "Operating in 180+ countries with on-the-ground teams who understand regional regulations, ports, and partners better than anyone.",
    // TODO: replace with real operations photography
    image: "/images/feature-global.svg",
  },
  {
    number: "02",
    title: "Technology-first visibility",
    description:
      "Live shipment tracking, predictive ETAs, and API integrations give you full control of your supply chain from pickup to delivery.",
    // TODO: replace with real dashboard/product screenshot
    image: "/images/feature-tech.svg",
  },
  {
    number: "03",
    title: "Built for scale",
    description:
      "From single pallets to multi-modal enterprise programs, our infrastructure flexes with demand without sacrificing service quality.",
    // TODO: replace with real warehouse/fleet photography
    image: "/images/feature-scale.svg",
  },
] as const;

export type Hub = {
  id: string;
  name: string;
  // Coordinates as percentages of the map viewBox (0-100), hand-placed for the
  // stylized world map in components/sections/GlobalNetwork.tsx
  x: number;
  y: number;
};

export const HUBS: Hub[] = [
  { id: "la", name: "Los Angeles", x: 14, y: 40 },
  { id: "nyc", name: "New York", x: 26, y: 36 },
  { id: "sao", name: "São Paulo", x: 33, y: 68 },
  { id: "london", name: "London", x: 48, y: 28 },
  { id: "rotterdam", name: "Rotterdam", x: 50, y: 27 },
  { id: "dubai", name: "Dubai", x: 62, y: 45 },
  { id: "mumbai", name: "Mumbai", x: 66, y: 48 },
  { id: "singapore", name: "Singapore", x: 76, y: 58 },
  { id: "shanghai", name: "Shanghai", x: 82, y: 38 },
  { id: "tokyo", name: "Tokyo", x: 88, y: 37 },
  { id: "sydney", name: "Sydney", x: 87, y: 75 },
];

export const ROUTES: [string, string][] = [
  ["la", "nyc"],
  ["la", "tokyo"],
  ["nyc", "london"],
  ["london", "rotterdam"],
  ["rotterdam", "dubai"],
  ["dubai", "mumbai"],
  ["mumbai", "singapore"],
  ["singapore", "shanghai"],
  ["shanghai", "tokyo"],
  ["singapore", "sydney"],
  ["sao", "nyc"],
  ["sao", "london"],
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
    title: "Request a quote",
    description: "Tell us what you're shipping, where, and when. Get a transparent, competitive quote within hours.",
  },
  {
    number: "02",
    title: "We plan the route",
    description: "Our logistics team builds the optimal multi-modal route across our global carrier network.",
  },
  {
    number: "03",
    title: "Cargo moves, you track it",
    description: "Real-time visibility from pickup through customs to final delivery — no guessing, no gaps.",
  },
  {
    number: "04",
    title: "Delivered, on time",
    description: "Signed, confirmed, and backed by our 99.8% on-time guarantee.",
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
