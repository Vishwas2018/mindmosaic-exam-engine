"use client";

import { useTransform, motion, type MotionValue } from "framer-motion";

/**
 * One fragment of the bridge. `start`/`end` are the chapter-progress window
 * in which it assembles; `dy`/`dr` are how far it starts from its seat (px,
 * degrees). Fixed values, no randomness: server and client render the same.
 */
interface Fragment {
  /** Left edge, % of the strip. */
  x: number;
  size: number;
  tone: string;
  start: number;
  end: number;
  dy: number;
  dr: number;
}

const TONES = ["bg-mm-brand", "bg-mm-coral", "bg-mm-lilac", "bg-mm-brand-mid", "bg-mm-tint-line-strong"] as const;

/** 16 fragments across the bottom edge, staggered left to right with a small deterministic wobble. */
const FRAGMENTS: readonly Fragment[] = Array.from({ length: 16 }, (_, index) => ({
  x: 3 + index * 6.1,
  size: [14, 10, 18, 12, 16, 9][index % 6]!,
  tone: TONES[(index * 3) % TONES.length]!,
  start: 0.52 + (index % 8) * 0.025,
  end: 0.82 + (index % 8) * 0.02,
  dy: [-46, -30, -62, -24][index % 4]!,
  dr: [60, -45, 90, -70][index % 4]!,
}));

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const ease = (t: number) => 1 - (1 - t) ** 3;

function FragmentTile({ fragment, progress }: { fragment: Fragment; progress: MotionValue<number> }) {
  const settle = useTransform(progress, (value) =>
    ease(clamp01((value - fragment.start) / (fragment.end - fragment.start))),
  );
  const opacity = useTransform(settle, (value) => value * 0.9);
  const y = useTransform(settle, (value) => (1 - value) * fragment.dy);
  const rotate = useTransform(settle, (value) => 45 + (1 - value) * fragment.dr);
  return (
    <motion.span
      style={{ left: `${fragment.x}%`, width: fragment.size, height: fragment.size, opacity, y, rotate }}
      className={`absolute bottom-3 rounded-[2px] ${fragment.tone}`}
    />
  );
}

/**
 * The branded hand-off between Chapters 1 and 2: small mosaic fragments
 * (the page's diamond motif) drift in and assemble into an even row along the
 * bottom edge of the stage, over a soft fade into the page colour that
 * Chapter 2 starts on. Decorative only (aria-hidden), restrained by design:
 * small, low-contrast, transform/opacity only.
 *
 * `progress` is Chapter 1's progress 0..1. Pass `null` for the static form
 * (reduced motion): the row is simply assembled and still.
 */
export function MosaicTransition({ progress }: { progress: MotionValue<number> | null }) {
  return (
    <div
      aria-hidden="true"
      data-mosaic-transition={progress ? "animated" : "static"}
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(88px,14vh,150px)] [background:linear-gradient(180deg,transparent,rgba(252,251,248,.72)_55%,#fcfbf8)]"
    >
      <div className="mm-width relative h-full">
        {progress
          ? FRAGMENTS.map((fragment, index) => <FragmentTile key={index} fragment={fragment} progress={progress} />)
          : FRAGMENTS.map((fragment, index) => (
              <span
                key={index}
                style={{
                  left: `${fragment.x}%`,
                  width: fragment.size,
                  height: fragment.size,
                  opacity: 0.9,
                  transform: "rotate(45deg)",
                }}
                className={`absolute bottom-3 rounded-[2px] ${fragment.tone}`}
              />
            ))}
      </div>
    </div>
  );
}
