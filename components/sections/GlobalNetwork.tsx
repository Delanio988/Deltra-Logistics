"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HUBS, ROUTES, type Hub } from "@/lib/data";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useReducedMotion } from "@/lib/useReducedMotion";

const hubById = new Map<string, Hub>(HUBS.map((h) => [h.id, h]));
const VIEW_W = 100;
const VIEW_H = 80;

/** Builds a gentle arc (quadratic bezier) between two hubs, bowing toward the top. */
function arcPath(a: Hub, b: Hub) {
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2 - Math.min(14, Math.abs(a.x - b.x) / 4 + 6);
  return `M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`;
}

export default function GlobalNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !svgRef.current || !sectionRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const paths = gsap.utils.toArray<SVGPathElement>(".route-path");
      paths.forEach((path) => {
        const length = path.getTotalLength();
        // Draw each route in from nothing, staggered, once the map scrolls into view.
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
          delay: gsap.utils.random(0, 0.6),
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section id="network" ref={sectionRef} className="relative overflow-hidden bg-navy-950 py-28 text-white lg:py-36">
      <div className="mx-auto max-w-container px-6 lg:px-12">
        <ScrollReveal className="max-w-2xl">
          <span className="gold-label">Global Network</span>
          <h2 className="mt-6 text-display-md font-extrabold text-white">
            A footprint built for reach
          </h2>
          <p className="mt-5 text-white/65">
            Eleven strategic hubs, hundreds of active lanes, one connected network moving
            freight across every major trade corridor.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15} className="relative mt-14">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            role="img"
            aria-label="Stylized map of Meridian Freight's global hub network with connecting trade routes"
            className="h-auto w-full"
          >
            {/* Faint global grid to suggest a world map without literal geography */}
            <defs>
              <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M5 0H0V5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.15" />
              </pattern>
              <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#grid)" />

            {/* Routes */}
            <g fill="none" strokeWidth="0.3">
              {ROUTES.map(([fromId, toId], i) => {
                const from = hubById.get(fromId);
                const to = hubById.get(toId);
                if (!from || !to) return null;
                const id = `route-${i}`;
                return (
                  <g key={id}>
                    <path
                      id={id}
                      className="route-path"
                      d={arcPath(from, to)}
                      stroke="#D4AF37"
                      opacity={0.55}
                    />
                    {!prefersReducedMotion && (
                      <circle r="0.5" fill="#F7F8FA">
                        <animateMotion
                          dur={`${4 + (i % 4)}s`}
                          repeatCount="indefinite"
                          begin={`${i * 0.4}s`}
                        >
                          <mpath href={`#${id}`} />
                        </animateMotion>
                      </circle>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Hubs */}
            <g>
              {HUBS.map((hub) => (
                <g key={hub.id}>
                  <circle cx={hub.x} cy={hub.y} r="3.2" fill="url(#hubGlow)" />
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r="0.9"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="0.25"
                    className={prefersReducedMotion ? undefined : "origin-center animate-pulse-slow"}
                  />
                  <circle cx={hub.x} cy={hub.y} r="0.55" fill="#F7F8FA" />
                </g>
              ))}
            </g>
          </svg>

          {/* Hub labels laid out as an accessible list, positioned to match the SVG points */}
          <ul className="pointer-events-none absolute inset-0">
            {HUBS.map((hub) => (
              <li
                key={hub.id}
                style={{ left: `${hub.x}%`, top: `${(hub.y / VIEW_H) * 100}%` }}
                className="absolute -translate-x-1/2 translate-y-2 whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-white/50"
              >
                {hub.name}
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </section>
  );
}
