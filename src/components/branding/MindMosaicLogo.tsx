import Image from "next/image";
import { twMerge } from "tailwind-merge";

export type MindMosaicLogoSize = "sm" | "md" | "lg";
export type MindMosaicLogoVariant = "light" | "inverse";

export interface MindMosaicLogoProps {
  className?: string;
  /**
   * Controlled colour variant:
   * - "light" (default): for white / light / ivory surfaces (Mind in brand purple, Mosaic in coral).
   * - "inverse": for dark purple / plum / brand-ink surfaces (Mind in white/lilac, Mosaic in coral).
   */
  variant?: MindMosaicLogoVariant;
  /**
   * Explicit discrete logo size:
   * - "sm": compact (mark 26px, font 16px) — sidebars, compact footers, in-app chrome
   * - "md": standard default (mark 34px, font 21px) — top navigation, shells, auth screens
   * - "lg": prominent (mark 44px, font 27px) — hero displays, splash cards
   */
  size?: MindMosaicLogoSize | number;
  /**
   * Backwards-compatible alias for `variant="inverse"`.
   */
  inverse?: boolean;
  /**
   * Specific tone for "Mind" when inverse is active. Defaults to "white".
   * "lilac" (#C9B6E4) is approved for the auth mosaic plum panel.
   */
  inverseTone?: "white" | "lilac";
  /**
   * Layout mode: "lockup" (mark + wordmark, default) or "mark" (mark only).
   */
  layout?: "lockup" | "mark";
  /**
   * Trademark symbol display: "registered" (®) by default.
   */
  trademark?: "registered" | "tm" | "none";
}

const SIZE_METRICS: Record<
  MindMosaicLogoSize,
  {
    markHeight: number;
    markWidth: number;
    fontSize: number;
    gap: number;
    src: string;
  }
> = {
  sm: {
    markHeight: 26,
    markWidth: 29,
    fontSize: 16,
    gap: 6,
    src: "/brand/mark-96.webp",
  },
  md: {
    markHeight: 34,
    markWidth: 38,
    fontSize: 21,
    gap: 8,
    src: "/brand/mark-96.webp",
  },
  lg: {
    markHeight: 44,
    markWidth: 49,
    fontSize: 27,
    gap: 10,
    src: "/brand/mark-192.webp",
  },
};

function resolveSize(size: MindMosaicLogoSize | number | undefined): MindMosaicLogoSize {
  if (!size || size === "md") return "md";
  if (size === "sm") return "sm";
  if (size === "lg") return "lg";
  if (typeof size === "number") {
    if (size <= 28) return "sm";
    if (size >= 42) return "lg";
    return "md";
  }
  return "md";
}

const trademarkGlyphs: Record<"registered" | "tm", string> = {
  registered: "®",
  tm: "™",
};

/**
 * Authoritative MindMosaic Logo component.
 *
 * Enforces canonical brand proportions, spacing, typography, and controlled
 * variants across every public page, auth screen, and product shell.
 */
export function MindMosaicLogo({
  className,
  variant = "light",
  size = "md",
  inverse = false,
  inverseTone = "white",
  layout = "lockup",
  trademark = "registered",
}: MindMosaicLogoProps) {
  const isInverse = variant === "inverse" || inverse;
  const resolvedSize = resolveSize(size);
  const metrics = SIZE_METRICS[resolvedSize];

  const mindClass = isInverse
    ? inverseTone === "lilac"
      ? "text-mm-lilac"
      : "text-white"
    : "text-brand";

  const mosaicClass = "text-brand-coral";

  return (
    <span
      className={twMerge("inline-flex select-none items-center leading-none", className)}
      aria-label="MindMosaic"
      role="img"
      style={{ gap: metrics.gap }}
    >
      <span
        aria-hidden="true"
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: metrics.markWidth, height: metrics.markHeight }}
      >
        <Image
          src={metrics.src}
          alt=""
          width={metrics.markWidth}
          height={metrics.markHeight}
          className="h-full w-full object-contain"
          priority
        />
      </span>
      {layout === "lockup" && (
        <span
          className="font-[family-name:var(--font-logo)] tracking-[-0.03em] flex items-center"
          style={{
            fontSize: metrics.fontSize,
            lineHeight: 1,
            fontWeight: 700,
          }}
        >
          <span className={mindClass}>Mind</span>
          <span className={mosaicClass}>Mosaic</span>
          {trademark !== "none" && (
            <span
              aria-hidden="true"
              className={isInverse ? "text-white/70" : "text-brand-coral"}
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
