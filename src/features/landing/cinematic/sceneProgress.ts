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

/** The Chapter 2 layer starts as an ordered array: intro, six scenes, hand-off. */
export const chapter2LayerStarts: readonly number[] = Object.values(cinematicMotion.chapter2.layerStarts);
