import { cinematicMotion } from "./config";
import { between, clamp01, easeInOut } from "./math";

/**
 * Pure layer maths for a multi-scene pinned chapter. A "layer" starts at
 * `starts[i]` and runs until `starts[i + 1]` (the last runs to 1). Adjacent
 * layers cross-fade across `crossfade`, centred on the shared boundary.
 */

/** 0..1: how far layer `index` has faded IN (layer 0 is in from the start). */
export function layerEnter(progress: number, starts: readonly number[], index: number, crossfade: number): number {
  if (index === 0) return 1;
  const boundary = starts[index]!;
  return easeInOut(between(progress, boundary - crossfade / 2, boundary + crossfade / 2));
}

/** 0..1: how far layer `index` has faded OUT (the last layer never leaves). */
export function layerExit(progress: number, starts: readonly number[], index: number, crossfade: number): number {
  if (index >= starts.length - 1) return 0;
  const boundary = starts[index + 1]!;
  return easeInOut(between(progress, boundary - crossfade / 2, boundary + crossfade / 2));
}

export function layerOpacity(progress: number, starts: readonly number[], index: number, crossfade: number): number {
  return layerEnter(progress, starts, index, crossfade) * (1 - layerExit(progress, starts, index, crossfade));
}

/**
 * Opacity for a layer's TEXT and product UI. Backgrounds (photographs, panels)
 * use `layerBackdropOpacity`; foreground content hands over with the overlapping
 * windows in `cinematicMotion.layerBlend`, so a readable layer is always on
 * screen and two are never both more than half visible.
 */
export function layerForegroundOpacity(
  progress: number,
  starts: readonly number[],
  index: number,
  crossfade: number,
): number {
  return spanForegroundOpacity(progress, starts, index, index, crossfade);
}

/** Raw 0..1 position inside the cross-fade window centred on layer `index`'s start. */
function boundaryPosition(progress: number, starts: readonly number[], index: number, crossfade: number): number {
  const boundary = starts[index]!;
  return between(progress, boundary - crossfade / 2, boundary + crossfade / 2);
}

/** The same, for foreground content: only the middle `foregroundWindow` of the cross-fade. */
function foregroundPosition(progress: number, starts: readonly number[], index: number, crossfade: number): number {
  return boundaryPosition(progress, starts, index, crossfade * cinematicMotion.layerBlend.foregroundWindow);
}

/**
 * The same turn-taking rule for content that stays on screen across several
 * consecutive layers (Chapter 3's question state spans Practise and
 * Understand): it enters with `first` layer and leaves with `last` layer.
 */
export function spanForegroundOpacity(
  progress: number,
  starts: readonly number[],
  first: number,
  last: number,
  crossfade: number,
): number {
  const { fadeOutEnd, fadeInStart } = cinematicMotion.layerBlend;
  const entering =
    first === 0 ? 1 : easeInOut(between(foregroundPosition(progress, starts, first, crossfade), fadeInStart, 1));
  const leaving =
    last >= starts.length - 1 ? 0 : easeInOut(between(foregroundPosition(progress, starts, last + 1, crossfade), 0, fadeOutEnd));
  return entering * (1 - leaving);
}

/**
 * Opacity for a layer's BACKDROP (photograph or panel). Layers stack in story
 * order, so the incoming backdrop fades in over the outgoing one and the outgoing
 * one only fades away once it is covered. `nextIsBackdrop` is false when the
 * following layer has no backdrop of its own (the hand-off): then it fades out
 * with the ordinary cross-fade.
 */
export function layerBackdropOpacity(
  progress: number,
  starts: readonly number[],
  index: number,
  crossfade: number,
  nextIsBackdrop: boolean,
): number {
  const { backdropInEnd } = cinematicMotion.layerBlend;
  const entering = index === 0 ? 1 : easeInOut(between(boundaryPosition(progress, starts, index, crossfade), 0, backdropInEnd));
  if (index >= starts.length - 1) return entering;
  const t = boundaryPosition(progress, starts, index + 1, crossfade);
  const leaving = nextIsBackdrop ? easeInOut(between(t, backdropInEnd, 1)) : easeInOut(t);
  return entering * (1 - leaving);
}

/**
 * 1 while any part of layer `index` can be on screen (its own window plus half a
 * cross-fade either side), else 0. A whole layer set to 0 is skipped by paint,
 * which keeps six stacked scenes from all being rasterised on every scroll frame.
 * Opacity does not affect the accessibility tree, so the layer stays readable.
 */
export function layerPresence(progress: number, starts: readonly number[], index: number, crossfade: number): 0 | 1 {
  const from = index === 0 ? -Infinity : starts[index]! - crossfade / 2;
  const to = index >= starts.length - 1 ? Infinity : starts[index + 1]! + crossfade / 2;
  return progress >= from && progress <= to ? 1 : 0;
}

/** 0..1 progress through layer `index`'s own window (to the next layer's start). */
export function layerLocal(progress: number, starts: readonly number[], index: number): number {
  const end = index >= starts.length - 1 ? 1 : starts[index + 1]!;
  return between(progress, starts[index]!, end);
}

/** The layer whose window contains `progress` (0 before the first boundary). */
export function activeLayer(progress: number, starts: readonly number[]): number {
  let active = 0;
  for (let i = 0; i < starts.length; i += 1) if (progress >= starts[i]!) active = i;
  return active;
}

/** Chapter progress at the middle of a layer's steady state: where "go to scene i" should land. */
export function layerAnchor(starts: readonly number[], index: number): number {
  const end = index >= starts.length - 1 ? 1 : starts[index + 1]!;
  return clamp01(starts[index]! + (end - starts[index]!) * 0.5);
}

/** A chapter's named layer starts as an ordered array (object key order is the story order). */
export function orderedLayerStarts(layerStarts: Record<string, number>): readonly number[] {
  return Object.values(layerStarts);
}

/** The Chapter 2 layer starts: intro, six scenes, hand-off. */
export const chapter2LayerStarts: readonly number[] = orderedLayerStarts(cinematicMotion.chapter2.layerStarts);

/** The Chapter 3 layer starts: intro, four scenes, hand-off. */
export const chapter3LayerStarts: readonly number[] = orderedLayerStarts(cinematicMotion.chapter3.layerStarts);

/** The Chapter 4 layer starts: intro, three scenes, hand-off. */
export const chapter4LayerStarts: readonly number[] = orderedLayerStarts(cinematicMotion.chapter4.layerStarts);

