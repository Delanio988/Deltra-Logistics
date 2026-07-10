"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS } from "@/lib/data";
import { useLenis } from "@/components/layout/SmoothScrollProvider";
import MagneticButton from "@/components/ui/MagneticButton";
import { cn } from "@/lib/utils";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileOpen(false);
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
          ? "bg-navy-950/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(212,175,55,0.15)]"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-[--header-height] max-w-container items-center justify-between px-6 lg:px-12">
        <a
          href="#top"
          onClick={(e) => handleNavClick(e, "#top")}
          data-cursor-hover="Home"
          className="font-extrabold tracking-tight text-white"
        >
          <span className="text-lg lg:text-xl">
            MERIDIAN <span className="text-gold">FREIGHT</span>
          </span>
        </a>

        <nav className="hidden items-center gap-10 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              data-cursor-hover={link.label}
              className="text-sm font-medium tracking-wide text-white/80 transition-colors hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <MagneticButton
            href="#contact"
            cursorLabel="Quote"
            className="bg-gold text-navy-950 shadow-gold hover:bg-gold-light"
          >
            Get a Quote
          </MagneticButton>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen((v) => !v)}
          aria-expanded={isMobileOpen}
          aria-label="Toggle navigation menu"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
        >
          <span
            className={cn(
              "h-[2px] w-6 bg-white transition-transform duration-300",
              isMobileOpen && "translate-y-[7px] rotate-45"
            )}
          />
          <span
            className={cn(
              "h-[2px] w-6 bg-white transition-opacity duration-300",
              isMobileOpen && "opacity-0"
            )}
          />
          <span
            className={cn(
              "h-[2px] w-6 bg-white transition-transform duration-300",
              isMobileOpen && "-translate-y-[7px] -rotate-45"
            )}
          />
        </button>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-navy-950 lg:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1 px-6 pb-8 pt-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="border-b border-white/10 py-4 text-lg font-medium text-white/90"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, "#contact")}
                className="mt-4 rounded-full bg-gold px-6 py-3 text-center text-sm font-semibold text-navy-950"
              >
                Get a Quote
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
