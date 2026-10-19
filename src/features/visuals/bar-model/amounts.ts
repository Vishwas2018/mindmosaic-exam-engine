import type { BarModelData } from "@/schemas/visual.schema";

type Segment = BarModelData["bars"][number]["segments"][number];
type Brace = BarModelData["braces"][number];

export interface DisplayedAmount {
  kind: "value" | "unknown" | "blank";
  /** What is drawn: the given number, "?" for the target, a symbol, or "". */
  text: string;
  /** True when this element (or the quantity it references) is the target. */
  isTarget: boolean;
}

/** Plain decimal text for a given number (no locale, no float formatting). */
export function formatGiven(value: number): string {
  return String(value);
}

/**
 * Resolve what an element shows from its own JSON only - never from a solved
 * value. A quantity reference shows the quantity's given or its symbol; the
 * target always shows "?".
 */
export function displayedAmount(
  element: Pick<Segment | Brace, "display" | "value" | "unknown" | "quantityId" | "target">,
  data: Pick<BarModelData, "quantities">,
): DisplayedAmount {
  const quantity =
    element.quantityId === undefined
      ? undefined
      : data.quantities.find((candidate) => candidate.id === element.quantityId);
  const isTarget = element.target === true || quantity?.target === true;
  const value = element.value ?? quantity?.value;
  const symbol = element.unknown ?? quantity?.unknown;

  if (element.display === "value" && value !== undefined) {
    return { kind: "value", text: formatGiven(value), isTarget: false };
  }
  if (element.display === "unknown") {
    return { kind: "unknown", text: isTarget ? "?" : (symbol ?? ""), isTarget };
  }
  return { kind: "blank", text: "", isTarget };
}
