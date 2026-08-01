"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS } from "@/lib/data";
import { useLenis } from "@/components/layout/SmoothScrollProvider";
import MagneticButton from "@/components/ui/MagneticButton";
import Wordmark from "@/components/ui/Wordmark";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SeasonalGreetingBanner from "@/components/ui/SeasonalGreetingBanner";
import NavPillIndicator from "@/components/ui/NavPillIndicator";
import { cn } from "@/lib/utils";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const lenis = useLenis();
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  // Hash-anchor links (#services, #tracking, ...) have no "current page" —
  // only a real route like /quote can be the active link. No scroll-spy.
  const activeHref = NAV_LINKS.find((link) => !link.href.startsWith("#") && link.href === pathname)?.href ?? null;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileOpen(false);

    // Off the homepage there's nothing here for these anchors to scroll to —
    // navigate to the homepage section instead of silently doing nothing.
    if (!isHomepage) {
      window.location.href = `/${href}`;
      return;
    }

    const target = document.querySelector(href);
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target as HTMLElement, { offset: -88, duration: 1.4 });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        isScrolled || isMobileOpen
          ? "bg-bg/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(255,101,56,0.15)]"
          : "bg-transparent"
      )}
    >
      <SeasonalGreetingBanner scope="public" />
      <div className="mx-auto flex h-[--header-height] max-w-container items-center justify-between px-6 lg:px-12">
        {isHomepage ? (
          <a href="#top" onClick={(e) => handleNavClick(e, "#top")} data-cursor-hover="Home" className="text-fg">
            <Wordmark responsive animated className="h-8 lg:h-9" />
          </a>
        ) : (
          <Link href="/" data-cursor-hover="Home" className="text-fg">
            <Wordmark responsive animated className="h-8 lg:h-9" />
          </Link>
        )}

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {NAV_LINKS.map((link) => {
            const target = hoveredHref ?? activeHref;
            const isTarget = target === link.href;
            const isActive = activeHref === link.href;
            const linkClassName = cn(
              "relative rounded-full px-4 py-2 text-sm font-medium tracking-wide transition-colors",
              FOCUS_RING,
              isActive ? "text-navy-950" : "text-fg/80 hover:text-accent"
            );
            const linkProps = {
              "data-cursor-hover": link.label,
              onMouseEnter: () => setHoveredHref(link.href),
              onFocus: () => setHoveredHref(link.href),
              onBlur: () => setHoveredHref(null),
              className: linkClassName,
            };

            return link.href.startsWith("#") ? (
              <a key={link.href} {...linkProps} href={link.href} onClick={(e) => handleNavClick(e, link.href)}>
                {isTarget && <NavPillIndicator layoutId="marketing-nav-pill" active={isActive} />}
                <span className="relative">{link.label}</span>
              </a>
            ) : (
              <Link key={link.href} {...linkProps} href={link.href}>
                {isTarget && <NavPillIndicator layoutId="marketing-nav-pill" active={isActive} />}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <ThemeToggle />
          <MagneticButton
            href="/login"
            cursorLabel="Login"
            className="bg-accent text-navy-950 shadow-accent hover:bg-accent-dark hover:text-white"
          >
            Login
          </MagneticButton>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMobileOpen((v) => !v)}
            aria-expanded={isMobileOpen}
            aria-label="Toggle navigation menu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
          >
            <span
              className={cn(
                "h-[2px] w-6 bg-fg transition-transform duration-300",
                isMobileOpen && "translate-y-[7px] rotate-45"
              )}
            />
            <span
              className={cn(
                "h-[2px] w-6 bg-fg transition-opacity duration-300",
                isMobileOpen && "opacity-0"
              )}
            />
            <span
              className={cn(
                "h-[2px] w-6 bg-fg transition-transform duration-300",
                isMobileOpen && "-translate-y-[7px] -rotate-45"
              )}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-bg lg:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1 px-6 pb-8 pt-2">
              {NAV_LINKS.map((link) => {
                const isActive = activeHref === link.href;
                const mobileClassName = cn(
                  "border-b border-fg/10 py-4 text-lg font-medium",
                  isActive ? "rounded-full border-b-0 bg-accent px-4 text-navy-950" : "text-fg/90"
                );
                return link.href.startsWith("#") ? (
                  <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className={mobileClassName}>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.href} href={link.href} onClick={() => setIsMobileOpen(false)} className={mobileClassName}>
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className="mt-4 rounded-full bg-accent px-6 py-3 text-center text-sm font-semibold text-navy-950"
              >
                Login
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
