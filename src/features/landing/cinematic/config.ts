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
