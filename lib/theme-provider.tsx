"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Thin client-component wrapper — app/layout.tsx is a server component and
 * can't import next-themes' ThemeProvider directly. attribute="class" toggles
 * .dark on <html> (which every color token in globals.css/tailwind.config.ts
 * keys off of); enableSystem lets "system" follow the OS preference; the
 * default stays "dark" so nothing changes for existing visitors until they
 * explicitly choose a theme.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
