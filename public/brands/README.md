# Brand logo assets

Used by the "Shop your favorite US stores" homepage section
(`components/sections/FloatingRetailers.tsx`). Each brand's own color is
baked into its SVG's `fill` (not `currentColor`) because `next/image` renders
SVGs as opaque `<img>` resources — CSS can't recolor them after the fact.

## Sourced from Simple Icons (MIT license, simpleicons.org)

Generated from the `simple-icons` npm package (v16.26.0), one file per brand,
brand hex color baked in at generation time:

- `aliexpress.svg` — #FF4747
- `ebay.svg` — #E53238
- `macys.svg` — #E21A2C
- `nike.svg` — #111111

// TODO: swap these for official brand assets (each company's press/media
kit) if a higher-fidelity or more current mark is available.

## No clean SVG available — text lockup fallback

Simple Icons does not currently include these brands. Rather than fabricate
a logo, `lib/retailers.ts` leaves their `logo` field unset and `LogoTile`
renders a styled text lockup (the brand name) inside the same tile instead:

- Amazon
- SHEIN
- Walmart
- Temu
- Best Buy
- ASOS

// TODO: swap in an official SVG/PNG from each retailer's brand/press kit,
then set that brand's `logo` path in `lib/retailers.ts` — `LogoTile` will
automatically switch from the text lockup to the image once `logo` is set.
