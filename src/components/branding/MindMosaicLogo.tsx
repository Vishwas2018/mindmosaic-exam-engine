import Image from "next/image";
import { twMerge } from "tailwind-merge";

export interface MindMosaicLogoProps {
  className?: string;
  /** "lockup" (mark + wordmark, default) or "mark" (mark only). */
  variant?: "lockup" | "mark";
  /** Mark height/width in px. Switches source art above LARGE_MARK_THRESHOLD. */
  size?: number;
  inverse?: boolean;
}

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
}: MindMosaicLogoProps) {
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
          className="font-[family-name:var(--font-logo)] font-bold tracking-[-0.03em]"
          style={{ fontSize: wordmarkSize, lineHeight: 1 }}
        >
          <span className={inverse ? "text-white" : "text-brand"}>Mind</span>
          <span className="text-brand-coral">Mosaic</span>
        </span>
      )}
    </span>
  );
}
