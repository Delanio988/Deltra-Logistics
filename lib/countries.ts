// Small country/dial-code list for the sign-up phone field. Jamaica is first
// (and the default selection) since it's the primary market for the mock
// Montego Bay branches in lib/dashboard-data.ts; the rest cover common
// Caribbean/North American markets. Extend freely — nothing else depends on
// this list being exhaustive.
export type Country = {
  name: string;
  dial: string;
  iso: string;
};

export const COUNTRIES: Country[] = [
  { name: "Jamaica", dial: "+1", iso: "JM" },
  { name: "United States", dial: "+1", iso: "US" },
  { name: "Canada", dial: "+1", iso: "CA" },
  { name: "United Kingdom", dial: "+44", iso: "GB" },
  { name: "Trinidad & Tobago", dial: "+1", iso: "TT" },
  { name: "Barbados", dial: "+1", iso: "BB" },
  { name: "Bahamas", dial: "+1", iso: "BS" },
  { name: "Cayman Islands", dial: "+1", iso: "KY" },
];
