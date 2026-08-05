import Image from "next/image";
import { twMerge } from "tailwind-merge";

export interface MindMosaicLogoProps {
  className?: string;
  /** "lockup" (mark + wordmark, default) or "mark" (mark only). */
  variant?: "lockup" | "mark";
  /** Mark height/width in px. Switches source art above LARGE_MARK_THRESHOLD. */
  size?: number;
  inverse?: boolean;
  /**
   * Which colour "Mind" takes when `inverse` is set. White is the existing
   * behaviour and stays the default; "lilac" is the design handoff's
   * treatment for the wordmark on the plum auth panel (#C9B6E4). Ignored
   * unless `inverse` is true.
   */
  inverseTone?: "white" | "lilac";
  /**
   * Trademark symbol after the wordmark. "registered" (®) is the default;
   * "tm" (™) is the correct mark for an unregistered claim, and "none"
   * drops it for places the symbol would be noise (favicon-scale lockups).
   */
  trademark?: "registered" | "tm" | "none";
}

const trademarkGlyphs: Record<"registered" | "tm", string> = {
  registered: "®",
  tm: "™",
};

// Above this the 96px mark art starts showing compression artifacts, so the
// 192px source takes over instead of upscaling it.
const LARGE_MARK_THRESHOLD = 64;

/**
 * Single logo renderer for the whole app — every header, auth screen, and
 * footer routes through this component instead of holding its own copy of
 * the brain-mark artwork. Never imports the 394 KB master SVG
 * (public/brand/mindmosaic-brain-master.svg); the mark is always one of the
 * pre-exported raster sizes in public/brand/.
 */
export function MindMosaicLogo({
  className,
  variant = "lockup",
  size = 40,
  inverse = false,
  inverseTone = "white",
  trademark = "registered",
}: MindMosaicLogoProps) {
  const mindClass = inverse
    ? inverseTone === "lilac"
      ? "text-mm-lilac"
      : "text-white"
    : "text-brand";
  const markSrc =
    size > LARGE_MARK_THRESHOLD ? "/brand/mark-192.webp" : "/brand/mark-96.webp";
  const markWidth = Math.round(size * 1.1);
  const wordmarkSize = Math.round(size * 0.6);
  const lockupGap = Math.round(size * 0.25);

  return (
    <span
      className={twMerge("inline-flex items-center", className)}
      aria-label="MindMosaic"
      style={{ gap: lockupGap }}
    >
      <span
        aria-hidden="true"
        className="relative shrink-0"
        style={{ width: markWidth, height: size }}
      >
        <Image
          src={markSrc}
          alt=""
          fill
          sizes={`${markWidth}px`}
          className="object-contain"
        />
      </span>
      {variant === "lockup" && (
        <span
          className="font-[family-name:var(--font-logo)] tracking-[-0.03em]"
          // fontWeight is pinned here rather than via `font-bold`: the
          // app-wide weight scale in globals.css remaps `bold` to 600, and
          // Roboto is loaded at 700 only. The wordmark is a fixed brand
          // asset, so it does not follow the page weight scale.
          style={{ fontSize: wordmarkSize, lineHeight: 1, fontWeight: 700 }}
        >
          <span className={mindClass}>Mind</span>
          <span className="text-brand-coral">Mosaic</span>
          {trademark !== "none" && (
            /*
             * Decorative: the accessible name on the wrapper is already
             * "MindMosaic", and screen readers announcing "registered
             * trademark" after every header logo is noise. Sized in em so it
             * tracks the wordmark at every `size`, and raised rather than
             * using <sup> so it never affects the lockup's line box.
             */
            <span
              aria-hidden="true"
              className={inverse ? "text-white/70" : "text-brand-coral"}
              style={{
                fontSize: "0.42em",
                fontWeight: 500,
                verticalAlign: "super",
                marginLeft: "0.12em",
                letterSpacing: 0,
              }}
            >
              {trademarkGlyphs[trademark]}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
