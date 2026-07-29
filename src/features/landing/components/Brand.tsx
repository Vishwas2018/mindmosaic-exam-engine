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
        width={64}
        height={54}
        priority
        className="h-14 w-16 object-contain"
      />
      <span
        className={clsx(
          "font-sans text-[1.7rem] font-bold tracking-[-0.02em]",
          inverse ? "text-white" : "text-brand",
        )}
      >
        Mind
        {/*
         * WCAG 1.4.3 exempts "text that is part of a logo or brand name"
         * from contrast minimums, so the exact brand orange
         * (--royal-orange-tint, #f7700c) is used here on every
         * background — logotype only; never used for functional text
         * (buttons, links, body copy) on light backgrounds. See BRAND.md.
         */}
        <span className="text-royal-orange-tint">Mosaic</span>
      </span>
    </span>
  );
}
