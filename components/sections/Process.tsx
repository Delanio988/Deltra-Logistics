"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROCESS_STEPS } from "@/lib/data";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

type Step = (typeof PROCESS_STEPS)[number];

const CARD_WIDTH = 420;
const CARD_GAP = 32;

function SectionHeading() {
  return (
    <div className="max-w-2xl">
      <span className="gold-label">How It Works</span>
      <h2 className="mt-6 text-display-md font-extrabold text-navy-950">
        From checkout in the US to pickup in Jamaica
      </h2>
    </div>
  );
}

function StepCard({ step, className }: { step: Step; className?: string }) {
  return (
    <div className={cn("shrink-0 rounded-3xl border border-navy-950/8 bg-offwhite p-10", className)}>
      <span className="text-5xl font-extrabold text-gold/40">{step.number}</span>
      <h3 className="mt-6 text-2xl font-bold text-navy-950">{step.title}</h3>
      <p className="mt-4 text-[15px] leading-relaxed text-navy-950/65">{step.description}</p>
    </div>
  );
}

/** Row of dots joined by a red gradient line — the "route" motif connecting
 *  each step. Item widths include the following gap so the line runs flush
 *  into the next dot with no visible break. */
function RouteLine() {
  return (
    <div aria-hidden className="flex">
      {PROCESS_STEPS.map((step, i) => {
        const isLast = i === PROCESS_STEPS.length - 1;
        return (
          <div
            key={step.number}
            className="flex shrink-0 items-center"
            style={{ width: isLast ? CARD_WIDTH : CARD_WIDTH + CARD_GAP }}
          >
            <span className="h-3 w-3 shrink-0 rounded-full bg-accent shadow-[0_0_14px_rgba(255,46,46,0.65)]" />
            {!isLast && <span className="h-0.5 flex-1 bg-gradient-to-r from-accent to-accent/30" />}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Desktop: a pinned, horizontally-scrubbed timeline — the section holds scroll
 * in place while the step track translates left, driven 1:1 by scroll progress
 * (GSAP ScrollTrigger `scrub`). Mobile/reduced-motion: a plain stacked list,
 * since scroll-jacking horizontal panels don't translate well to touch scroll.
 */
export default function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    // Horizontal scrub is a desktop-only trick — narrow viewports keep the
    // static stacked layout via the `lg:hidden` / `lg:block` classes below.
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop || !sectionRef.current || !trackRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const track = trackRef.current!;
      const getScrollDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${getScrollDistance()}`,
          scrub: 0.6,
          pin: true,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section id="process" ref={sectionRef} className="relative overflow-hidden bg-white">
      {/* Pinned horizontal track (desktop only, motion allowed) */}
      <div className="hidden min-h-screen flex-col justify-center py-20 lg:flex">
        <div className="mx-auto w-full max-w-container px-6 lg:px-12">
          <SectionHeading />
        </div>
        <div ref={trackRef} className="mt-16 w-max px-6 lg:px-12">
          <div className="mb-6">
            <RouteLine />
          </div>
          <div className="flex w-max gap-8">
            {PROCESS_STEPS.map((step) => (
              <StepCard key={step.number} step={step} className="w-[420px]" />
            ))}
            {/* Trailing spacer so the last card clears the viewport edge at scroll end */}
            <div className="w-[10vw] shrink-0" aria-hidden />
          </div>
        </div>
      </div>

      {/* Static stacked layout for mobile/tablet and reduced-motion users */}
      <div className="py-28 lg:hidden">
        <div className="mx-auto max-w-container px-6">
          <SectionHeading />
          <div className="mt-14 flex flex-col gap-6">
            {PROCESS_STEPS.map((step, i) => {
              const isLast = i === PROCESS_STEPS.length - 1;
              return (
                <div key={step.number} className="relative pl-8">
                  <span
                    aria-hidden
                    className="absolute left-0 top-2 h-3 w-3 rounded-full bg-accent shadow-[0_0_14px_rgba(255,46,46,0.65)]"
                  />
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-[5px] top-6 h-[calc(100%+0.5rem)] w-0.5 bg-gradient-to-b from-accent to-accent/20"
                    />
                  )}
                  <StepCard step={step} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
