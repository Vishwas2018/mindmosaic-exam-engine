/**
 * Cinematic landing motion: the one place every chapter's scroll timing,
 * zoom and pin settings live. Chapters 2 to 4 add their own block here (or
 * reuse a preset) instead of copying numbers out of a component.
 *
 * Progress values are 0..1 along a chapter's PINNED travel: 0 is the moment
 * the stage pins, 1 is the moment it releases into the next chapter. Below
 * `pinnedMinWidth` nothing pins and progress runs across the whole section.
 */

/** A photograph's zoom recipe: scale at start, once settled, and at the hand-off. */
export interface ZoomPreset {
  fromScale: number;
  settledScale: number;
  handoffScale: number;
}

/** A start..end window of chapter progress. */
export interface Range {
  start: number;
  end: number;
}

export const cinematicMotion = {
  /**
   * Stage pins from this viewport width up. It must equal Tailwind's `lg`
   * (64rem = 1024px), because the layout classes in each chapter use `lg:`;
   * a unit test holds the two together.
   */
  pinnedMinWidth: 1024,

  /** Named zoom recipes. A media slot picks one by name (`motionPreset`). */
  presets: {
    heroBreath: { fromScale: 1.05, settledScale: 1, handoffScale: 1.025 },
    still: { fromScale: 1, settledScale: 1, handoffScale: 1 },
    /** Chapter 2 scenes: start slightly in, settle through the first half of the scene. Max zoom 3.5%. */
    sceneSettle: { fromScale: 1.035, settledScale: 1, handoffScale: 1 },
    /** Chapter 2 alternate direction: hold, then push in gently across the second half. Max zoom 2.5%. */
    sceneDrift: { fromScale: 1, settledScale: 1, handoffScale: 1.025 },
  } satisfies Record<string, ZoomPreset>,

  chapter1: {
    /** Section height from `pinnedMinWidth` up: the pinned stage is 100svh, the rest is travel. */
    desktopScrollHeightSvh: 200,
    imageSettle: { start: 0, end: 0.7 } satisfies Range,
    imageHandoff: { start: 0.85, end: 1 } satisfies Range,
    copyExit: { start: 0.5, end: 0.78 } satisfies Range,
    /** How far the copy lifts (px, upward) by the end of its exit. */
    copyLiftPx: 28,
    /** Entrance stagger between copy blocks, ms (CSS `--mm-delay`). */
    copyStaggerMs: 70,
    /**
     * Mosaic fragments assemble in `steps` staggered groups: group n starts at
     * `start + n * startStagger` and finishes at `end + n * endStagger`.
     */
    mosaicReveal: { start: 0.52, end: 0.82, startStagger: 0.025, endStagger: 0.02, steps: 8 },
  },

  /**
   * Chapter 2 ("Choose your pathway."): one pinned stage, six programme
   * scenes. Each layer (intro, six scenes, hand-off) STARTS at the value
   * below and runs until the next layer starts; neighbours cross-fade across
   * `crossfade`, centred on the boundary. Tune the story here only.
   */
  chapter2: {
    /** 6 scenes x ~87svh of travel + intro and hand-off. Section height from `pinnedMinWidth` up. */
    desktopScrollHeightSvh: 680,
    /** Chapter progress at which each layer begins. Must be strictly increasing, first 0, last < 1. */
    layerStarts: {
      intro: 0,
      naplan: 0.07,
      icas: 0.22,
      curriculum: 0.37,
      amc: 0.52,
      singapore: 0.67,
      selective: 0.82,
      handoff: 0.96,
    },
    /** Width of the cross-fade between neighbouring layers, in chapter progress. */
    crossfade: 0.05,
    /** How far copy rises on entry and lifts on exit (px). */
    copyRisePx: 18,
    copyLiftPx: 12,
    /** The photograph's zoom, in SCENE progress (0 = scene starts, 1 = next scene starts). */
    photoSettle: { start: 0, end: 0.5 } satisfies Range,
    photoHandoff: { start: 0.5, end: 1 } satisfies Range,
    /** The product UI grows from `from` to 1 across this window of scene progress. */
    productScale: { from: 0.965, window: { start: 0, end: 0.3 } satisfies Range },
    /** Progressive builds (lesson blocks, bar model) play across this window of scene progress. */
    build: { start: 0.08, end: 0.62 } satisfies Range,
  },
} as const;

export type CinematicPreset = keyof typeof cinematicMotion.presets;

/**
 * Converts raw section scroll progress (0 at the section's top meeting the
 * viewport top, 1 once its bottom has left) into chapter progress.
 * Pinned: the stage releases after (height - 100)/height of the section.
 */
export function pinnedTravelFactor(desktopScrollHeightSvh: number): number {
  return desktopScrollHeightSvh / (desktopScrollHeightSvh - 100);
}
