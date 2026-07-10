"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TESTIMONIALS } from "@/lib/data";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = (next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex((next + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const testimonial = TESTIMONIALS[index];

  return (
    <section className="bg-navy-950 py-28 text-white lg:py-36">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <span className="gold-label justify-center">Client Voices</span>

          <div className="relative mt-10 min-h-[220px]">
            <svg
              aria-hidden
              viewBox="0 0 60 48"
              className="mx-auto h-10 w-12 text-gold/50"
              fill="currentColor"
            >
              <path d="M0 48V28.8C0 12.8 8.8 2.4 24 0l3.2 6.4C18.4 9.6 13.6 15.2 12.8 22.4H24V48H0zm32 0V28.8C32 12.8 40.8 2.4 56 0l3.2 6.4c-8.8 3.2-13.6 8.8-14.4 16H56V48H32z" />
            </svg>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.blockquote
                key={index}
                custom={direction}
                initial={{ opacity: 0, x: 40 * direction }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 * direction }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6"
              >
                <p className="text-display-sm font-medium leading-snug text-white">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <footer className="mt-8 text-sm text-white/60">
                  <span className="font-semibold text-white">{testimonial.name}</span>
                  {" — "}
                  {testimonial.title}
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              data-cursor-hover="Prev"
              aria-label="Previous testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-gold hover:text-gold"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="flex items-center gap-2" role="tablist" aria-label="Select testimonial">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Testimonial from ${t.name}`}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-8 bg-gold" : "w-1.5 bg-white/25"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              data-cursor-hover="Next"
              aria-label="Next testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-gold hover:text-gold"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
