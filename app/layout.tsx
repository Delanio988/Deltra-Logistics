import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";
import CustomCursor from "@/components/ui/CustomCursor";
import Noise from "@/components/ui/Noise";
import SeasonalDecorationLayer from "@/components/ui/SeasonalDecorationLayer";
import { AuthProvider } from "@/lib/auth-context";
import { SeasonalProvider } from "@/lib/seasonal-context";
import { getSiteSettings } from "@/lib/settings";
import ThemeProvider from "@/lib/theme-provider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const title = "Deltra Logistics | Global Shipping & Logistics";
const description =
  "Deltra Logistics moves your packages from US retailers straight to your door in Jamaica — ocean and air freight, tracked from warehouse to branch.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title,
  description,
  openGraph: {
    title,
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Deltra Logistics" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seasonalSettings = await getSiteSettings();

  // suppressHydrationWarning: some browser extensions (ad blockers, dev
  // tools, etc.) inject attributes onto <html> right after the server's
  // HTML arrives but before React hydrates — a false-positive mismatch
  // that isn't caused by app code. This only suppresses warnings for
  // this element's own attributes, not its children.
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="bg-bg text-fg font-sans antialiased transition-colors duration-200 motion-reduce:transition-none">
        <ThemeProvider>
          <AuthProvider>
            <SeasonalProvider initialSettings={seasonalSettings}>
              <SmoothScrollProvider>
                <CustomCursor />
                <Noise />
                <SeasonalDecorationLayer />
                {children}
              </SmoothScrollProvider>
            </SeasonalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
