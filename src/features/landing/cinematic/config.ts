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

  /**
   * How adjacent layers hand over inside a pinned chapter. All numbers are a
   * fraction (0..1) of a layer boundary's cross-fade window `t`.
   *
   * Foreground (copy, product UI) hands over inside the middle `foregroundWindow` of the
   * cross-fade, so the photograph carries the eye while the words swap and the swap is
   * short in scroll distance. The outgoing content fades over `[0, fadeOutEnd]` of that
   * window, the incoming over `[fadeInStart, 1]`. Because `fadeOutEnd > fadeInStart` they
   * overlap just enough that the foreground never drops to nothing (its weakest moment is
   * about a fifth of full opacity), yet neither is above a fifth while the other is
   * visible, so two paragraphs are never legible at once.
   *
   * Backdrops (photographs, panels): the incoming one fades IN over `[0, backdropInEnd]`
   * while the outgoing one stays fully opaque beneath it and only fades OUT over
   * `[backdropInEnd, 1]`. A straight dissolve of two opaque panels dips to 75% coverage
   * halfway and shows the page behind both; stacking them never does.
   */
  layerBlend: { foregroundWindow: 0.6, fadeOutEnd: 0.7, fadeInStart: 0.3, backdropInEnd: 0.7 },

  chapter1: {
    /**
     * The story's own height from `pinnedMinWidth` up: a 100svh stage plus 380svh of travel,
     * six segments of about 63svh. Chapter progress `q` reaches 1 after this travel.
     */
    storyScrollHeightSvh: 480,
    /**
     * Extra scroll after the story, spent on the seam into Chapter 2 (see `chapterSeam`): Chapter 1
     * stays pinned on its Explore scene while Chapter 2's pinned stage is revealed over it. The section
     * is `storyScrollHeightSvh + seamSvh` tall; Chapter 2 starts `seamSvh` early (negative margin).
     */
    seamSvh: 100,
    /** Section height from `pinnedMinWidth` up (story plus seam). */
    desktopScrollHeightSvh: 580,
    /**
     * The story's own clock `t` runs 0..6 along the pinned travel: scene `i` is fully
     * on screen at `t = i`. Every frame is a pure function of `t`, so scrolling back
     * retraces exactly the same frames.
     *
     * Scene `i` (i > 0) fades IN over its predecessor during `t` in
     * `[i - 1 + crossfade.start, i - 1 + crossfade.start + crossfade.span]`; the
     * predecessor stays fully opaque underneath, so the page never shows through.
     * The photographs never zoom or pan: only the cross-fade changes the picture.
     */
    crossfade: { start: 0.6, span: 0.4 },
    /**
     * Scene copy hand-over: one soft-edged left-to-right wipe (a CSS mask with a
     * `feather` wide edge) that starts `start` into a segment and takes `span` of it,
     * finishing before the incoming photograph is fully in.
     */
    copyWipe: { start: 0.72, span: 0.16, feather: 0.2 },
    /** Where "go to scene i" lands, in `t` after the scene's own start (scene 1 lands on 0). */
    anchorOffset: 0.15,
    /** Photographs mounted ahead of the active scene (and one behind), one request at a time. */
    photoLookahead: 2,
    /** A photograph still loading after this long shows a small status label, ms. */
    slowLoadMs: 800,
    /** Fade-in of a just-decoded photograph over its blurred preview, ms. */
    photoFadeMs: 450,
    /** Entrance stagger between copy blocks, ms (CSS `--mm-delay`). */
    copyStaggerMs: 70,
    /**
     * Accent "seed" tiles in the lower right of the photograph: one coral tile at Understand, two more at
     * Progress, three at Explore. The Chapter 2 seam sweeps over them. `row` counts from the right edge
     * and `band` from the bottom (both 0-based); `at` is the story time `t` at which it appears.
     */
    mosaic: {
      rows: 9,
      coverage: 0.56,
      accentFade: 0.3,
      accents: [
        { row: 1, band: 1, tone: "coral", at: 3.25 },
        { row: 2, band: 1, tone: "brand", at: 4.25 },
        { row: 1, band: 2, tone: "lilac", at: 4.4 },
        { row: 3, band: 1, tone: "wash", at: 5.05 },
        { row: 2, band: 2, tone: "brand", at: 5.15 },
        { row: 1, band: 3, tone: "wash", at: 5.25 },
      ],
    },
  },

  /**
   * The Chapter 1 -> Chapter 2 mirror-mosaic seam (Claude Design, MindMosaic-Chapter-2.dc.html). While
   * Chapter 1's Explore scene is still pinned, Chapter 2's pinned stage is held in place over it and
   * revealed through a grid of growing tiles that sweeps right to left. `seam` progress is 0..1 along the
   * `chapter1.seamSvh` of scroll in which Chapter 2's section rises from the bottom of the viewport to its
   * top, so the sweep always finishes exactly as Chapter 2's own timeline begins.
   *
   * Tile `k` grows with `smoothstep((u * span - delay * stagger) / grow)`, where `u` is seam progress and
   * `delay` runs 0 (right edge) to 1 (left edge) with a fixed jitter, as in the design.
   */
  chapterSeam: {
    rows: 6,
    columns: { min: 4, max: 24 },
    /** Total of the three terms below, as in the design's 0.2..0.72 window. */
    span: 0.52,
    stagger: 0.36,
    grow: 0.16,
    /** Weights of the delay: distance from the right edge, jitter, distance from the top. */
    delayMix: { distance: 0.7, jitter: 0.2, row: 0.1 },
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

  /**
   * Chapter 3 ("One concept. Four connected steps."): one pinned stage, one
   * persistent product frame whose contents change state. Layers are the
   * intro, the four journey scenes and the hand-off, laid out exactly like
   * `chapter2.layerStarts`. Scenes 2 and 3 share ONE question state, so
   * "practise" and "understand" are two moments of the same screen.
   *
   * 500svh: four scenes at ~21% of the pinned travel each (about 85svh of
   * scroll, similar to a Chapter 2 scene) plus a short intro and hand-off.
   * It is shorter than Chapter 2 (680svh) because there are four scenes, not
   * six, and the product frame never leaves the screen.
   */
  chapter3: {
    desktopScrollHeightSvh: 500,
    layerStarts: {
      intro: 0,
      learn: 0.08,
      practise: 0.29,
      understand: 0.5,
      next: 0.71,
      handoff: 0.94,
    },
    /** Width of the cross-fade between neighbouring layers, in chapter progress. */
    crossfade: 0.055,
    /** How far copy rises on entry and lifts on exit (px). */
    copyRisePx: 14,
    copyLiftPx: 10,
    /** The persistent product frame grows from `from` to 1 across this window of the Learn scene. */
    shellScale: { from: 0.98, window: { start: 0, end: 0.3 } satisfies Range },
    /** Learn: lesson blocks build across this window of the scene. */
    lessonBuild: { start: 0.05, end: 0.55 } satisfies Range,
    /** Practise: the question, bar and options appear across this window of the scene. */
    questionAppear: { start: 0.05, end: 0.5 } satisfies Range,
    /** Understand: answer labels, then the worked explanation, across this window of the scene. */
    review: { start: 0.02, end: 0.5 } satisfies Range,
    /** Next: skill bars grow, then the focused next step rises, across this window of the scene. */
    resultsBuild: { start: 0.05, end: 0.55 } satisfies Range,
  },

  /**
   * Chapter 4 ("Progress & Parents"): one pinned stage, progressive mosaic
   * assembly across three scenes (Latest, Subjects, Parent view) plus intro
   * and hand-off.
   *
   * 400svh: three scenes at ~27% of pinned travel each (~80svh scroll each,
   * matching Chapter 2/3 rhythm) plus intro and hand-off.
   */
  chapter4: {
    desktopScrollHeightSvh: 400,
    layerStarts: {
      intro: 0,
      latest: 0.1,
      subjects: 0.37,
      parent: 0.64,
      handoff: 0.93,
    },
    /** Width of the cross-fade between neighbouring layers, in chapter progress. */
    crossfade: 0.055,
    /** How far copy rises on entry and lifts on exit (px). */
    copyRisePx: 14,
    copyLiftPx: 10,
    /** Score ring draws/settles across this window of the Latest scene. */
    scoreRingDraw: { start: 0.05, end: 0.55 } satisfies Range,
    /** Subject progress bars build across this window of the Subjects scene. */
    subjectBarsBuild: { start: 0.05, end: 0.55 } satisfies Range,
    /** Mosaic modules reposition and assemble across this window of Parent view. */
    mosaicAssemble: { start: 0.05, end: 0.55 } satisfies Range,
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
