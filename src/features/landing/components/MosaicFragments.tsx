import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

/**
 * The page's one recurring ornament after the logo: a few small tiles that
 * drift into alignment once on load (`.mm-tile-settle`, globals.css) and
 * then stay still. Each tile starts from its own offset, so the group reads
 * as pieces coming together rather than one block sliding in. Decorative
 * only — hidden from assistive tech, never interactive.
 */
export type Fragment = {
  /** Column / row on a 4×3 grid of 1fr cells. */
  col: number;
  row: number;
  tone: "brand" | "coral" | "lilac" | "tint" | "teal";
  /** Where the tile starts before settling, e.g. "-14px". */
  x?: string;
  y?: string;
  r?: string;
};

const TONES: Record<Fragment["tone"], string> = {
  brand: "bg-mm-brand",
  coral: "bg-mm-coral",
  lilac: "bg-mm-lilac",
  tint: "bg-mm-tint-line-strong",
  teal: "bg-[#8FCFC6]",
};

export function MosaicFragments({
  fragments,
  className,
  tileClassName,
}: {
  fragments: readonly Fragment[];
  className?: string;
  tileClassName?: string;
}) {
  return (
    <div aria-hidden="true" className={twMerge("pointer-events-none grid grid-cols-4 grid-rows-3 gap-1.5", className)}>
      {fragments.map((fragment, index) => (
        <span
          key={`${fragment.col}-${fragment.row}`}
          className={twMerge("mm-tile-settle aspect-square rounded-[5px]", TONES[fragment.tone], tileClassName)}
          style={
            {
              gridColumn: fragment.col,
              gridRow: fragment.row,
              "--mm-tile-x": fragment.x ?? "0px",
              "--mm-tile-y": fragment.y ?? "0px",
              "--mm-tile-r": fragment.r ?? "0deg",
              "--mm-delay": `${200 + index * 70}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
