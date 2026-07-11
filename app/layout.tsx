import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";
import CustomCursor from "@/components/ui/CustomCursor";
import Noise from "@/components/ui/Noise";
import { AuthProvider } from "@/lib/auth-context";
import { DataStoreProvider } from "@/lib/data-store";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deltra Logistics | Global Shipping & Logistics",
  description:
    "Deltra Logistics moves the world's cargo by ocean, air, and road — 180+ countries, 2M+ shipments delivered, 99.8% on-time performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="antialiased bg-offwhite text-ink font-sans">
        <AuthProvider>
          <DataStoreProvider>
            <SmoothScrollProvider>
              <CustomCursor />
              <Noise />
              {children}
            </SmoothScrollProvider>
          </DataStoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
