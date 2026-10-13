/**
 * bar_model validation, in three layers that each own a different kind of
 * mistake:
 *
 *   1. Schema (Zod, src/schemas/visual.schema.ts) - malformed shape only.
 *   2. Structural (`validateBarModelStructure`) - broken references and
 *      layout-facing structure: unique IDs, no dangling IDs, contiguous
 *      braces, one comparison group per difference, exactly one target.
 *   3. Mathematical (`solveBarModel`, after the structural layer passes) -
 *      the model becomes linear equations over exact rationals; it must be
 *      consistent, feasible, have a uniquely determined target, and must not
 *      disclose that target in descriptive text.
 *
 * Zod alone does not prove a model is solvable, and nothing here is
 * imported by a learner-facing path in Phase 1.
 */
import type { BarModelData } from "@/schemas/visual.schema";
import {
  MAX_BAR_MODEL_BARS,
  MAX_BAR_MODEL_BRACES,
  MAX_BAR_MODEL_SEGMENTS_PER_BAR,
  MAX_BAR_MODEL_SEGMENTS_TOTAL,
  MAX_BAR_MODEL_UNITS_PER_BAR,
} from "@/schemas/visual-safety";

import { orderBars } from "./bar-order";
import {
  combine,
  constant,
  equals,
  equation,
  formatRational,
  isNegative,
  isWhole,
  rational,
  rationalFromDecimal,
  solveLinearSystem,
  sumExpressions,
  terminatingDecimal,
  toRationalString,
  variable,
  type LinearExpression,
  type Rational,
  type RationalString,
} from "./rational";

export type BarModelLayer = "schema" | "structural" | "mathematical";

export const STRUCTURAL_CODES = [
  "duplicate_id",
  "dangling_unit_id",
  "dangling_quantity_id",
  "dangling_bar_id",
  "dangling_segment_id",
  "brace_spans_multiple_bars",
  "non_contiguous_brace",
  "difference_same_bar",
  "difference_bars_ungrouped",
  "bar_in_multiple_groups",
  "comparison_unit_mismatch",
  "target_count",
  "target_on_reference",
  "change_stored_twice",
  "display_mismatch",
  "relationship_stage_mismatch",
  "relationship_shape",
  "bound_exceeded",
  "unused_unit",
  "unused_quantity",
] as const;

export const MATHEMATICAL_CODES = [
  "contradictory_givens",
  "transfer_breaks_conservation",
  "infeasible_negative",
  "target_not_unique",
  "fractional_target",
  "answer_leak",
  "answer_equals_given",
] as const;

export type BarModelStructuralCode = (typeof STRUCTURAL_CODES)[number];
export type BarModelMathematicalCode = (typeof MATHEMATICAL_CODES)[number];
export type BarModelIssueCode = BarModelStructuralCode | BarModelMathematicalCode;

export interface BarModelIssue {
  code: BarModelIssueCode;
  severity: "error" | "warning";
  path: (string | number)[];
  message: string;
}

/** Descriptive text outside `data` that must not disclose the answer. */
export interface BarModelTextContext {
  visualId?: string;
  title?: string;
  caption?: string;
  altText?: string;
}

export interface BarModelSolution {
  ok: boolean;
  /** The target as exact numerator/denominator strings, or null. */
  target: RationalString | null;
  /** True when the target is a whole number. False when null or a fraction. */
  isWhole: boolean;
  issues: BarModelIssue[];
  /** How many transfer-conservation equations were checked. */
  conservationChecks: number;
}

export function layerOfCode(code: BarModelIssueCode): Exclude<BarModelLayer, "schema"> {
  return (STRUCTURAL_CODES as readonly string[]).includes(code) ? "structural" : "mathematical";
}

type Bar = BarModelData["bars"][number];
type Segment = Bar["segments"][number];
type Brace = BarModelData["braces"][number];
type Quantity = BarModelData["quantities"][number];

const issue = (
  code: BarModelIssueCode,
  path: (string | number)[],
  message: string,
  severity: "error" | "warning" = "error",
): BarModelIssue => ({ code, severity, path, message });

/* ---------------------------------------------------------------- *
 * Structural layer
 * ---------------------------------------------------------------- */

export function validateBarModelStructure(model: BarModelData): BarModelIssue[] {
  const issues: BarModelIssue[] = [];

  // Bounds, re-checked as defence in depth (Zod enforces the same numbers).
  const segmentCount = model.bars.reduce((total, bar) => total + bar.segments.length, 0);
  if (model.bars.length > MAX_BAR_MODEL_BARS) {
    issues.push(issue("bound_exceeded", ["bars"], `At most ${MAX_BAR_MODEL_BARS} bars.`));
  }
  if (segmentCount > MAX_BAR_MODEL_SEGMENTS_TOTAL) {
    issues.push(issue("bound_exceeded", ["bars"], `At most ${MAX_BAR_MODEL_SEGMENTS_TOTAL} segments in total.`));
  }
  if (model.braces.length > MAX_BAR_MODEL_BRACES) {
    issues.push(issue("bound_exceeded", ["braces"], `At most ${MAX_BAR_MODEL_BRACES} braces.`));
  }
  model.bars.forEach((bar, barIndex) => {
    if (bar.segments.length > MAX_BAR_MODEL_SEGMENTS_PER_BAR) {
      issues.push(issue("bound_exceeded", ["bars", barIndex, "segments"], `At most ${MAX_BAR_MODEL_SEGMENTS_PER_BAR} segments per bar.`));
    }
    const units = bar.segments.reduce((total, segment) => total + (segment.units ?? 0), 0);
    if (units > MAX_BAR_MODEL_UNITS_PER_BAR) {
      issues.push(issue("bound_exceeded", ["bars", barIndex], `At most ${MAX_BAR_MODEL_UNITS_PER_BAR} units per bar.`));
    }
  });

  // Unique IDs across every identifiable thing.
  const seen = new Map<string, string>();
  const register = (id: string, path: (string | number)[]) => {
    const where = path.join(".");
    const previous = seen.get(id);
    if (previous !== undefined) {
      issues.push(issue("duplicate_id", path, `ID "${id}" is already used at ${previous}.`));
    } else {
      seen.set(id, where);
    }
  };
  model.units.forEach((unit, index) => register(unit.id, ["units", index, "id"]));
  model.quantities.forEach((quantity, index) => register(quantity.id, ["quantities", index, "id"]));
  model.bars.forEach((bar, barIndex) => {
    register(bar.id, ["bars", barIndex, "id"]);
    bar.segments.forEach((segment, segmentIndex) =>
      register(segment.id, ["bars", barIndex, "segments", segmentIndex, "id"]),
    );
  });
  model.braces.forEach((brace, index) => register(brace.id, ["braces", index, "id"]));
  model.groups.forEach((group, index) => register(group.id, ["groups", index, "id"]));

  const unitById = new Map(model.units.map((unit) => [unit.id, unit]));
  const quantityById = new Map(model.quantities.map((quantity) => [quantity.id, quantity]));
  const barById = new Map(model.bars.map((bar) => [bar.id, bar]));
  const segmentLocation = new Map<string, { barId: string; index: number }>();
  model.bars.forEach((bar) =>
    bar.segments.forEach((segment, index) => segmentLocation.set(segment.id, { barId: bar.id, index })),
  );
  const rowIndex = new Map(orderBars(model).map((bar, index) => [bar.id, index]));
  const groupOf = new Map<string, string>();

  // Groups.
  model.groups.forEach((group, groupIndex) => {
    group.barIds.forEach((barId, index) => {
      if (!barById.has(barId)) {
        issues.push(issue("dangling_bar_id", ["groups", groupIndex, "barIds", index], `Group references unknown bar "${barId}".`));
        return;
      }
      if (groupOf.has(barId)) {
        issues.push(issue("bar_in_multiple_groups", ["groups", groupIndex, "barIds", index], `Bar "${barId}" is already in group "${groupOf.get(barId)}".`));
      } else {
        groupOf.set(barId, group.id);
      }
    });
    const unitIds = new Set<string>();
    for (const barId of group.barIds) {
      for (const segment of barById.get(barId)?.segments ?? []) {
        if (segment.unitId) unitIds.add(segment.unitId);
      }
    }
    if (unitIds.size > 1) {
      issues.push(
        issue(
          "comparison_unit_mismatch",
          ["groups", groupIndex],
          `Bars in a comparison group share one unit scale, but this group uses ${[...unitIds].sort().join(", ")}.`,
        ),
      );
    }
  });

  // Segment references.
  const referencedUnits = new Set<string>();
  const referencedQuantities = new Set<string>();
  const checkQuantityDisplay = (
    element: { display: string; quantityId?: string },
    quantity: Quantity,
    path: (string | number)[],
  ) => {
    const bad =
      (element.display === "value" && quantity.value === undefined) ||
      (element.display === "unknown" && quantity.unknown === undefined);
    if (bad) {
      issues.push(issue("display_mismatch", [...path, "display"], `Display "${element.display}" does not match quantity "${quantity.id}".`));
    }
  };
  model.bars.forEach((bar, barIndex) => {
    bar.segments.forEach((segment, segmentIndex) => {
      const path = ["bars", barIndex, "segments", segmentIndex];
      if (segment.unitId !== undefined) {
        if (unitById.has(segment.unitId)) referencedUnits.add(segment.unitId);
        else issues.push(issue("dangling_unit_id", [...path, "unitId"], `Segment "${segment.id}" uses undefined unit "${segment.unitId}".`));
      }
      if (segment.quantityId !== undefined) {
        const quantity = quantityById.get(segment.quantityId);
        if (!quantity) {
          issues.push(issue("dangling_quantity_id", [...path, "quantityId"], `Segment "${segment.id}" references undefined quantity "${segment.quantityId}".`));
        } else {
          referencedQuantities.add(quantity.id);
          checkQuantityDisplay(segment, quantity, path);
        }
        if (segment.target) {
          issues.push(issue("target_on_reference", [...path, "target"], "Flag the quantity as the target, not a segment that references it."));
        }
      }
      if (segment.role === "change" && segment.quantityId === undefined) {
        issues.push(issue("change_stored_twice", [...path, "role"], "A change amount is stored once in quantities and referenced by quantityId, not repeated here."));
      }
    });
  });

  // Braces.
  model.braces.forEach((brace, braceIndex) => {
    const path = ["braces", braceIndex];
    if (brace.quantityId !== undefined) {
      const quantity = quantityById.get(brace.quantityId);
      if (!quantity) {
        issues.push(issue("dangling_quantity_id", [...path, "quantityId"], `Brace "${brace.id}" references undefined quantity "${brace.quantityId}".`));
      } else {
        referencedQuantities.add(quantity.id);
        checkQuantityDisplay(brace, quantity, path);
      }
      if (brace.target) {
        issues.push(issue("target_on_reference", [...path, "target"], "Flag the quantity as the target, not a brace that references it."));
      }
    }
    if (brace.role === "change" && brace.quantityId === undefined) {
      issues.push(issue("change_stored_twice", [...path, "role"], "A change amount is stored once in quantities and referenced by quantityId, not repeated here."));
    }

    if (brace.spans) {
      const located = brace.spans.map((id, index) => {
        const location = segmentLocation.get(id);
        if (!location) {
          issues.push(issue("dangling_segment_id", [...path, "spans", index], `Brace "${brace.id}" spans unknown segment "${id}".`));
        }
        return location;
      });
      if (located.every((location) => location !== undefined)) {
        const spans = located as { barId: string; index: number }[];
        if (new Set(spans.map((location) => location.barId)).size > 1) {
          issues.push(issue("brace_spans_multiple_bars", [...path, "spans"], `Brace "${brace.id}" must span segments of a single bar.`));
        } else if (spans.some((location, index) => index > 0 && location.index !== spans[index - 1].index + 1)) {
          issues.push(issue("non_contiguous_brace", [...path, "spans"], `Brace "${brace.id}" must span contiguous segments in order.`));
        }
      }
    }

    if (brace.barIds) {
      const rows = brace.barIds.map((id, index) => {
        if (!barById.has(id)) {
          issues.push(issue("dangling_bar_id", [...path, "barIds", index], `Brace "${brace.id}" spans unknown bar "${id}".`));
        }
        return rowIndex.get(id);
      });
      if (rows.every((row) => row !== undefined)) {
        const numbers = rows as number[];
        if (numbers.some((row, index) => index > 0 && row !== numbers[index - 1] + 1)) {
          issues.push(issue("non_contiguous_brace", [...path, "barIds"], `Brace "${brace.id}" must span bars that sit in adjacent rows, in order.`));
        }
      }
    }

    if (brace.kind === "difference" && brace.longerBarId && brace.shorterBarId) {
      const longer = barById.get(brace.longerBarId);
      const shorter = barById.get(brace.shorterBarId);
      if (!longer) issues.push(issue("dangling_bar_id", [...path, "longerBarId"], `Unknown bar "${brace.longerBarId}".`));
      if (!shorter) issues.push(issue("dangling_bar_id", [...path, "shorterBarId"], `Unknown bar "${brace.shorterBarId}".`));
      if (longer && shorter) {
        if (longer.id === shorter.id) {
          issues.push(issue("difference_same_bar", path, "A difference compares two different bars."));
        } else if (!groupOf.has(longer.id) || groupOf.get(longer.id) !== groupOf.get(shorter.id)) {
          issues.push(issue("difference_bars_ungrouped", path, "Both bars of a difference must be in the same comparison group."));
        }
      }
    }
  });

  // Exactly one target.
  const targets: (string | number)[][] = [];
  model.bars.forEach((bar, barIndex) =>
    bar.segments.forEach((segment, segmentIndex) => {
      if (segment.target) targets.push(["bars", barIndex, "segments", segmentIndex]);
    }),
  );
  model.braces.forEach((brace, index) => {
    if (brace.target) targets.push(["braces", index]);
  });
  model.quantities.forEach((quantity, index) => {
    if (quantity.target) targets.push(["quantities", index]);
  });
  if (targets.length !== 1) {
    issues.push(issue("target_count", targets[1] ?? [], `A bar model has exactly one target; found ${targets.length}.`));
  }

  // Relationships.
  model.relationships.forEach((relationship, index) => {
    const path = ["relationships", index];
    const needBar = (id: string, key: string | number, stage?: "before" | "after") => {
      const bar = barById.get(id);
      if (!bar) {
        issues.push(issue("dangling_bar_id", [...path, key], `Relationship references unknown bar "${id}".`));
        return;
      }
      if (stage && bar.stage !== undefined && bar.stage !== stage) {
        issues.push(issue("relationship_stage_mismatch", [...path, key], `Bar "${id}" has stage "${bar.stage}" but is used as "${stage}".`));
      }
    };
    if (relationship.kind === "equal") {
      relationship.barIds.forEach((id, i) => needBar(id, i));
      return;
    }
    const quantity = quantityById.get(relationship.quantityId);
    if (!quantity) {
      issues.push(issue("dangling_quantity_id", [...path, "quantityId"], `Relationship references undefined quantity "${relationship.quantityId}".`));
    } else {
      referencedQuantities.add(quantity.id);
    }
    if (relationship.kind === "transfer") {
      relationship.beforeBars.forEach((id, i) => needBar(id, `beforeBars.${i}`, "before"));
      relationship.afterBars.forEach((id, i) => needBar(id, `afterBars.${i}`, "after"));
      if (relationship.beforeBars.length !== relationship.afterBars.length) {
        issues.push(issue("relationship_shape", path, "beforeBars and afterBars must list the same number of bars, in matching order."));
      }
      if (relationship.fromBar === relationship.toBar) {
        issues.push(issue("relationship_shape", path, "A transfer needs a different giver and receiver."));
      }
      for (const key of ["fromBar", "toBar"] as const) {
        if (!relationship.beforeBars.includes(relationship[key])) {
          issues.push(issue("relationship_shape", [...path, key], `${key} must be one of beforeBars.`));
        }
      }
    } else {
      needBar(relationship.fromStage, "fromStage", "before");
      needBar(relationship.toStage, "toStage", "after");
    }
  });

  model.units.forEach((unit, index) => {
    if (!referencedUnits.has(unit.id)) {
      issues.push(issue("unused_unit", ["units", index], `Unit "${unit.id}" is never used.`, "warning"));
    }
  });
  model.quantities.forEach((quantity, index) => {
    if (!referencedQuantities.has(quantity.id)) {
      issues.push(issue("unused_quantity", ["quantities", index], `Quantity "${quantity.id}" is never used.`, "warning"));
    }
  });

  return issues;
}

/* ---------------------------------------------------------------- *
 * Mathematical layer
 * ---------------------------------------------------------------- */

const unitVar = (id: string) => `unit:${id}`;
const symbolVar = (symbol: string) => `sym:${symbol}`;

function quantityExpression(quantity: Quantity): LinearExpression {
  return quantity.value !== undefined
    ? constant(rationalFromDecimal(quantity.value))
    : variable(symbolVar(quantity.unknown as string));
}

interface Equations {
  base: LinearExpression[];
  conservation: LinearExpression[];
  targetVariable: string | null;
}

function buildEquations(model: BarModelData): Equations {
  const unitById = new Map(model.units.map((unit) => [unit.id, unit]));
  const quantityById = new Map(model.quantities.map((quantity) => [quantity.id, quantity]));
  const barById = new Map(model.bars.map((bar) => [bar.id, bar]));
  const segmentById = new Map<string, Segment>();
  model.bars.forEach((bar) => bar.segments.forEach((segment) => segmentById.set(segment.id, segment)));

  const segmentExpression = (segment: Segment): LinearExpression => {
    if (segment.value !== undefined) return constant(rationalFromDecimal(segment.value));
    if (segment.units !== undefined && segment.unitId !== undefined) {
      const count = rational(BigInt(segment.units));
      const unit = unitById.get(segment.unitId);
      return unit?.value !== undefined
        ? constant(rationalFromDecimalTimes(unit.value, segment.units))
        : variable(unitVar(segment.unitId), count);
    }
    if (segment.quantityId !== undefined) return quantityExpression(quantityById.get(segment.quantityId) as Quantity);
    return variable(symbolVar(segment.unknown as string));
  };
  const barTotal = (bar: Bar) => sumExpressions(bar.segments.map(segmentExpression));
  const braceExpression = (brace: Brace): LinearExpression => {
    if (brace.value !== undefined) return constant(rationalFromDecimal(brace.value));
    if (brace.quantityId !== undefined) return quantityExpression(quantityById.get(brace.quantityId) as Quantity);
    return variable(symbolVar(brace.unknown as string));
  };

  const base: LinearExpression[] = [];
  const conservation: LinearExpression[] = [];

  // A unit with a given value is pinned: unit = value.
  for (const unit of model.units) {
    if (unit.value !== undefined) {
      base.push(equation(variable(unitVar(unit.id)), constant(rationalFromDecimal(unit.value))));
    }
  }

  for (const brace of model.braces) {
    const own = braceExpression(brace);
    if (brace.kind === "difference") {
      const longer = barById.get(brace.longerBarId as string) as Bar;
      const shorter = barById.get(brace.shorterBarId as string) as Bar;
      base.push(equation(own, combine(barTotal(longer), barTotal(shorter), rational(-BigInt(1)))));
    } else if (brace.spans) {
      base.push(equation(own, sumExpressions(brace.spans.map((id) => segmentExpression(segmentById.get(id) as Segment)))));
    } else if (brace.barIds) {
      base.push(equation(own, sumExpressions(brace.barIds.map((id) => barTotal(barById.get(id) as Bar)))));
    }
  }

  for (const relationship of model.relationships) {
    if (relationship.kind === "equal") {
      const [first, ...rest] = relationship.barIds.map((id) => barTotal(barById.get(id) as Bar));
      rest.forEach((total) => base.push(equation(total, first)));
      continue;
    }
    const change = quantityExpression(quantityById.get(relationship.quantityId) as Quantity);
    if (relationship.kind === "add" || relationship.kind === "remove") {
      const before = barTotal(barById.get(relationship.fromStage) as Bar);
      const after = barTotal(barById.get(relationship.toStage) as Bar);
      const expected = combine(before, change, rational(relationship.kind === "add" ? BigInt(1) : -BigInt(1)));
      base.push(equation(after, expected));
      continue;
    }
    // transfer: the giver drops by the quantity, the receiver gains it, and
    // the combined total is conserved (checked as a separate pass so a break
    // is reported as such rather than as generic contradictory givens).
    const beforeTotals = relationship.beforeBars.map((id) => barTotal(barById.get(id) as Bar));
    const afterTotals = relationship.afterBars.map((id) => barTotal(barById.get(id) as Bar));
    const giver = relationship.beforeBars.indexOf(relationship.fromBar);
    const receiver = relationship.beforeBars.indexOf(relationship.toBar);
    base.push(equation(afterTotals[giver], combine(beforeTotals[giver], change, rational(-BigInt(1)))));
    base.push(equation(afterTotals[receiver], combine(beforeTotals[receiver], change)));
    conservation.push(equation(sumExpressions(beforeTotals), sumExpressions(afterTotals)));
  }

  let targetVariable: string | null = null;
  for (const bar of model.bars) {
    for (const segment of bar.segments) {
      if (segment.target && segment.unknown) targetVariable = symbolVar(segment.unknown);
    }
  }
  for (const brace of model.braces) {
    if (brace.target && brace.unknown) targetVariable = symbolVar(brace.unknown);
  }
  for (const quantity of model.quantities) {
    if (quantity.target && quantity.unknown) targetVariable = symbolVar(quantity.unknown);
  }
  return { base, conservation, targetVariable };
}

function rationalFromDecimalTimes(value: number, count: number): Rational {
  const decimal = rationalFromDecimal(value);
  return rational(decimal.n * BigInt(count), decimal.d);
}

/** Every given number the child can see, as exact rationals. */
function displayedGivens(model: BarModelData): Rational[] {
  const givens: Rational[] = [];
  const push = (value: number | undefined, display: string) => {
    if (value !== undefined && display === "value") givens.push(rationalFromDecimal(value));
  };
  model.bars.forEach((bar) => bar.segments.forEach((segment) => push(segment.value, segment.display)));
  model.braces.forEach((brace) => push(brace.value, brace.display));
  model.quantities.forEach((quantity) => push(quantity.value, quantity.display));
  model.units.forEach((unit) => push(unit.value, "value"));
  return givens;
}

interface TextSource {
  text: string;
  path: (string | number)[];
  isIdentifier: boolean;
}

function descriptiveText(model: BarModelData, context: BarModelTextContext): TextSource[] {
  const sources: TextSource[] = [];
  const add = (text: string | undefined, path: (string | number)[], isIdentifier = false) => {
    if (text) sources.push({ text, path, isIdentifier });
  };
  add(context.visualId, ["id"], true);
  add(context.title, ["title"]);
  add(context.caption, ["caption"]);
  add(context.altText, ["altText"]);
  model.units.forEach((unit, i) => {
    add(unit.id, ["data", "units", i, "id"], true);
    add(unit.label, ["data", "units", i, "label"]);
  });
  model.quantities.forEach((quantity, i) => {
    add(quantity.id, ["data", "quantities", i, "id"], true);
    add(quantity.label, ["data", "quantities", i, "label"]);
  });
  model.bars.forEach((bar, i) => {
    add(bar.id, ["data", "bars", i, "id"], true);
    add(bar.label, ["data", "bars", i, "label"]);
    bar.segments.forEach((segment, j) => {
      add(segment.id, ["data", "bars", i, "segments", j, "id"], true);
      add(segment.label, ["data", "bars", i, "segments", j, "label"]);
    });
  });
  model.braces.forEach((brace, i) => {
    add(brace.id, ["data", "braces", i, "id"], true);
    add(brace.label, ["data", "braces", i, "label"]);
  });
  model.groups.forEach((group, i) => add(group.id, ["data", "groups", i, "id"], true));
  return sources;
}

/** Numeric tokens in a piece of text, as exact rationals. */
function numericTokens(source: TextSource): Rational[] {
  const tokens: string[] = source.isIdentifier
    ? source.text.split(/[-_]/).filter((part) => /^\d+$/.test(part))
    : (source.text.replace(/(\d),(?=\d{3}(?!\d))/g, "$1").match(/\d+\/\d+|\d+(?:\.\d+)?/g) ?? []);
  const values: Rational[] = [];
  for (const token of tokens) {
    if (token.includes("/")) {
      const [top, bottom] = token.split("/");
      if (BigInt(bottom) !== BigInt(0)) values.push(rational(BigInt(top), BigInt(bottom)));
    } else {
      values.push(rationalFromDecimal(token));
    }
  }
  return values;
}

function collectVariables(equations: readonly LinearExpression[], extra: string | null): string[] {
  const names = new Set<string>();
  equations.forEach((expression) => expression.terms.forEach((_, name) => names.add(name)));
  if (extra) names.add(extra);
  return [...names].sort();
}

const emptySolution = (issues: BarModelIssue[], conservationChecks = 0): BarModelSolution => ({
  ok: !issues.some((entry) => entry.severity === "error"),
  target: null,
  isWhole: false,
  issues,
  conservationChecks,
});

/**
 * Validate the structure, then solve the model exactly. Returns the target
 * as numerator/denominator strings - the building block for code-checked
 * answers in later phases. Pass the visual's descriptive fields as `context`
 * to enable the answer-disclosure check.
 */
export function solveBarModel(model: BarModelData, context: BarModelTextContext = {}): BarModelSolution {
  const structural = validateBarModelStructure(model);
  if (structural.some((entry) => entry.severity === "error")) {
    return emptySolution(structural);
  }
  const issues = [...structural];

  const { base, conservation, targetVariable } = buildEquations(model);
  const variables = collectVariables([...base, ...conservation], targetVariable);
  const everything = [...base, ...conservation];

  const firstPass = solveLinearSystem(variables, base);
  if (!firstPass.consistent) {
    issues.push(issue("contradictory_givens", [], "The givens contradict each other: no values satisfy every relationship."));
    return emptySolution(issues);
  }
  const solved = solveLinearSystem(variables, everything);
  if (!solved.consistent) {
    issues.push(issue("transfer_breaks_conservation", ["relationships"], "A transfer must conserve the combined total, but the before and after totals cannot match."));
    return emptySolution(issues, conservation.length);
  }

  // Feasibility: every quantity the equations pin down must be non-negative.
  for (const [name, value] of solved.determined) {
    if (isNegative(value)) {
      issues.push(issue("infeasible_negative", [], `${name.replace(/^(unit|sym):/, "")} would have to be ${formatRational(value)}, which is negative.`));
    }
  }

  const target = targetVariable ? solved.determined.get(targetVariable) : undefined;
  if (target === undefined) {
    issues.push(issue("target_not_unique", [], "The givens do not determine the target to a single value."));
    return emptySolution(issues, conservation.length);
  }
  if (issues.some((entry) => entry.severity === "error")) {
    return emptySolution(issues, conservation.length);
  }

  if (!isWhole(target)) {
    issues.push(issue("fractional_target", [], `The target is ${formatRational(target)}, not a whole number.`, "warning"));
  }

  const equalsGiven = displayedGivens(model).some((given) => equals(given, target));
  if (equalsGiven) {
    issues.push(issue("answer_equals_given", [], "The target equals a number displayed as a given. Acknowledge this in the private review note, not in the learner JSON.", "warning"));
  }
  const decimal = terminatingDecimal(target);
  for (const source of descriptiveText(model, context)) {
    if (numericTokens(source).some((token) => equals(token, target))) {
      if (!equalsGiven) {
        issues.push(issue("answer_leak", source.path, `The answer (${decimal ?? formatRational(target)}) appears in ${source.path.join(".")}.`));
      }
    }
  }

  const solution: BarModelSolution = {
    ok: !issues.some((entry) => entry.severity === "error"),
    target: toRationalString(target),
    isWhole: isWhole(target),
    issues,
    conservationChecks: conservation.length,
  };
  return solution;
}
