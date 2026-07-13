/**
 * Independent-derivation dispatcher: tries a fixed, ordered set of
 * narrow, category-specific derivation methods against a candidate's own
 * prompt/stimulus/structured-visual data, never its answer key or
 * explanation. The first method that recognises the question shape wins;
 * a method that doesn't apply returns `not_applicable` so the next method
 * gets a turn, while a method that recognises the shape but cannot safely
 * resolve it (a tie, missing data, an unparseable prompt) returns a
 * terminal `cannot_derive`/`ambiguous` outcome rather than falling through
 * to a guess.
 */
import type { Question } from "@/schemas/question.schema";
import type { VisualAsset } from "@/schemas/visual.schema";

import { CORRECTNESS_LIMITS } from "../config";
import { evaluateExpression, extractArithmeticExpression } from "./arithmetic-expression";
import type { DerivedValue } from "./derived-value";
import { parseNumericToken, sortByValue, type SortableEntry } from "./fraction-decimal";
import { deriveRectangleMeasures } from "./measurement";
import { extractPriceList, totalCents } from "./money";
import {
  centsToDisplayString,
  compareFractions,
  type Fraction,
  fractionFromCents,
  fractionFromDecimalString,
  fractionFromFiniteNumber,
  fractionFromInt,
  fractionsEqual,
  fractionToDisplayString,
  NumericDerivationError,
} from "./numeric";
import {
  canonicaliseLabel,
  deriveArithmeticStep,
  extremeEntries,
  firstDuplicateLabel,
  labelledValuesOf,
  tableCellByRowLabel,
  validateTableShape,
  type LabelledValue,
} from "./visual-lookup";

export type DerivationIssueCode =
  | "unable_to_derive_answer"
  | "ambiguous_prompt"
  | "ambiguous_visual_data"
  | "table_reference_missing"
  | "chart_category_missing"
  | "number_line_inconsistent"
  | "numeric_overflow"
  | "division_by_zero"
  | "invalid_fraction_representation"
  | "invalid_money_representation"
  | "arithmetic_resource_limit_exceeded"
  | "fraction_resource_limit_exceeded"
  | "money_value_invalid"
  | "money_limit_exceeded"
  | "ambiguous_visual_label"
  | "ambiguous_table_header"
  | "ambiguous_table_row";

export interface DerivationSuccess {
  readonly ok: true;
  readonly category: string;
  readonly value: DerivedValue;
  readonly representation: string;
}

export interface DerivationFailure {
  readonly ok: false;
  readonly reason: "not_applicable" | "cannot_derive" | "ambiguous";
  readonly issueCode?: DerivationIssueCode;
  readonly message?: string;
}

export type DerivationOutcome = DerivationSuccess | DerivationFailure;

const NOT_APPLICABLE: DerivationFailure = { ok: false, reason: "not_applicable" };

function success(category: string, value: DerivedValue, representation: string): DerivationSuccess {
  return { ok: true, category, value, representation };
}

function cannotDerive(issueCode: DerivationIssueCode, message: string): DerivationFailure {
  return { ok: false, reason: "cannot_derive", issueCode, message };
}

function ambiguous(issueCode: DerivationIssueCode, message: string): DerivationFailure {
  return { ok: false, reason: "ambiguous", issueCode, message };
}

function normalise(text: string): string {
  return text.trim().toLocaleLowerCase("en-AU");
}

/**
 * Unicode-NFC-normalised before tokenising, for the same reason
 * `canonicaliseLabel` normalises first: the `[a-z0-9.']` token pattern is
 * ASCII-only and necessarily loses an accented letter either way, but
 * without NFC first a composed accented character (`"café"`, one code
 * point) and its decomposed form (`"cafe"` + a combining accent) lose it
 * *inconsistently* — the composed form drops the trailing letter entirely,
 * the decomposed form keeps the bare ASCII base letter — producing two
 * different tokens for what is visibly the same word. Normalising first
 * makes both inputs collapse to the identical code-point sequence before
 * tokenising, so they always produce the same (lossy but consistent)
 * token.
 */
function promptTokens(prompt: string): readonly string[] {
  return prompt.normalize("NFC").toLocaleLowerCase("en-AU").match(/[a-z0-9.']+/g) ?? [];
}

/* ---------------------------------------------------------------------- */
/* Arithmetic expressions                                                  */
/* ---------------------------------------------------------------------- */

function mapExpressionFailure(
  reason: "not_found" | "ambiguous" | "division_by_zero" | "numeric_overflow" | "invalid_syntax" | "resource_limit_exceeded",
  message: string,
): DerivationFailure {
  if (reason === "not_found") return NOT_APPLICABLE;
  if (reason === "ambiguous") return ambiguous("ambiguous_prompt", message);
  if (reason === "division_by_zero") return cannotDerive("division_by_zero", message);
  if (reason === "numeric_overflow") return cannotDerive("numeric_overflow", message);
  if (reason === "resource_limit_exceeded") return cannotDerive("arithmetic_resource_limit_exceeded", message);
  return cannotDerive("unable_to_derive_answer", message);
}

function attemptArithmetic(question: Question): DerivationOutcome {
  const key = question.answerKey;

  if (key.kind === "number") {
    const extraction = extractArithmeticExpression(question.prompt);
    if (!extraction.ok) return mapExpressionFailure(extraction.reason, extraction.message);
    return success(
      "arithmetic_expression",
      { kind: "number", value: extraction.value },
      fractionToDisplayString(extraction.value),
    );
  }

  if (key.kind === "boolean") {
    const claimMatch = question.prompt.match(
      /([0-9+\-*/×÷xX().\s]{3,}?)\s*(?:=|equals)\s*(-?\d+(?:\.\d+)?)/,
    );
    if (!claimMatch) return NOT_APPLICABLE;
    const evaluation = evaluateExpression(claimMatch[1]);
    if (!evaluation.ok) return mapExpressionFailure(evaluation.reason, evaluation.message);
    const claimed = fractionFromDecimalString(claimMatch[2]);
    const claimIsTrue = fractionsEqual(evaluation.value, claimed);
    return success("arithmetic_claim", { kind: "boolean", value: claimIsTrue }, claimIsTrue ? "true" : "false");
  }

  if (key.kind === "single_option" && question.options.length > 0) {
    const extraction = extractArithmeticExpression(question.prompt);
    if (!extraction.ok) return mapExpressionFailure(extraction.reason, extraction.message);
    const matches = question.options.filter((option) => {
      const parsed = parseNumericToken(option.text);
      return parsed !== undefined && fractionsEqual(parsed, extraction.value);
    });
    if (matches.length === 1) {
      return success(
        "arithmetic_expression",
        { kind: "single_option", optionId: matches[0].id },
        matches[0].id,
      );
    }
    if (matches.length > 1) {
      return ambiguous(
        "ambiguous_prompt",
        `Recomputed value ${fractionToDisplayString(extraction.value)} matches more than one option.`,
      );
    }
    return cannotDerive(
      "unable_to_derive_answer",
      `Recomputed value ${fractionToDisplayString(extraction.value)} does not match any declared option.`,
    );
  }

  return NOT_APPLICABLE;
}

/* ---------------------------------------------------------------------- */
/* Chart lookups (bar_chart / line_graph / pie_chart)                      */
/* ---------------------------------------------------------------------- */

const EXTREME_MAX_PATTERN = /highest|most|largest|maximum|greatest/;
const EXTREME_MIN_PATTERN = /lowest|least|smallest|minimum/;

function labelledValueToNumericDerivation(entry: LabelledValue): DerivedValue {
  return { kind: "number", value: fractionFromFiniteNumber(entry.value) };
}

/**
 * Exact match only, after the same canonicalisation `visual-lookup.ts`
 * uses for every other label/header comparison — never substring, prefix,
 * suffix, token-containment, or fuzzy matching. A chart label `"A"` must
 * never resolve to a declared option `"AA"` (or vice versa) just because
 * one text contains the other. Callers must treat anything other than
 * exactly one match as unresolved: zero matches means no declared option
 * corresponds to the label; more than one means the mapping is ambiguous
 * (including when two declared options share the same canonical text).
 */
function findOptionsMatchingLabelExactly(question: Question, label: string): readonly { id: string }[] {
  const target = canonicaliseLabel(label);
  return question.options.filter((option) => canonicaliseLabel(option.text) === target);
}

function attemptChartExtreme(question: Question): DerivationOutcome {
  const chartVisuals = question.visuals.filter(
    (visual): visual is Extract<VisualAsset, { type: "bar_chart" | "line_graph" | "pie_chart" }> =>
      visual.type === "bar_chart" || visual.type === "line_graph" || visual.type === "pie_chart",
  );
  if (chartVisuals.length === 0) return NOT_APPLICABLE;

  const promptLower = question.prompt.toLocaleLowerCase("en-AU");
  const wantsMax = EXTREME_MAX_PATTERN.test(promptLower);
  const wantsMin = EXTREME_MIN_PATTERN.test(promptLower);
  if (!wantsMax && !wantsMin) return NOT_APPLICABLE;

  for (const visual of chartVisuals) {
    const values = labelledValuesOf(visual);
    if (!values || values.length === 0) continue;
    const duplicateLabel = firstDuplicateLabel(values.map((entry) => entry.label));
    if (duplicateLabel !== undefined) {
      return ambiguous(
        "ambiguous_visual_label",
        `Category label '${duplicateLabel}' appears more than once in visual '${visual.id}' after canonicalisation, making its data ambiguous to look up.`,
      );
    }
    const extremes = extremeEntries(values, wantsMax ? "max" : "min");
    if (extremes.length === 0) continue;
    if (extremes.length > 1) {
      return ambiguous(
        "ambiguous_visual_data",
        `Two or more categories tie for the ${wantsMax ? "maximum" : "minimum"} value in visual '${visual.id}'.`,
      );
    }
    const winner = extremes[0];

    if (question.answerKey.kind === "number") {
      return success(
        "chart_extreme",
        labelledValueToNumericDerivation(winner),
        fractionToDisplayString(fractionFromFiniteNumber(winner.value)),
      );
    }
    if (question.answerKey.kind === "single_option" || question.answerKey.kind === "multiple_options") {
      const matches = findOptionsMatchingLabelExactly(question, winner.label);
      if (matches.length === 0) {
        return cannotDerive(
          "unable_to_derive_answer",
          `No declared option exactly matches the winning chart label '${winner.label}' in visual '${visual.id}'.`,
        );
      }
      if (matches.length > 1) {
        return ambiguous(
          "ambiguous_prompt",
          `More than one declared option exactly matches the winning chart label '${winner.label}' in visual '${visual.id}'.`,
        );
      }
      if (question.answerKey.kind === "single_option") {
        return success("chart_extreme", { kind: "single_option", optionId: matches[0].id }, matches[0].id);
      }
      return success("chart_extreme", { kind: "multiple_options", optionIds: [matches[0].id] }, `[${matches[0].id}]`);
    }
  }
  return NOT_APPLICABLE;
}

/** Whole-word, case-insensitive match of a chart's own label text against the prompt — never a substring across word boundaries. */
function chartLabelsReferencedInPrompt(
  values: readonly LabelledValue[],
  prompt: string,
): readonly LabelledValue[] {
  const tokens = new Set(promptTokens(prompt));
  return values.filter((entry) => {
    const labelTokens = promptTokens(entry.label);
    return labelTokens.length > 0 && labelTokens.every((token) => tokens.has(token));
  });
}

function attemptChartExactLookup(question: Question): DerivationOutcome {
  if (question.answerKey.kind !== "number") return NOT_APPLICABLE;
  const chartVisuals = question.visuals.filter(
    (visual): visual is Extract<VisualAsset, { type: "bar_chart" | "line_graph" | "pie_chart" }> =>
      visual.type === "bar_chart" || visual.type === "line_graph" || visual.type === "pie_chart",
  );
  if (chartVisuals.length === 0) return NOT_APPLICABLE;

  for (const visual of chartVisuals) {
    const values = labelledValuesOf(visual);
    if (!values || values.length === 0) continue;
    const duplicateLabel = firstDuplicateLabel(values.map((entry) => entry.label));
    if (duplicateLabel !== undefined) {
      return ambiguous(
        "ambiguous_visual_label",
        `Category label '${duplicateLabel}' appears more than once in visual '${visual.id}' after canonicalisation, making its data ambiguous to look up.`,
      );
    }
    const referenced = chartLabelsReferencedInPrompt(values, question.prompt);
    if (referenced.length === 0) continue;
    if (referenced.length > 1) {
      return ambiguous(
        "ambiguous_prompt",
        `Prompt references more than one chart category in visual '${visual.id}'.`,
      );
    }
    return success(
      "chart_lookup",
      labelledValueToNumericDerivation(referenced[0]),
      fractionToDisplayString(fractionFromFiniteNumber(referenced[0].value)),
    );
  }
  return NOT_APPLICABLE;
}

/* ---------------------------------------------------------------------- */
/* Table lookups                                                           */
/* ---------------------------------------------------------------------- */

const DIFFERENCE_PATTERN = /more .* than|fewer .* than|difference|less .* than/;

function attemptTableLookup(question: Question): DerivationOutcome {
  if (question.answerKey.kind !== "number") return NOT_APPLICABLE;
  const tables = question.visuals.filter(
    (visual): visual is Extract<VisualAsset, { type: "table" }> => visual.type === "table",
  );
  if (tables.length === 0) return NOT_APPLICABLE;

  const wantsDifference = DIFFERENCE_PATTERN.test(question.prompt.toLocaleLowerCase("en-AU"));

  for (const table of tables) {
    if (table.data.headers.length < 2) continue;

    const shapeIssue = validateTableShape(table);
    if (shapeIssue !== undefined) {
      if (shapeIssue.kind === "duplicate_header") {
        return ambiguous(
          "ambiguous_table_header",
          `Header '${shapeIssue.detail}' appears more than once in table '${table.id}' after canonicalisation.`,
        );
      }
      if (shapeIssue.kind === "duplicate_row_label") {
        return ambiguous(
          "ambiguous_table_row",
          `Row label '${shapeIssue.detail}' appears more than once in table '${table.id}' after canonicalisation.`,
        );
      }
      return cannotDerive(
        "table_reference_missing",
        `Table '${table.id}' has a malformed row shape: ${shapeIssue.detail}.`,
      );
    }

    const valueColumnIndex = table.data.headers.length - 1;
    const rowLabelTokens = table.data.rows
      .map((row) => row.find((cell) => typeof cell === "string"))
      .filter((cell): cell is string => cell !== undefined);

    const tokens = new Set(promptTokens(question.prompt));
    const referencedRowLabels = rowLabelTokens.filter((label) => {
      const labelTokens = promptTokens(label);
      return labelTokens.length > 0 && labelTokens.every((token) => tokens.has(token));
    });

    if (referencedRowLabels.length === 0) continue;

    if (wantsDifference && referencedRowLabels.length === 2) {
      const [first, second] = referencedRowLabels;
      const firstCell = tableCellByRowLabel(table, first, table.data.headers[valueColumnIndex]);
      const secondCell = tableCellByRowLabel(table, second, table.data.headers[valueColumnIndex]);
      if (typeof firstCell !== "number" || typeof secondCell !== "number") {
        return cannotDerive(
          "table_reference_missing",
          `Could not resolve numeric values for both rows referenced in table '${table.id}'.`,
        );
      }
      const difference = Math.abs(firstCell - secondCell);
      return success(
        "table_difference",
        { kind: "number", value: fractionFromFiniteNumber(difference) },
        fractionToDisplayString(fractionFromFiniteNumber(difference)),
      );
    }

    if (referencedRowLabels.length > 1) {
      return ambiguous(
        "ambiguous_prompt",
        `Prompt references more than one row label in table '${table.id}'.`,
      );
    }

    const cell = tableCellByRowLabel(table, referencedRowLabels[0], table.data.headers[valueColumnIndex]);
    if (cell === undefined) {
      return cannotDerive(
        "table_reference_missing",
        `Referenced row '${referencedRowLabels[0]}' could not be uniquely resolved in table '${table.id}'.`,
      );
    }
    if (typeof cell !== "number") {
      return cannotDerive(
        "table_reference_missing",
        `Resolved cell in table '${table.id}' is not numeric.`,
      );
    }
    return success(
      "table_lookup",
      { kind: "number", value: fractionFromFiniteNumber(cell) },
      fractionToDisplayString(fractionFromFiniteNumber(cell)),
    );
  }
  return NOT_APPLICABLE;
}

/* ---------------------------------------------------------------------- */
/* Number lines                                                            */
/* ---------------------------------------------------------------------- */

function attemptNumberLine(question: Question): DerivationOutcome {
  if (question.answerKey.kind !== "number") return NOT_APPLICABLE;
  const numberLines = question.visuals.filter(
    (visual): visual is Extract<VisualAsset, { type: "number_line" }> => visual.type === "number_line",
  );
  if (numberLines.length === 0) return NOT_APPLICABLE;

  for (const visual of numberLines) {
    const values = visual.data.highlightedValues;
    if (values.length < 2) continue;
    const step = deriveArithmeticStep(values);
    if (step === undefined) {
      return cannotDerive(
        "number_line_inconsistent",
        `Highlighted values on number line '${visual.id}' are not evenly spaced.`,
      );
    }
    const next = values[values.length - 1] + step;
    return success(
      "number_line_extrapolation",
      { kind: "number", value: fractionFromFiniteNumber(next) },
      fractionToDisplayString(fractionFromFiniteNumber(next)),
    );
  }
  return NOT_APPLICABLE;
}

/* ---------------------------------------------------------------------- */
/* Money                                                                    */
/* ---------------------------------------------------------------------- */

const QUANTITY_ITEM_PATTERN = /\b(\d+)\s+([a-z][a-z\s]*?)(?:s)?\b/gi;

function attemptMoney(question: Question): DerivationOutcome {
  if (question.answerKey.kind !== "number") return NOT_APPLICABLE;
  const tables = question.visuals.filter(
    (visual): visual is Extract<VisualAsset, { type: "table" }> => visual.type === "table",
  );
  if (tables.length === 0) return NOT_APPLICABLE;

  for (const table of tables) {
    const priceList = extractPriceList(table);
    if (!priceList) continue;

    const lineItems: { unitCents: number; quantity: number }[] = [];
    let matchedAny = false;
    for (const entry of priceList) {
      const target = normalise(entry.item);
      const matches = [...question.prompt.matchAll(QUANTITY_ITEM_PATTERN)].filter(
        (match) => normalise(match[2]).includes(target) || target.includes(normalise(match[2])),
      );
      if (matches.length === 0) continue;
      if (matches.length > 1) {
        return ambiguous(
          "ambiguous_prompt",
          `Prompt references the quantity for '${entry.item}' more than once.`,
        );
      }
      matchedAny = true;
      lineItems.push({ unitCents: entry.cents, quantity: Number(matches[0][1]) });
    }

    if (!matchedAny) continue;

    // `totalCents`/`fractionFromCents` are the sole arithmetic surface for
    // money derivation — integer cents throughout, never a float dollar
    // multiplication and never `toFixed()` to reconstruct the display
    // value.
    let total: number;
    try {
      total = totalCents(lineItems);
    } catch (error) {
      if (error instanceof NumericDerivationError) {
        if (error.code === "money_limit_exceeded") return cannotDerive("money_limit_exceeded", error.message);
        return cannotDerive("money_value_invalid", error.message);
      }
      throw error;
    }
    return success("money_total", { kind: "number", value: fractionFromCents(total) }, centsToDisplayString(total));
  }
  return NOT_APPLICABLE;
}

/* ---------------------------------------------------------------------- */
/* Perimeter and rectangular area                                          */
/* ---------------------------------------------------------------------- */

const PERIMETER_PATTERN = /perimeter/;
const AREA_PATTERN = /\barea\b/;

function attemptPerimeterArea(question: Question): DerivationOutcome {
  const key = question.answerKey;
  if (key.kind !== "number" && key.kind !== "boolean") return NOT_APPLICABLE;

  const shapes = question.visuals.filter(
    (visual): visual is Extract<VisualAsset, { type: "geometry_shape" }> => visual.type === "geometry_shape",
  );
  if (shapes.length === 0) return NOT_APPLICABLE;

  const promptLower = question.prompt.toLocaleLowerCase("en-AU");
  const wantsPerimeter = PERIMETER_PATTERN.test(promptLower);
  const wantsArea = AREA_PATTERN.test(promptLower);
  if (!wantsPerimeter && !wantsArea) return NOT_APPLICABLE;

  for (const shape of shapes) {
    if (shape.data.shape !== "square" && shape.data.shape !== "rectangle") continue;
    const measures = deriveRectangleMeasures(shape);
    if (!measures) continue;
    const derivedFraction = wantsPerimeter ? measures.perimeter : measures.area;
    const category = wantsPerimeter ? "perimeter" : "area";

    if (key.kind === "number") {
      return success("rectangle_" + category, { kind: "number", value: derivedFraction }, fractionToDisplayString(derivedFraction));
    }

    const claimMatch = question.prompt.match(/(\d+(?:\.\d+)?)/g);
    if (!claimMatch) return NOT_APPLICABLE;
    const claimedValues = claimMatch
      .map((text) => {
        try {
          return fractionFromDecimalString(text);
        } catch {
          return undefined;
        }
      })
      .filter((value): value is NonNullable<typeof value> => value !== undefined);
    const claimedMatches = claimedValues.filter((value) => fractionsEqual(value, derivedFraction));
    if (claimedMatches.length !== 1) continue;
    return success(
      "rectangle_" + category,
      { kind: "boolean", value: true },
      "true",
    );
  }
  return NOT_APPLICABLE;
}

/* ---------------------------------------------------------------------- */
/* Fraction/decimal ordering and matching                                  */
/* ---------------------------------------------------------------------- */

const ASCENDING_PATTERN = /least|smallest|youngest|lowest|ascending/;
const DESCENDING_PATTERN = /largest|biggest|most|greatest|descending/;

function attemptFractionOrdering(question: Question): DerivationOutcome {
  if (question.answerKey.kind !== "ordering" || question.interaction?.type !== "ordering") return NOT_APPLICABLE;
  if (question.interaction.items.length > CORRECTNESS_LIMITS.MAX_ORDERING_ITEMS) {
    return cannotDerive(
      "fraction_resource_limit_exceeded",
      `Ordering has ${question.interaction.items.length} items, exceeding the supported limit of ${CORRECTNESS_LIMITS.MAX_ORDERING_ITEMS}.`,
    );
  }
  const entries: SortableEntry<string>[] = [];
  for (const item of question.interaction.items) {
    const parsed = parseNumericToken(item.text);
    if (!parsed) return NOT_APPLICABLE;
    entries.push({ id: item.id, value: parsed });
  }

  const promptLower = question.prompt.toLocaleLowerCase("en-AU");
  const ascendingIndex = promptLower.search(ASCENDING_PATTERN);
  const descendingIndex = promptLower.search(DESCENDING_PATTERN);
  const direction: "ascending" | "descending" | undefined =
    ascendingIndex === -1 && descendingIndex === -1
      ? undefined
      : ascendingIndex === -1
        ? "descending"
        : descendingIndex === -1
          ? "ascending"
          : ascendingIndex < descendingIndex
            ? "ascending"
            : "descending";
  if (!direction) return cannotDerive("ambiguous_prompt", "Ordering direction (ascending/descending) is not stated in the prompt.");

  const sorted = sortByValue(entries, direction);
  if (!sorted) return ambiguous("ambiguous_visual_data", "Two or more ordering items share the same numeric value.");
  return success("fraction_ordering", { kind: "ordering", optionIds: sorted }, `[${sorted.join(",")}]`);
}

function attemptFractionMatching(question: Question): DerivationOutcome {
  if (question.answerKey.kind !== "matching" || question.interaction?.type !== "matching") return NOT_APPLICABLE;
  const { sources, targets } = question.interaction;
  if (sources.length > CORRECTNESS_LIMITS.MAX_ORDERING_ITEMS || targets.length > CORRECTNESS_LIMITS.MAX_ORDERING_ITEMS) {
    return cannotDerive(
      "fraction_resource_limit_exceeded",
      `Matching has ${sources.length} sources and ${targets.length} targets, exceeding the supported limit of ${CORRECTNESS_LIMITS.MAX_ORDERING_ITEMS}.`,
    );
  }

  const sourceValues = sources.map((source) => ({ id: source.id, value: parseNumericToken(source.text) }));
  const targetValues = targets.map((target) => ({ id: target.id, value: parseNumericToken(target.text) }));
  if (sourceValues.some((s) => s.value === undefined) || targetValues.some((t) => t.value === undefined)) {
    return NOT_APPLICABLE;
  }

  const pairs: { sourceId: string; targetId: string }[] = [];
  for (const source of sourceValues) {
    const matches = targetValues.filter((target) => fractionsEqual(target.value!, source.value!));
    if (matches.length !== 1) {
      return ambiguous(
        "ambiguous_visual_data",
        `Source '${source.id}' does not have exactly one equal-value target match.`,
      );
    }
    pairs.push({ sourceId: source.id, targetId: matches[0].id });
  }
  return success(
    "fraction_equivalence",
    { kind: "matching", pairs },
    `{${pairs.map((p) => `${p.sourceId}:${p.targetId}`).join(",")}}`,
  );
}

/* ---------------------------------------------------------------------- */
/* Fraction models (single numeric quantity: numerator/denominator/etc.)   */
/* ---------------------------------------------------------------------- */

function fractionModelTargetValue(
  shape: Extract<VisualAsset, { type: "fraction_model" }>,
  keywordSource: string,
): { readonly value: bigint; readonly category: string } | undefined {
  const lower = keywordSource.toLocaleLowerCase("en-AU");
  if (/unshaded|remaining|not shaded/.test(lower)) {
    return { value: BigInt(shape.data.denominator - shape.data.numerator), category: "fraction_model_unshaded" };
  }
  if (/shaded|numerator/.test(lower)) {
    return { value: BigInt(shape.data.numerator), category: "fraction_model_numerator" };
  }
  if (/total|denominator|equal parts/.test(lower)) {
    return { value: BigInt(shape.data.denominator), category: "fraction_model_denominator" };
  }
  return undefined;
}

function attemptFractionModelSingleValue(question: Question): DerivationOutcome {
  const shapes = question.visuals.filter(
    (visual): visual is Extract<VisualAsset, { type: "fraction_model" }> => visual.type === "fraction_model",
  );
  if (shapes.length !== 1) return NOT_APPLICABLE;
  const shape = shapes[0];

  if (question.answerKey.kind === "number") {
    const target = fractionModelTargetValue(shape, question.prompt);
    if (!target) return NOT_APPLICABLE;
    return success(
      target.category,
      { kind: "number", value: fractionFromInt(Number(target.value)) },
      target.value.toString(),
    );
  }

  if (question.answerKey.kind === "fill_blank" && question.interaction?.type === "fill_blank") {
    if (question.interaction.blanks.length !== 1) return NOT_APPLICABLE;
    const blank = question.interaction.blanks[0];
    const target = fractionModelTargetValue(shape, blank.label);
    if (!target) return NOT_APPLICABLE;
    return success(
      target.category,
      { kind: "fill_blank", values: { [blank.id]: target.value.toString() } },
      `{${blank.id}:${target.value.toString()}}`,
    );
  }

  if (question.answerKey.kind === "dropdown" && question.interaction?.type === "dropdown") {
    if (question.interaction.fields.length !== 1) return NOT_APPLICABLE;
    const field = question.interaction.fields[0];
    const target = fractionModelTargetValue(shape, field.label);
    if (!target) return NOT_APPLICABLE;
    const matchingOption = field.options.find((option) => parseNumericToken(option.text) && fractionsEqual(parseNumericToken(option.text)!, fractionFromInt(Number(target.value))));
    if (!matchingOption) {
      return cannotDerive(
        "unable_to_derive_answer",
        `No dropdown option for field '${field.id}' matches the derived value ${target.value.toString()}.`,
      );
    }
    return success(
      target.category,
      { kind: "dropdown", values: { [field.id]: matchingOption.id } },
      `{${field.id}:${matchingOption.id}}`,
    );
  }

  return NOT_APPLICABLE;
}

/* ---------------------------------------------------------------------- */
/* Numeric predicate over declared options (multiple_options)              */
/* ---------------------------------------------------------------------- */

const MULTIPLE_OF_PATTERN = /multiples? of (-?\d+(?:\.\d+)?)/;
const EVEN_PATTERN = /\beven\b/;
const ODD_PATTERN = /\bodd\b/;
const LESS_THAN_PATTERN = /less than (-?\d+(?:\.\d+)?)/;
const GREATER_THAN_PATTERN = /(?:greater|more) than (-?\d+(?:\.\d+)?)/;

interface NumericPredicate {
  readonly description: string;
  /** Even/odd/multiples-of are only mathematically defined over integers; less-than/greater-than are defined over any exact value. */
  readonly requiresIntegralOperand: boolean;
  readonly test: (value: Fraction) => boolean;
}

type PredicateParseOutcome =
  | { readonly kind: "matched"; readonly predicate: NumericPredicate }
  | { readonly kind: "not_matched" }
  | { readonly kind: "invalid"; readonly issueCode: DerivationIssueCode; readonly message: string };

/**
 * A closed, explicit predicate mechanically parsed from the prompt — never
 * a semantic guess, and never applied to anything but each option's own
 * literal numeric text. Every threshold/divisor — "multiples of N" as much
 * as "less than"/"greater than" — is parsed via `fractionFromDecimalString`,
 * the single bounded exact-decimal parser used throughout this gate: syntax
 * is validated and digit length is bounded *before* any `BigInt(...)`
 * construction, with a post-construction magnitude bound as defence in
 * depth (see `numeric.ts`). A decimal threshold such as "less than 2.5" is
 * compared exactly rather than truncated (never `parseInt`/`Math.trunc`),
 * and a pathologically long divisor/threshold fails closed with a bounded,
 * stable resource-limit issue rather than ever reaching an unbounded
 * `BigInt(...)` call directly.
 */
function numericPredicateFromPrompt(prompt: string): PredicateParseOutcome {
  const lower = prompt.toLocaleLowerCase("en-AU");

  const multipleMatch = lower.match(MULTIPLE_OF_PATTERN);
  if (multipleMatch) {
    let divisorFraction: Fraction;
    try {
      divisorFraction = fractionFromDecimalString(multipleMatch[1]);
    } catch (error) {
      if (error instanceof NumericDerivationError) {
        const issueCode: DerivationIssueCode =
          error.code === "fraction_resource_limit_exceeded" ? "fraction_resource_limit_exceeded" : "unable_to_derive_answer";
        // Never echo the raw (potentially huge) divisor text back into the issue.
        return { kind: "invalid", issueCode, message: "The stated multiples-of divisor could not be parsed within the supported bounds." };
      }
      throw error;
    }
    if (divisorFraction.den !== BigInt(1)) {
      return { kind: "invalid", issueCode: "unable_to_derive_answer", message: "The stated multiples-of divisor is not an integer." };
    }
    if (divisorFraction.num === BigInt(0)) {
      return { kind: "invalid", issueCode: "unable_to_derive_answer", message: "'Multiples of 0' is not a mathematically well-defined predicate." };
    }
    const divisor = divisorFraction.num;
    return {
      kind: "matched",
      predicate: {
        description: "a multiple of the stated divisor",
        requiresIntegralOperand: true,
        test: (value) => value.num % divisor === BigInt(0),
      },
    };
  }
  if (EVEN_PATTERN.test(lower)) {
    return {
      kind: "matched",
      predicate: { description: "even", requiresIntegralOperand: true, test: (value) => value.num % BigInt(2) === BigInt(0) },
    };
  }
  if (ODD_PATTERN.test(lower)) {
    return {
      kind: "matched",
      predicate: { description: "odd", requiresIntegralOperand: true, test: (value) => value.num % BigInt(2) !== BigInt(0) },
    };
  }
  const lessMatch = lower.match(LESS_THAN_PATTERN);
  if (lessMatch) {
    try {
      const threshold = fractionFromDecimalString(lessMatch[1]);
      return {
        kind: "matched",
        predicate: { description: "less than the stated threshold", requiresIntegralOperand: false, test: (value) => compareFractions(value, threshold) < 0 },
      };
    } catch (error) {
      if (error instanceof NumericDerivationError) {
        return { kind: "invalid", issueCode: "fraction_resource_limit_exceeded", message: "The stated 'less than' threshold could not be parsed within the supported bounds." };
      }
      throw error;
    }
  }
  const moreMatch = lower.match(GREATER_THAN_PATTERN);
  if (moreMatch) {
    try {
      const threshold = fractionFromDecimalString(moreMatch[1]);
      return {
        kind: "matched",
        predicate: {
          description: "greater than the stated threshold",
          requiresIntegralOperand: false,
          test: (value) => compareFractions(value, threshold) > 0,
        },
      };
    } catch (error) {
      if (error instanceof NumericDerivationError) {
        return { kind: "invalid", issueCode: "fraction_resource_limit_exceeded", message: "The stated 'greater than' threshold could not be parsed within the supported bounds." };
      }
      throw error;
    }
  }
  return { kind: "not_matched" };
}

function attemptNumericPredicateOverOptions(question: Question): DerivationOutcome {
  if (question.answerKey.kind !== "multiple_options") return NOT_APPLICABLE;
  const predicateOutcome = numericPredicateFromPrompt(question.prompt);
  if (predicateOutcome.kind === "not_matched") return NOT_APPLICABLE;
  if (predicateOutcome.kind === "invalid") return cannotDerive(predicateOutcome.issueCode, predicateOutcome.message);
  const predicate = predicateOutcome.predicate;

  const parsedOptions = question.options.map((option) => ({ id: option.id, value: parseNumericToken(option.text) }));
  if (parsedOptions.some((entry) => entry.value === undefined)) {
    return NOT_APPLICABLE;
  }

  if (predicate.requiresIntegralOperand) {
    const nonIntegral = parsedOptions.find((entry) => entry.value!.den !== BigInt(1));
    if (nonIntegral) {
      return cannotDerive(
        "unable_to_derive_answer",
        `Option '${nonIntegral.id}' is not an integer; the predicate '${predicate.description}' is not mathematically defined for non-integral values.`,
      );
    }
  }

  // Declared option order is preserved: filtered directly from
  // `parsedOptions`, which was built by mapping `question.options` in its
  // original declared order.
  const matchingIds = parsedOptions.filter((entry) => predicate.test(entry.value!)).map((entry) => entry.id);
  if (matchingIds.length === 0) {
    return cannotDerive("unable_to_derive_answer", "No declared option satisfies the stated numeric predicate.");
  }
  return success("numeric_predicate", { kind: "multiple_options", optionIds: matchingIds }, `[${matchingIds.join(",")}]`);
}

/* ---------------------------------------------------------------------- */
/* Dispatcher                                                              */
/* ---------------------------------------------------------------------- */

const DERIVATION_METHODS: readonly ((question: Question) => DerivationOutcome)[] = [
  attemptArithmetic,
  attemptMoney,
  attemptPerimeterArea,
  attemptChartExtreme,
  attemptChartExactLookup,
  attemptTableLookup,
  attemptNumberLine,
  attemptFractionOrdering,
  attemptFractionMatching,
  attemptFractionModelSingleValue,
  attemptNumericPredicateOverOptions,
];

/**
 * Tries every registered derivation method in order and returns the first
 * one that recognises the question shape. Never combines partial results
 * from multiple methods, and never falls back to a guess once a method
 * recognises the shape but cannot safely resolve it.
 */
export function deriveIndependentAnswer(question: Question): DerivationOutcome {
  for (const method of DERIVATION_METHODS) {
    const outcome = method(question);
    if (outcome.ok || outcome.reason !== "not_applicable") return outcome;
  }
  return cannotDerive(
    "unable_to_derive_answer",
    "No deterministic derivation method recognised this question's prompt/visual shape.",
  );
}
