import { cinematicMotion, type ZoomPreset } from "./config";
import { between, clamp01, easeInOut, lerp } from "./math";

/**
 * Pure scroll maths for Chapter 1's six-scene photographic stage. Everything is
 * a function of chapter progress `q` (0..1) alone, so scrolling backwards
 * retraces exactly the same frames. Numbers live in `cinematicMotion.chapter1`.
 *
 * Scenes stack in story order: scene `i` fades IN over scene `i - 1`, which stays
 * fully opaque underneath until the newcomer covers it. Two opaque photographs
 * that dissolved straight into each other would dip to about 75% coverage halfway
 * and show the page behind both; stacking never does.
 */

const timing = cinematicMotion.chapter1;

/** The six scene starts, in story order. */
export const heroSceneStarts: readonly number[] = Object.values(timing.sceneStarts);
export const HERO_SCENE_COUNT = heroSceneStarts.length;

/** Chapter progress at which scene `index`'s window ends: the next scene starts; the last runs to the release. */
export function heroSceneEnd(index: number): number {
  return index >= HERO_SCENE_COUNT - 1 ? 1 : heroSceneStarts[index + 1]!;
}

/** 0..1: how far scene `index` has covered the scene beneath it (scene 0 is always fully there). */
export function heroSceneCover(q: number, index: number): number {
  if (index === 0) return 1;
  const boundary = heroSceneStarts[index]!;
  return easeInOut(between(q, boundary - timing.crossfade / 2, boundary + timing.crossfade / 2));
}

/** Raw 0..1 position inside the (narrower) caption window centred on scene `index`'s start. */
function captionPosition(q: number, index: number): number {
  const boundary = heroSceneStarts[index]!;
  const half = (timing.crossfade * timing.captionBlend.window) / 2;
  return between(q, boundary - half, boundary + half);
}

/**
 * Opacity of scene `index`'s caption. The outgoing caption fades over the first part of
 * the window and the incoming over the last part, overlapping so something is always
 * readable, yet never two legible at once.
 */
export function heroCaptionOpacity(q: number, index: number): number {
  const { fadeOutEnd, fadeInStart } = timing.captionBlend;
  const entering = index === 0 ? 1 : easeInOut(between(captionPosition(q, index), fadeInStart, 1));
  const leaving = index >= HERO_SCENE_COUNT - 1 ? 0 : easeInOut(between(captionPosition(q, index + 1), 0, fadeOutEnd));
  return entering * (1 - leaving);
}

/** 0..1 progress through scene `index`'s own window. Drives the progress navigator and the camera. */
export function heroSceneLocal(q: number, index: number): number {
  return between(q, heroSceneStarts[index]!, heroSceneEnd(index));
}

/** The scene whose window contains `q` (scene 0 before the first boundary). */
export function heroActiveScene(q: number): number {
  let active = 0;
  for (let i = 0; i < HERO_SCENE_COUNT; i += 1) if (q >= heroSceneStarts[i]!) active = i;
  return active;
}

/** Camera scale for scene `index`: a slow, linear move across its whole scroll window. */
export function heroSceneScale(q: number, index: number, preset: ZoomPreset): number {
  return lerp(preset.fromScale, preset.handoffScale, heroSceneLocal(q, index));
}

/**
 * Where "go to scene i" should land: inside the scene's steady state, away from any
 * cross-fade, at `anchorFraction` of its window.
 */
export function heroSceneAnchor(index: number): number {
  const start = heroSceneStarts[index]!;
  // Never inside a cross-fade, and for the last scene never inside the mosaic hand-off.
  const settledEnd = index >= HERO_SCENE_COUNT - 1 ? timing.mosaicReveal.start : heroSceneEnd(index) - timing.crossfade / 2;
  const settledStart = index === 0 ? start : start + timing.crossfade / 2;
  return clamp01(settledStart + (settledEnd - settledStart) * timing.anchorFraction);
}

/**
 * Opacity for scene `index`'s photograph layer. `ready` is 0 until the image has loaded AND
 * decoded, so a scene whose picture is not there yet simply leaves the previous photograph on
 * screen. `nextCover` is the NEXT layer's visible cover (its coverage times its readiness):
 * once that reaches 1 this layer is fully hidden beneath it and is dropped from painting.
 */
export function heroLayerOpacity(q: number, index: number, ready: number, nextCover: number): number {
  if (nextCover >= 0.999) return 0;
  return heroSceneCover(q, index) * ready;
}
