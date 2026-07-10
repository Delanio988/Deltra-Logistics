import { Fragment, type ReactNode } from "react";

type MarqueeProps = {
  items: readonly string[] | string[];
  className?: string;
  itemClassName?: string;
  separator?: ReactNode;
  /** Animation duration in seconds — lower is faster. */
  duration?: number;
  reverse?: boolean;
};

/**
 * Infinite horizontal marquee. Renders the item list twice back-to-back and
 * animates a translateX(-50%) loop (see `animate-marquee` in tailwind.config.ts),
 * so the seam is invisible as long as both copies are identical widths.
 */
export default function Marquee({
  items,
  className,
  itemClassName,
  separator = <span className="mx-8 text-gold/50">&#47;</span>,
  duration = 32,
  reverse = false,
}: MarqueeProps) {
  const track = (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <Fragment key={i}>
          <span className={itemClassName}>{item}</span>
          {separator}
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className={`group overflow-hidden ${className ?? ""}`}>
      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused]"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {track}
        {track}
      </div>
    </div>
  );
}
