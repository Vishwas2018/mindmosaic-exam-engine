import { cinematicMotion } from "./config";
import { between, clamp01, easeInOut } from "./math";

/**
 * Pure scroll maths for Chapter 1's six-scene photographic stage. Everything is a
 * function of the story clock `t` (0..6, `chapter progress * 6`) alone, so
 * scrolling backwards retraces exactly the same frames. Numbers live in
 * `cinematicMotion.chapter1`.
 *
 * Scene `i` is fully on screen at `t = i`. Scenes stack in story order: scene `i`
 * fades IN over scene `i - 1`, which stays fully opaque underneath until the
 * newcomer covers it. Two opaque photographs that dissolved straight into each
 * other would dip to about 75% coverage halfway and show the page behind both.
 */

const timing = cinematicMotion.chapter1;

export const HERO_SCENE_COUNT = 6;
/** The story clock's length: one unit per scene. */
export const HERO_CLOCK_END = HERO_SCENE_COUNT;

/** Chapter progress (0..1) to the story clock. */
export const heroClock = (q: number): number => clamp01(q) * HERO_CLOCK_END;

/** How far scene `index` has covered the scene beneath it (scene 0 is always fully there). */
export function heroSceneCover(t: number, index: number): number {
  if (index === 0) return 1;
  const { start, span } = timing.crossfade;
  return easeInOut(between(t, index - 1 + start, index - 1 + start + span));
}

/** True while scene `index`'s photograph can be seen: started, and not yet buried under a later scene. */
export function heroLayerVisible(t: number, index: number): boolean {
  if (heroSceneCover(t, index) <= 0) return false;
  for (let later = index + 1; later < HERO_SCENE_COUNT; later += 1) {
    if (heroSceneCover(t, later) >= 0.999) return false;
  }
  return true;
}

/** Soft-edged left-to-right wipe mask: `incoming` reveals from the left, otherwise the block is wiped away. */
export function heroWipeMask(progress: number, incoming: boolean): string {
  const feather = timing.copyWipe.feather;
  const from = (progress * (1 + feather) - feather) * 100;
  const to = from + feather * 100;
  const a = from.toFixed(2);
  const b = to.toFixed(2);
  return incoming ? `linear-gradient(90deg,#000 ${a}%,transparent ${b}%)` : `linear-gradient(90deg,transparent ${a}%,#000 ${b}%)`;
}

export interface HeroCopyState {
  /** 0 or 1: a block is either wholly there or wholly gone, the wipe mask does the hand-over. */
  visible: boolean;
  /** CSS mask-image value, `none` when the block is fully revealed. */
  mask: string;
  /** True while this is the scene a reader and a screen reader should be on. */
  current: boolean;
}

/** One scene's copy block: wiped in just before its photograph lands, wiped out as the next scene's copy wipes in. */
export function heroCopyState(t: number, index: number): HeroCopyState {
  const { start, span } = timing.copyWipe;
  const wipeIn = index === 0 ? 1 : between(t, index - 1 + start, index - 1 + start + span);
  const wipeOut = index < HERO_SCENE_COUNT - 1 ? between(t, index + start, index + start + span) : 0;
  if (wipeIn <= 0 || wipeOut >= 1) return { visible: false, mask: "none", current: false };
  const mask = wipeIn < 1 ? heroWipeMask(wipeIn, true) : wipeOut > 0 ? heroWipeMask(wipeOut, false) : "none";
  return { visible: true, mask, current: wipeIn >= 0.5 && wipeOut < 0.5 };
}

/** 0..1 fill of scene `index`'s navigator track. The last one fills over the hand-off. */
export function heroNavFill(t: number, index: number): number {
  return index < HERO_SCENE_COUNT - 1 ? clamp01(t - index) : clamp01((t - (HERO_SCENE_COUNT - 1)) / 0.4);
}

/** The scene the navigator marks as current: the incoming scene counts once its photograph is mostly there. */
export function heroActiveScene(t: number): number {
  return t < 0.8 ? 0 : Math.min(HERO_SCENE_COUNT - 1, Math.floor(t - 0.8) + 1);
}

/** Where "go to scene i" lands, in `t`: the start of the first scene, a little inside the hold for the rest. */
export function heroSceneAnchor(index: number): number {
  return index === 0 ? 0 : index + timing.anchorOffset;
}

/** Navigator opacity (also the scene copy's): it leaves as the hand-off starts. */
export function heroNavOpacity(t: number): number {
  const { start, span } = timing.mosaic.navFade;
  return 1 - easeInOut(between(t, start, start + span));
}

/** Opacity of the ivory layer that releases the left zone onto the page colour. */
export function heroReleaseOpacity(t: number): number {
  const { start, span } = timing.mosaic.release;
  return easeInOut(between(t, start, start + span));
}

/* ---------- The mosaic tile field ---------- */

export type HeroTileTone = "ivory" | "coral" | "brand" | "lilac" | "wash";

export interface HeroTile {
  /** Left and top edge, px. */
  x: number;
  y: number;
  /** Side length, px. */
  size: number;
  tone: HeroTileTone;
  /** True for the accent "seed" tiles. */
  accent: boolean;
  /** `t` at which an accent tile appears. */
  at: number;
  /** 0..1 sweep delay: tiles furthest from the right edge go last, with a fixed jitter. */
  delay: number;
}

/** Deterministic 0..1 jitter (no randomness, so server and client agree). */
function jitter(row: number, band: number): number {
  const n = Math.sin(row * 12.9898 + band * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * The tile field for a stage of `width` x `height` px: square tiles, `rows` to the stage's height,
 * packed into the lower right corner and covering `coverage` of the width.
 */
export function heroTiles(width: number, height: number): HeroTile[] {
  const { rows, coverage, accents } = timing.mosaic;
  const size = height / rows;
  const columns = Math.ceil((width * coverage) / size);
  const tiles: HeroTile[] = [];
  for (let row = 0; row < columns; row += 1) {
    for (let band = 0; band < rows; band += 1) {
      const accent = accents.find((a) => a.row === row && a.band === band);
      tiles.push({
        x: width - (row + 1) * size,
        y: height - (band + 1) * size,
        size,
        tone: accent ? accent.tone : "ivory",
        accent: Boolean(accent),
        at: accent ? accent.at : 0,
        delay: 0.62 * ((columns - 1 - row) / Math.max(1, columns - 1)) + 0.38 * jitter(row, band),
      });
    }
  }
  return tiles;
}

/** Opacity and scale of one tile at story time `t`. */
export function heroTileState(t: number, tile: HeroTile): { opacity: number; scale: number } {
  const { sweep, accentFade } = timing.mosaic;
  if (tile.accent) {
    return { opacity: easeInOut(between(t, tile.at, tile.at + accentFade)), scale: 0.78 };
  }
  const swept = between(t, sweep.start, sweep.start + sweep.span);
  const opacity = easeInOut(between(swept, tile.delay * 0.55, tile.delay * 0.55 + 0.45));
  return { opacity, scale: 0.55 + 0.47 * opacity };
}
