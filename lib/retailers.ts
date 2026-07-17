// Third-party retailer names/logos shown for nominative use only — describing
// which US stores this freight-forwarding service can ship from, not an
// endorsement, partnership, or logo license. Edit this list freely to add or
// remove stores. See public/brands/README.md for where each logo came from.

export type Retailer = {
  name: string;
  /** Path under /public — omit to fall back to a styled text lockup in LogoTile. */
  logo?: string;
  /** Reserved for a future click-through to the retailer's site — not wired up yet. */
  url?: string;
};

export const RETAILERS: Retailer[] = [
  { name: "Amazon", url: "https://www.amazon.com" },
  { name: "SHEIN", url: "https://www.shein.com" },
  { name: "AliExpress", logo: "/brands/aliexpress.svg", url: "https://www.aliexpress.com" },
  { name: "Walmart", url: "https://www.walmart.com" },
  { name: "eBay", logo: "/brands/ebay.svg", url: "https://www.ebay.com" },
  { name: "Temu", url: "https://www.temu.com" },
  { name: "Best Buy", url: "https://www.bestbuy.com" },
  { name: "Nike", logo: "/brands/nike.svg", url: "https://www.nike.com" },
  { name: "Macy's", logo: "/brands/macys.svg", url: "https://www.macys.com" },
  { name: "ASOS", url: "https://www.asos.com" },
];
