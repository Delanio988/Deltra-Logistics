import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholder section imagery in /public/images is authored SVG (not
    // user-uploaded), so it's safe to allow through the image optimizer.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
