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

/**
 * The single canonicalisation function every label/header/option-text
 * equality comparison in this gate goes through — chart labels, table
 * headers, table row labels, duplicate detection, and (via `derive-answer.ts`)
 * chart-to-option exact matching. Explicit, fixed order:
 *
 * 1. Unicode NFC normalisation — a composed accented character (`"é"`,
 *    U+00E9) and its decomposed form (`"e"` + U+0301 combining acute
 *    accent) must canonicalise identically; without this step they are
 *    different strings under `===` despite being the same visible label.
 * 2. Trim leading/trailing whitespace.
 * 3. Collapse internal whitespace runs to a single space.
 * 4. Lowercase, using the project's standard `en-AU` locale (matching
 *    every other locale-sensitive comparison already in this module).
 */
export function canonicaliseLabel(label: string): string {
  return label.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-AU");
}

/**
 * The first canonicalised label that appears more than once, or
 * `undefined` if every label is unique after canonicalisation (whitespace
 * and case variants collapse to the same key — "Monday" and " monday "
 * are the same label for lookup purposes and must not silently coexist).
 * Callers use this to reject ambiguous visual/table structures before any
 * lookup runs, rather than only detecting the ambiguity indirectly via a
 * lookup returning more than one match.
 */
export function firstDuplicateLabel(labels: readonly string[]): string | undefined {
  const seen = new Set<string>();
  for (const label of labels) {
    const key = canonicaliseLabel(label);
    if (seen.has(key)) return label;
    seen.add(key);
  }
  return undefined;
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
  const target = canonicaliseLabel(label);
  return values.filter((entry) => canonicaliseLabel(entry.label) === target);
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
 * — never a guess — when the row or column cannot be uniquely resolved,
 * including when `columnHeader` matches more than one header after
 * canonicalisation (never silently resolved to the first match).
 */
export function tableCellByRowLabel(
  table: TableVisual,
  rowLabel: string,
  columnHeader: string,
): string | number | undefined {
  const matchingColumnIndices = table.data.headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => canonicaliseLabel(header) === canonicaliseLabel(columnHeader))
    .map(({ index }) => index);
  if (matchingColumnIndices.length !== 1) return undefined;
  const columnIndex = matchingColumnIndices[0];

  const matchingRows = table.data.rows.filter((row) =>
    row.some((cell) => typeof cell === "string" && canonicaliseLabel(cell) === canonicaliseLabel(rowLabel)),
  );
  if (matchingRows.length !== 1) return undefined;

  return matchingRows[0][columnIndex];
}

/**
 * Every row's own row-label cell (the first string cell in the row),
 * flattened — used to detect duplicate row labels across the *whole*
 * table before any single-row lookup runs, so a table with two rows both
 * labelled "Monday" is rejected outright rather than only surfacing as an
 * incidental `matchingRows.length !== 1` inside `tableCellByRowLabel`.
 */
export function tableRowLabels(table: TableVisual): readonly string[] {
  return table.data.rows
    .map((row) => row.find((cell) => typeof cell === "string"))
    .filter((cell): cell is string => cell !== undefined);
}

export interface TableShapeIssue {
  readonly kind: "duplicate_header" | "duplicate_row_label" | "malformed_row_width";
  readonly detail: string;
}

/**
 * Validates a table's structural shape before any lookup is attempted:
 * duplicate headers or row labels (after the same canonicalisation used
 * for lookup) make column/row resolution inherently ambiguous, and a row
 * whose cell count doesn't match the header count cannot be safely
 * indexed by column at all. Returns the first issue found, or `undefined`
 * if the table's shape is safe to look up against.
 */
export function validateTableShape(table: TableVisual): TableShapeIssue | undefined {
  const duplicateHeader = firstDuplicateLabel(table.data.headers);
  if (duplicateHeader !== undefined) {
    return { kind: "duplicate_header", detail: duplicateHeader };
  }

  const headerCount = table.data.headers.length;
  const malformedRow = table.data.rows.find((row) => row.length !== headerCount);
  if (malformedRow !== undefined) {
    return {
      kind: "malformed_row_width",
      detail: `expected ${headerCount} cells per row, found a row with ${malformedRow.length}`,
    };
  }

  const duplicateRowLabel = firstDuplicateLabel(tableRowLabels(table));
  if (duplicateRowLabel !== undefined) {
    return { kind: "duplicate_row_label", detail: duplicateRowLabel };
  }

  return undefined;
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
