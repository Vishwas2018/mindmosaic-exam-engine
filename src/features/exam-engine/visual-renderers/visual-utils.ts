/** Convert an arbitrary identifier into a DOM-safe id fragment. */
export function toDomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/** Round to a "nice" upper bound for an axis. */
export function niceMaximum(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const rounded =
    normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return rounded * magnitude;
}

/** Deterministic MindMosaic palette for series without an explicit colour. */
export const PALETTE = [
  "#4B2E83",
  "#FF8A00",
  "#2E8B7F",
  "#C2255C",
  "#3457D5",
  "#7A5195",
  "#EF9B20",
  "#1B9E77",
  "#D62728",
  "#6A51A3",
] as const;

export function paletteColour(index: number): string {
  return PALETTE[index % PALETTE.length];
}

/** Format a number for axis ticks and labels. */
export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
