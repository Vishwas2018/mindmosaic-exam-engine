/**
 * Deterministic, seedable pseudo-random source: FNV-1a hashes the string
 * seed into a 32-bit integer, then mulberry32 produces a repeatable
 * `[0, 1)` stream from it. Never `Math.random` — the same seed string must
 * always produce the same sequence, on every platform, forever (mirrors
 * the pattern `docs/ARCHITECTURE.md` already documents for the blueprint
 * planner's own determinism, applied here for the first time to content
 * generation).
 */
function fnv1a(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export type SeededRandom = () => number;

export function createSeededRandom(seed: string): SeededRandom {
  let state = fnv1a(seed);
  return function mulberry32(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic integer in `[min, max]` (inclusive), drawn from `rand`. */
export function randomInt(rand: SeededRandom, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

/** Deterministically picks one element of `options`, drawn from `rand`. */
export function pickOne<T>(rand: SeededRandom, options: readonly T[]): T {
  return options[Math.floor(rand() * options.length) % options.length];
}

/**
 * Deterministic Fisher-Yates shuffle, drawn from `rand`. Never
 * `Array.prototype.sort` with a `rand() - 0.5` comparator: that pattern is
 * not a valid strict-weak-ordering comparator and different JS engines
 * (and even different array lengths on the same engine) are free to call
 * it a different number of times, breaking the byte-identical-replay
 * contract this module exists to satisfy.
 */
export function shuffle<T>(rand: SeededRandom, values: readonly T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rand() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
