import { Fragment, type ReactNode } from "react";

type MarqueeProps<T> = {
  items: readonly T[] | T[];
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  /** Rendered between items. Pass `null` to disable and rely on `gapClassName` spacing instead. */
  separator?: ReactNode | null;
  gapClassName?: string;
  /** Animation duration in seconds — lower is faster. */
  duration?: number;
  reverse?: boolean;
};

/**
 * Infinite horizontal marquee. Renders the item list twice back-to-back and
 * animates a translateX(-50%) loop (see `animate-marquee` in tailwind.config.ts),
 * so the seam is invisible as long as both copies are identical widths.
 * Rendering is entirely up to the caller via `renderItem` — this component
 * only owns the looping/pause-on-hover mechanics.
 */
export default function Marquee<T>({
  items,
  renderItem,
  className,
  separator = <span className="mx-8 text-gold/50">&#47;</span>,
  gapClassName = "",
  duration = 32,
  reverse = false,
}: MarqueeProps<T>) {
  const track = (
    <div className={`flex shrink-0 items-center ${gapClassName}`}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {renderItem(item, i)}
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
