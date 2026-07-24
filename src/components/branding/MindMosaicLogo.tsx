import Image from "next/image";
import { twMerge } from "tailwind-merge";

export interface MindMosaicLogoProps {
  className?: string;
  compact?: boolean;
  inverse?: boolean;
}

/**
 * Wordmark lockup for authenticated app shells (parent/student/teacher/admin
 * headers, auth pages). Renders the same brain-mark artwork as the landing
 * page's `LandingLogo` (src/features/landing/components/Brand.tsx) so the
 * brand mark is one consistent identity everywhere — this previously
 * rendered an unrelated 2x2 colour-tile grid instead of the brain mark,
 * which read as two different logos depending on whether you were signed in.
 */
export function MindMosaicLogo({
  className,
  compact = false,
  inverse = false,
}: MindMosaicLogoProps) {
  return (
    <span
      className={twMerge("inline-flex items-center gap-2.5", className)}
      aria-label="MindMosaic"
    >
      <span aria-hidden="true" className="relative h-10 w-11 shrink-0">
        <Image
          src="/brand/mindmosaic-brain.png"
          alt=""
          fill
          sizes="44px"
          className="object-contain"
        />
      </span>
      {!compact && (
        <span
          className={twMerge(
            "text-xl font-black tracking-[-0.04em]",
            inverse ? "text-white" : "text-brand",
          )}
        >
          Mind
          {/*
           * WCAG 1.4.3 explicitly exempts "text that is part of a logo or
           * brand name" from contrast minimums, so the exact brand orange
           * (--royal-orange-tint, #f7700c) is used here on every
           * background — this exemption is for the logotype only; the
           * same colour is never used for functional text (buttons,
           * links, body copy) on light backgrounds. See BRAND.md.
           */}
          <span className="text-royal-orange-tint">Mosaic</span>
        </span>
      )}
    </span>
  );
}
