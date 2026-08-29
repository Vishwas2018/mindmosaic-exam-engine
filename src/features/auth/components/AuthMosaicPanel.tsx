import type { ReactNode } from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { MindMosaicLogo } from "@/components/branding";

/**
 * The plum panel that fills the left column of Log in and Sign up
 * (design_handoff_mindmosaic, screens 6 and 7).
 *
 * Three stacked layers, in this order and for these reasons:
 *
 *  1. An animated mosaic field of `aspect-ratio: 1` tiles at 32-34%
 *     container opacity. Purely decorative, so `aria-hidden`.
 *  2. A fixed vertical scrim, rgba(42,17,69,0.55) -> 0.94. This is NOT
 *     decoration: the tiles animate between 0.22 and 0.9 opacity, and
 *     without the scrim the panel's white body copy drops below AA against
 *     a bright tile mid-cycle. The handoff calls this out explicitly. If
 *     the animation stays, the scrim stays.
 *  3. The content — logo, value copy, disclaimer — spaced by
 *     `align-content: space-between`.
 *
 * The tile pattern is deterministic (index arithmetic, no Math.random) so
 * the server-rendered markup and the client's first hydration pass agree.
 * A random field would mismatch on every load.
 */

const TILE_COLOURS = [
  "var(--mm-brand)",
  "var(--mm-lilac)",
  "var(--mm-coral)",
  "rgba(255,255,255,0.10)",
  "rgba(201,182,228,0.35)",
] as const;

interface Tile {
  readonly background: string;
  readonly duration: string;
  readonly delay: string;
}

/**
 * `step` and `spread` differ between the two screens in the handoff (Log in
 * uses `i * 7 + i % 5` over 12 columns, Sign up `i * 5 + i % 4` over 10), so
 * the two fields do not read as the same wallpaper twice.
 */
function buildTiles(count: number, step: number, spread: number, delayStep: number): Tile[] {
  return Array.from({ length: count }, (_, i) => ({
    background: TILE_COLOURS[(i * step + (i % spread)) % TILE_COLOURS.length],
    duration: `${5 + ((i * 3) % 7)}s`,
    delay: `${((i * delayStep) % 40) / 10}s`,
  }));
}

export interface AuthMosaicPanelProps {
  /** Uppercase kicker above the heading, with the coral rule. */
  eyebrow: string;
  heading: string;
  /** Optional lead paragraph under the heading. */
  intro?: string;
  /** The panel body — a points list, a step tracker, whatever the screen needs. */
  children?: ReactNode;
  /** Small print pinned to the bottom of the panel. */
  footnote: string;
  /** 12 columns on Log in, 10 on Sign up. */
  columns?: 10 | 12;
  className?: string;
}

export function AuthMosaicPanel({
  eyebrow,
  heading,
  intro,
  children,
  footnote,
  columns = 12,
  className,
}: AuthMosaicPanelProps) {
  const tiles =
    columns === 12
      ? buildTiles(216, 7, 5, 13)
      : buildTiles(160, 5, 4, 11);

  return (
    <aside
      className={twMerge(
        "relative isolate hidden overflow-hidden bg-mm-plum p-[clamp(28px,3vw,48px)] text-white lg:grid lg:content-between",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid auto-rows-auto gap-1.5 p-[clamp(28px,3vw,48px)] opacity-[0.33]"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {tiles.map((tile, index) => (
          <span
            key={index}
            className="mm-tile aspect-square rounded-[3px]"
            style={
              {
                background: tile.background,
                "--mm-tile-duration": tile.duration,
                "--mm-tile-delay": tile.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* See the note above: legibility layer, not decoration. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(42,17,69,0.55)_0%,rgba(42,17,69,0.86)_42%,rgba(42,17,69,0.94)_100%)]"
      />

      <Link
        href="/"
        aria-label="MindMosaic home"
        className="relative w-fit rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-lilac/50"
      >
        <MindMosaicLogo variant="inverse" inverseTone="lilac" size="md" />
      </Link>

      <div className="relative grid max-w-[470px] gap-[22px]">
        <p className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.14em] text-mm-lilac">
          <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
          {eyebrow}
        </p>
        <h2 className="text-[clamp(28px,3.4vw,46px)] font-[700] leading-[1.08]">{heading}</h2>
        {intro && <p className="text-[16.5px] leading-[1.65] text-white/86">{intro}</p>}
        {children}
      </div>

      <p className="relative max-w-[440px] text-[13px] leading-[1.6] text-white/72">{footnote}</p>
    </aside>
  );
}

/** The three-bullet value list Log in shows inside the panel. */
export function AuthPanelPoints({ points }: { points: readonly string[] }) {
  return (
    <ul className="mt-1.5 grid gap-3">
      {points.map((point) => (
        <li
          key={point}
          className="grid grid-cols-[20px_1fr] gap-3 text-[15px] leading-[1.55] text-white/90"
        >
          <span aria-hidden="true" className="mt-[7px] h-[9px] w-[9px] bg-mm-coral" />
          {point}
        </li>
      ))}
    </ul>
  );
}
