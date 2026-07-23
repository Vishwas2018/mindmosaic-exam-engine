import Image from "next/image";
import { clsx } from "clsx";

/**
 * Landing logo lockup: the puzzle-brain artwork plus wordmark.
 * `public/brand/brain-mark.svg` is the simplified reusable SVG treatment;
 * the raster artwork is used where its detail reads well (nav, footer, hero).
 */
export function LandingLogo({
  inverse = false,
  className,
}: {
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/brand/mindmosaic-brain.png"
        alt=""
        aria-hidden="true"
        width={48}
        height={40}
        priority
        className="h-10 w-12 object-contain"
      />
      <span
        className={clsx(
          "font-display text-[1.35rem] font-bold tracking-[-0.03em]",
          inverse ? "text-white" : "text-brand-ink",
        )}
      >
        Mind
        <span className={inverse ? "text-royal-orange-tint" : "text-warning"}>Mosaic</span>
      </span>
    </span>
  );
}
