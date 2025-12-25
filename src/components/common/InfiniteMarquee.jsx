import React, { useMemo } from "react";

/**
 * InfiniteMarquee
 * - duplicates items list twice to avoid gaps
 * - supports direction: "left" | "right"
 * - supports speed: "normal" | "slow" | "xslow"
 * - supports durationSec override
 */
export default function InfiniteMarquee({
  items,
  renderItem,
  speed = "normal", // "normal" | "slow" | "xslow"
  direction = "left", // "left" | "right"
  durationSec, // optional number
  className = "",
  trackClassName = "",
  itemGapPx = 12,
  pauseOnHover = true,
  ariaLabel,
}) {
  const doubled = useMemo(() => [...items, ...items], [items]);

  const resolvedDuration =
    typeof durationSec === "number"
      ? `${durationSec}s`
      : speed === "xslow"
      ? "160s"
      : speed === "slow"
      ? "80s"
      : "42s";

  const keyframeName = direction === "right" ? "marquee-right" : "marquee-left";

  return (
    <div
      className={[
        "w-full overflow-hidden",
        pauseOnHover ? "marquee-pause" : "",
        className,
      ].join(" ")}
      aria-label={ariaLabel}
    >
      <div
        className={["flex w-max", trackClassName].join(" ")}
        style={{
          gap: `${itemGapPx}px`,
          animation: `${keyframeName} ${resolvedDuration} linear infinite`,
        }}
      >
        {doubled.map((item, idx) => (
          <div key={`${item?.id ?? idx}-${idx}`} className="shrink-0">
            {renderItem(item, idx)}
          </div>
        ))}
      </div>

      <style>{`
        .marquee-pause:hover > div { animation-play-state: paused; }

        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes marquee-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
