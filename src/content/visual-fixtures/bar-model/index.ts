/**
 * Bar-model fixtures (Phase 1). Worked examples and negative cases for the
 * schema, validators and renderer. NOT imported by any question bank, lesson
 * or catalogue: nothing here reaches a child.
 *
 * All contexts are original and in Australian English.
 */
import type { BarModelLayer } from "@/features/visuals/bar-model/validate";

import mathAnswerLeak from "./invalid/math-answer-leak-in-alt-text.json";
import mathContradiction from "./invalid/math-contradictory-givens.json";
import mathInfeasible from "./invalid/math-infeasible-negative.json";
import mathNotUnique from "./invalid/math-target-not-unique.json";
import mathConservation from "./invalid/math-transfer-breaks-conservation.json";
import schemaBlank from "./invalid/schema-blank-with-value.json";
import schemaMissingAlt from "./invalid/schema-missing-alt-text.json";
import schemaUnitsBounds from "./invalid/schema-units-out-of-bounds.json";
import structChange from "./invalid/structural-change-stored-twice.json";
import structUnitScale from "./invalid/structural-comparison-unit-mismatch.json";
import structDanglingQuantity from "./invalid/structural-dangling-quantity-id.json";
import structDanglingUnit from "./invalid/structural-dangling-unit-id.json";
import structUngrouped from "./invalid/structural-difference-ungrouped.json";
import structDuplicate from "./invalid/structural-duplicate-id.json";
import structNonContiguous from "./invalid/structural-non-contiguous-brace.json";
import structNoTarget from "./invalid/structural-no-target.json";
import structTwoTargets from "./invalid/structural-two-targets.json";
import y3Comparison from "./valid/y3-comparison.json";
import y3PartWhole from "./valid/y3-part-whole.json";
import y3TimesAsMany from "./valid/y3-times-as-many.json";
import y5BeforeAfter from "./valid/y5-before-after.json";
import y5EqualUnits from "./valid/y5-equal-units.json";
import y5Transfer from "./valid/y5-transfer.json";
import answerEqualsGiven from "./warning/answer-equals-given.json";
import fractionTarget from "./warning/fraction-target.json";

export interface RationalFixtureTarget {
  numerator: string;
  denominator: string;
}

export interface ValidBarModelFixture {
  name: string;
  yearLevel: 3 | 5;
  visual: unknown;
  /** The exact target the solver must produce. */
  target: RationalFixtureTarget;
  warningCodes: readonly string[];
}

export interface InvalidBarModelFixture {
  name: string;
  /** The single layer that must reject this input. */
  layer: BarModelLayer;
  errorCodes: readonly string[];
  why: string;
  visual: unknown;
}

const whole = (value: number): RationalFixtureTarget => ({ numerator: String(value), denominator: "1" });

export const validBarModelFixtures: readonly ValidBarModelFixture[] = [
  { name: "y3-part-whole", yearLevel: 3, visual: y3PartWhole, target: whole(27), warningCodes: [] },
  { name: "y3-comparison", yearLevel: 3, visual: y3Comparison, target: whole(13), warningCodes: [] },
  { name: "y3-times-as-many", yearLevel: 3, visual: y3TimesAsMany, target: whole(18), warningCodes: [] },
  { name: "y5-equal-units", yearLevel: 5, visual: y5EqualUnits, target: whole(40), warningCodes: [] },
  { name: "y5-before-after", yearLevel: 5, visual: y5BeforeAfter, target: whole(47), warningCodes: [] },
  { name: "y5-transfer", yearLevel: 5, visual: y5Transfer, target: whole(16), warningCodes: [] },
];

/** Valid, but the validator raises a warning an author must acknowledge. */
export const warningBarModelFixtures: readonly ValidBarModelFixture[] = [
  {
    name: "fraction-target",
    yearLevel: 5,
    visual: fractionTarget,
    target: { numerator: "9", denominator: "2" },
    warningCodes: ["fractional_target"],
  },
  {
    name: "answer-equals-given",
    yearLevel: 3,
    visual: answerEqualsGiven,
    target: whole(18),
    warningCodes: ["answer_equals_given"],
  },
];

interface InvalidJson {
  why: string;
  layer: string;
  errorCodes: string[];
  visual: unknown;
}

const invalid = (name: string, json: InvalidJson): InvalidBarModelFixture => ({
  name,
  layer: json.layer as BarModelLayer,
  errorCodes: json.errorCodes,
  why: json.why,
  visual: json.visual,
});

export const invalidBarModelFixtures: readonly InvalidBarModelFixture[] = [
  invalid("schema-blank-with-value", schemaBlank),
  invalid("schema-missing-alt-text", schemaMissingAlt),
  invalid("schema-units-out-of-bounds", schemaUnitsBounds),
  invalid("structural-duplicate-id", structDuplicate),
  invalid("structural-dangling-unit-id", structDanglingUnit),
  invalid("structural-dangling-quantity-id", structDanglingQuantity),
  invalid("structural-non-contiguous-brace", structNonContiguous),
  invalid("structural-no-target", structNoTarget),
  invalid("structural-two-targets", structTwoTargets),
  invalid("structural-change-stored-twice", structChange),
  invalid("structural-comparison-unit-mismatch", structUnitScale),
  invalid("structural-difference-ungrouped", structUngrouped),
  invalid("math-contradictory-givens", mathContradiction),
  invalid("math-target-not-unique", mathNotUnique),
  invalid("math-transfer-breaks-conservation", mathConservation),
  invalid("math-infeasible-negative", mathInfeasible),
  invalid("math-answer-leak-in-alt-text", mathAnswerLeak),
];
