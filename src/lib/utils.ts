export function clamp(value: number, minimum: number, maximum: number): number {
  if (minimum > maximum) {
    throw new RangeError("minimum cannot be greater than maximum");
  }

  return Math.min(Math.max(value, minimum), maximum);
}

export function formatPercentage(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-AU", {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function humaniseIdentifier(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
