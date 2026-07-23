import { twMerge } from "tailwind-merge";

export interface MindMosaicLogoProps {
  className?: string;
  compact?: boolean;
  inverse?: boolean;
}

export function MindMosaicLogo({
  className,
  compact = false,
  inverse = false,
}: MindMosaicLogoProps) {
  return (
    <span
      className={twMerge("inline-flex items-center gap-3", className)}
      aria-label="MindMosaic"
    >
      <span
        aria-hidden="true"
        className="grid h-11 w-11 shrink-0 grid-cols-2 gap-1 rounded-2xl bg-white p-2 shadow-[0_8px_24px_rgba(75,46,131,0.18)] ring-1 ring-royal/10"
      >
        <span className="rounded-[4px] bg-royal" />
        <span className="rounded-[4px] bg-royal-orange" />
        <span className="rounded-[4px] bg-royal-orange" />
        <span className="rounded-[4px] bg-royal" />
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
