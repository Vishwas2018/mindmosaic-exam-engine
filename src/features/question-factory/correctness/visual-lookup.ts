/**
 * Independent readers over structured visual asset data — bar/line/pie
 * charts, tables, and number lines. Every function here reads only the
 * visual's own structured fields (`data.labels`, `data.values`,
 * `data.segments`, `data.rows`, `data.points`, `data.highlightedValues`),
 * never alt text or explanation prose, per the "structured visual data as
 * source of truth" rule.
 */
import type { VisualAsset } from "@/schemas/visual.schema";

export interface LabelledValue {
  readonly label: string;
  readonly value: number;
}

function normaliseLabel(label: string): string {
  return label.trim().toLocaleLowerCase("en-AU");
}

/** Extracts (label, value) pairs from the chart-shaped visuals; `undefined` for visual types with no natural label/value pairing. */
export function labelledValuesOf(visual: VisualAsset): readonly LabelledValue[] | undefined {
  switch (visual.type) {
    case "bar_chart":
      return visual.data.labels.map((label, index) => ({ label, value: visual.data.values[index] }));
    case "pie_chart":
      return visual.data.segments.map((segment) => ({ label: segment.label, value: segment.value }));
    case "line_graph":
      return visual.data.points
        .filter((point): point is { x: number; y: number; label: string } => typeof point.label === "string")
        .map((point) => ({ label: point.label, value: point.y }));
    default:
      return undefined;
  }
}

/** Case/whitespace-insensitive exact label match — never a substring or fuzzy match, so a mismatch is always unambiguous. */
export function findByLabel(values: readonly LabelledValue[], label: string): readonly LabelledValue[] {
  const target = normaliseLabel(label);
  return values.filter((entry) => normaliseLabel(entry.label) === target);
}

export type ExtremeMode = "max" | "min";

/** Every entry tied at the extreme — callers must treat a result with more than one entry as ambiguous, never pick the first. */
export function extremeEntries(values: readonly LabelledValue[], mode: ExtremeMode): readonly LabelledValue[] {
  if (values.length === 0) return [];
  const target =
    mode === "max"
      ? Math.max(...values.map((entry) => entry.value))
      : Math.min(...values.map((entry) => entry.value));
  return values.filter((entry) => entry.value === target);
}

export function sumOf(values: readonly LabelledValue[]): number {
  return values.reduce((total, entry) => total + entry.value, 0);
}

type TableVisual = Extract<VisualAsset, { type: "table" }>;

/**
 * Locates the unique row whose row-label cell (the first string cell,
 * matching the harvest/legacy convention already used by
 * `checkAgainstProductionSchema`'s row-header-agnostic tables) equals
 * `rowLabel`, then reads the cell under `columnHeader`. Returns `undefined`
 * — never a guess — when the row or column cannot be uniquely resolved.
 */
export function tableCellByRowLabel(
  table: TableVisual,
  rowLabel: string,
  columnHeader: string,
): string | number | undefined {
  const columnIndex = table.data.headers.findIndex(
    (header) => normaliseLabel(header) === normaliseLabel(columnHeader),
  );
  if (columnIndex === -1) return undefined;

  const matchingRows = table.data.rows.filter((row) =>
    row.some((cell) => typeof cell === "string" && normaliseLabel(cell) === normaliseLabel(rowLabel)),
  );
  if (matchingRows.length !== 1) return undefined;

  return matchingRows[0][columnIndex];
}

/** Every numeric cell in a table, flattened — used for total/sum derivations over an entire table. */
export function numericCellsOf(table: TableVisual): readonly number[] {
  return table.data.rows.flatMap((row) => row.filter((cell): cell is number => typeof cell === "number"));
}

/**
 * Independently derives the common step of an arithmetic sequence from at
 * least two labelled points, sorted by their own label order (never by
 * value, so a decreasing sequence is preserved as declared). Returns
 * `undefined` when fewer than two points are given or the spacing is not
 * perfectly consistent — both explicit "cannot derive" conditions per the
 * number-line matrix entry, never an approximate step.
 */
export function deriveArithmeticStep(values: readonly number[]): number | undefined {
  if (values.length < 2) return undefined;
  const step = values[1] - values[0];
  const consistent = values.every((value, index) => index === 0 || value - values[index - 1] === step);
  return consistent ? step : undefined;
}

export function extrapolateNext(values: readonly number[], stepsAhead: number): number | undefined {
  const step = deriveArithmeticStep(values);
  if (step === undefined) return undefined;
  return values[values.length - 1] + step * stepsAhead;
}
