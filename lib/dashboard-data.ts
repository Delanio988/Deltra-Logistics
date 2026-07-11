// Mock customer-portal data. Structured so it's a drop-in swap for a real API
// later — replace the arrays/objects below with fetched data and every
// consuming component (PackageCard, DropOffPanel, dashboard page) keeps working.

import type { TrackingStatus } from "@/lib/data";

export type PackageStatus = "Processing" | "In Transit" | "At Customs" | "Out for Delivery" | "Delivered";

export type Package = {
  id: string;
  trackingNumber: string;
  description: string;
  origin: string;
  destination: string;
  status: PackageStatus;
  estimatedDelivery: string;
  /** Same shape as the public tracking widget's timeline, so both share <StatusTimeline>. */
  timeline: TrackingStatus[];
};

// How many of the 5 timeline steps are complete for a given badge status.
// "Processing" sits before step 0 (nothing picked up yet), everything else
// lines up with its matching step index.
export const STATUS_STEP_INDEX: Record<PackageStatus, number> = {
  Processing: -1,
  "In Transit": 1,
  "At Customs": 2,
  "Out for Delivery": 3,
  Delivered: 4,
};

function buildTimeline(status: PackageStatus): TrackingStatus[] {
  const steps: [string, string][] = [
    ["Picked up", "Shipment collected from origin facility"],
    ["In transit", "Departed regional hub en route to port"],
    ["Customs", "Cleared customs at destination country"],
    ["Out for delivery", "Loaded on final-mile vehicle"],
    ["Delivered", "Signed for at destination address"],
  ];
  const currentIndex = STATUS_STEP_INDEX[status];
  return steps.map(([label, description], i) => ({
    label,
    description,
    timestamp: i <= currentIndex ? "Completed" : "Pending",
  }));
}

export const PACKAGES: Package[] = [
  {
    id: "pkg-1",
    trackingNumber: "DL48213097",
    description: "Electronics — 2 boxes",
    origin: "Shanghai, CN",
    destination: "Los Angeles, US",
    status: "In Transit",
    estimatedDelivery: "Jul 16, 2026",
    timeline: buildTimeline("In Transit"),
  },
  {
    id: "pkg-2",
    trackingNumber: "DL29104456",
    description: "Machine parts — 1 pallet",
    origin: "Rotterdam, NL",
    destination: "New York, US",
    status: "At Customs",
    estimatedDelivery: "Jul 14, 2026",
    timeline: buildTimeline("At Customs"),
  },
  {
    id: "pkg-3",
    trackingNumber: "DL77350281",
    description: "Textiles — 6 cartons",
    origin: "Mumbai, IN",
    destination: "Rotterdam, NL",
    status: "Processing",
    estimatedDelivery: "Jul 22, 2026",
    timeline: buildTimeline("Processing"),
  },
  {
    id: "pkg-4",
    trackingNumber: "DL10293847",
    description: "Furniture — 3 crates",
    origin: "Ho Chi Minh City, VN",
    destination: "Sydney, AU",
    status: "Out for Delivery",
    estimatedDelivery: "Jul 10, 2026",
    timeline: buildTimeline("Out for Delivery"),
  },
  {
    id: "pkg-5",
    trackingNumber: "DL63581920",
    description: "Auto parts — 1 pallet",
    origin: "Tokyo, JP",
    destination: "Los Angeles, US",
    status: "Delivered",
    estimatedDelivery: "Jul 5, 2026",
    timeline: buildTimeline("Delivered"),
  },
  {
    id: "pkg-6",
    trackingNumber: "DL39472105",
    description: "Pharma samples — 1 box",
    origin: "Singapore, SG",
    destination: "Dubai, AE",
    status: "In Transit",
    estimatedDelivery: "Jul 13, 2026",
    timeline: buildTimeline("In Transit"),
  },
];

export type DropOffLocation = {
  facilityName: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  hours: string;
  phone: string;
  lat: number;
  lng: number;
};

// TODO: mock hub — replace with the customer's real assigned facility from the API.
export const DROP_OFF_LOCATION: DropOffLocation = {
  facilityName: "Deltra Logistics — Port Newark Hub",
  addressLine1: "1400 Corbin St",
  city: "Elizabeth",
  region: "NJ",
  postalCode: "07201",
  country: "United States",
  hours: "Mon–Fri, 7:00 AM – 7:00 PM · Sat, 8:00 AM – 2:00 PM",
  phone: "+1 (800) 555-0148",
  lat: 40.6895,
  lng: -74.1745,
};
