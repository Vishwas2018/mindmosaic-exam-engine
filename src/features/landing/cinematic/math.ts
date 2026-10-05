/** Small pure helpers for scroll-driven timelines. */
export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const between = (value: number, start: number, end: number) => clamp01((value - start) / (end - start));
export const easeInOut = (t: number) => t * t * (3 - 2 * t);
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
