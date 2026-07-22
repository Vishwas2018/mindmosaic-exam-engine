/**
 * Multi-step declared-solution verification (Approach A —
 * `docs/reports/correctness-multistep-design.md` §3). The generator
 * declares its own step-by-step working as structured data
 * (`DeclaredWorkingSolution`, candidate-only — never the production
 * schema); this module mechanically re-executes it and never trusts the
 * generator's own claimed per-step *results*, only its claimed *quantities
 * and operation sequence*. Every quantity a step operates on must trace
 * ("ground") to either a `promptQuantities` entry independently confirmed to
 * appear in the prompt/visual data, or a live read of an existing visual, or
 * an already-recomputed earlier step's own output — a bare, untraceable
 * literal operand is not a representable shape at all (see
 * `ingestion/candidate-question.ts`'s `operandRefSchema`), so the one
 * failure mode that would let a generator "prove" a fabricated answer is
 * structurally unrepresentable rather than merely checked for.
 *
 * A candidate with no `workingSteps` is `not_applicable` (falls through to
 * whichever method the dispatcher tries next, exactly like every other
 * method). A `workingSteps`-bearing candidate that cannot be fully resolved
 * — an ungrounded operand, an invalid step reference, an unsupported unit
 * conversion, a resource-limit breach — is a terminal `cannot_derive`,
 * never a fallback guess. Every step re-executes exclusively on
 * `numeric.ts`'s exact `Fraction` primitives: no floats, no `toFixed()`,
 * anywhere in this module.
 */
import type { Question } from "@/schemas/question.schema";

import { CORRECTNESS_LIMITS } from "../config";
import type { DeclaredWorkingSolution, OperandRef, PromptQuantity } from "../ingestion/candidate-question";
import type { DerivationFailure, DerivationIssueCode, DerivationOutcome, DerivationSuccess } from "./derive-answer";
import type { DerivedValue } from "./derived-value";
import { deriveRectangleMeasures } from "./measurement";
import {
  addFractions,
  dollarsToCents,
  divideFractions,
  type Fraction,
  fractionFromCents,
  fractionFromDecimalString,
  fractionFromFiniteNumber,
  fractionsEqual,
  fractionToDisplayString,
  multiplyFractions,
  NumericDerivationError,
  subtractFractions,
} from "./numeric";
import { promptTokens } from "./prompt-tokens";
import { convertUnit } from "./unit-conversion";
import { labelledValuesOf, tableCellByRowLabel, validateTableShape } from "./visual-lookup";

const NOT_APPLICABLE: DerivationFailure = { ok: false, reason: "not_applicable" };

function success(category: string, value: DerivedValue, representation: string): DerivationSuccess {
  return { ok: true, category, value, representation };
}

function cannotDerive(issueCode: DerivationIssueCode, message: string): DerivationFailure {
  return { ok: false, reason: "cannot_derive", issueCode, message };
}

interface ResolvedOperand {
  readonly fraction: Fraction;
  /** Undefined when the source (a step_output, a table cell, or a derived perimeter/area) carries no known unit to convert from. */
  readonly unit?: string;
}

type ResolveOutcome = { readonly ok: true; readonly value: ResolvedOperand } | { readonly ok: false; readonly failure: DerivationFailure };

/** "$12.50" (money.ts's exact cents pipeline) or a bare exact decimal/integer — never a float parse of either. */
function parseQuantityText(text: string): Fraction {
  const trimmed = text.trim();
  if (trimmed.startsWith("$")) {
    return fractionFromCents(dollarsToCents(trimmed));
  }
  return fractionFromDecimalString(trimmed);
}

function findDuplicate(ids: readonly string[]): string | undefined {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) return id;
    seen.add(id);
  }
  return undefined;
}

/** Whole-word match of the quantity's own declared text against the prompt — reuses `derive-answer.ts`'s tokeniser rather than a second one. */
function isGroundedInPrompt(quantityText: string, prompt: string): boolean {
  const numericPart = quantityText.trim().replace(/^\$/, "").toLocaleLowerCase("en-AU");
  return new Set(promptTokens(prompt)).has(numericPart);
}

/**
 * Every numeric value independently readable off the question's own
 * structured visual data — table cells, geometry-shape measurements (plus
 * their derived perimeter/area), and chart label/value pairs — used as the
 * second grounding path for a declared `promptQuantities` entry that isn't
 * stated in prose. Un-parseable string cells (row labels, item names) are
 * silently skipped, never treated as a grounding failure in themselves.
 */
function collectVisualNumericFractions(question: Question): readonly Fraction[] {
  const values: Fraction[] = [];
  for (const visual of question.visuals) {
    if (visual.type === "table") {
      for (const row of visual.data.rows) {
        for (const cell of row) {
          if (typeof cell === "number") {
            values.push(fractionFromFiniteNumber(cell));
          } else {
            try {
              values.push(parseQuantityText(cell));
            } catch {
              // Not a numeric/currency cell (e.g. a row label) — not a grounding candidate.
            }
          }
        }
      }
    } else if (visual.type === "geometry_shape") {
      for (const measurement of visual.data.measurements) {
        values.push(fractionFromFiniteNumber(measurement.value));
      }
      const measures = deriveRectangleMeasures(visual);
      if (measures) values.push(measures.perimeter, measures.area);
    } else {
      const labelled = labelledValuesOf(visual);
      if (labelled) {
        for (const entry of labelled) values.push(fractionFromFiniteNumber(entry.value));
      }
    }
  }
  return values;
}

function isGrounded(quantityText: string, fraction: Fraction, question: Question): boolean {
  if (isGroundedInPrompt(quantityText, question.prompt)) return true;
  return collectVisualNumericFractions(question).some((value) => fractionsEqual(value, fraction));
}

type PromptQuantityMap = ReadonlyMap<string, ResolvedOperand>;

/**
 * Resolves and grounding-checks every declared `promptQuantities` entry
 * before any step executes (design §3.3): each entry's value must parse as
 * an exact quantity *and* independently trace to the prompt text or a
 * visual's own data. A parse failure or an untraceable value is a terminal
 * `multistep_operand_ungrounded` failure — never a partial table with the
 * bad entry silently dropped.
 */
function resolvePromptQuantities(
  entries: readonly PromptQuantity[],
  question: Question,
): { readonly ok: true; readonly map: PromptQuantityMap } | { readonly ok: false; readonly failure: DerivationFailure } {
  const map = new Map<string, ResolvedOperand>();
  for (const entry of entries) {
    let fraction: Fraction;
    try {
      fraction = parseQuantityText(entry.value);
    } catch (error) {
      if (error instanceof NumericDerivationError) {
        return {
          ok: false,
          failure: cannotDerive(
            "multistep_operand_ungrounded",
            `Declared prompt quantity '${entry.id}' (value '${entry.value}') could not be parsed as an exact quantity.`,
          ),
        };
      }
      throw error;
    }
    if (!isGrounded(entry.value, fraction, question)) {
      return {
        ok: false,
        failure: cannotDerive(
          "multistep_operand_ungrounded",
          `Declared prompt quantity '${entry.id}' (value '${entry.value}') does not trace to any value stated in the prompt or its visuals.`,
        ),
      };
    }
    map.set(entry.id, { fraction, unit: entry.unit });
  }
  return { ok: true, map };
}

/**
 * A `visual` operand's `field` for a `table` visual is `"<rowLabel>|<columnHeader>"`,
 * resolved via the same `tableCellByRowLabel` every other table-reading
 * method already uses — so a multi-step table lookup has exactly the same
 * duplicate-header/duplicate-row-label/ambiguity handling as
 * `attemptTableLookup`. For a `geometry_shape` visual, `field` is either a
 * raw measurement label (`"length"`, `"width"`, `"side"`) or a derived
 * `"perimeter"`/`"area"`, via `deriveRectangleMeasures` — never
 * reimplemented. No other visual type is supported as a step operand
 * source.
 */
function resolveVisualOperand(question: Question, visualId: string, field: string): ResolveOutcome {
  const visual = question.visuals.find((candidate) => candidate.id === visualId);
  if (!visual) {
    return { ok: false, failure: cannotDerive("multistep_operand_ungrounded", `No visual with id '${visualId}' exists on this question.`) };
  }

  if (visual.type === "table") {
    const separatorIndex = field.indexOf("|");
    if (separatorIndex === -1) {
      return {
        ok: false,
        failure: cannotDerive(
          "multistep_operand_ungrounded",
          `Table operand field '${field}' on visual '${visualId}' must be of the form '<rowLabel>|<columnHeader>'.`,
        ),
      };
    }
    const rowLabel = field.slice(0, separatorIndex);
    const columnHeader = field.slice(separatorIndex + 1);
    const shapeIssue = validateTableShape(visual);
    if (shapeIssue !== undefined) {
      return {
        ok: false,
        failure: cannotDerive(
          "multistep_operand_ungrounded",
          `Table '${visualId}' has an ambiguous shape (${shapeIssue.kind}: ${shapeIssue.detail}), so its cells cannot be safely read.`,
        ),
      };
    }
    const cell = tableCellByRowLabel(visual, rowLabel, columnHeader);
    if (cell === undefined) {
      return {
        ok: false,
        failure: cannotDerive(
          "multistep_operand_ungrounded",
          `Could not resolve a unique cell at row '${rowLabel}', column '${columnHeader}' in table '${visualId}'.`,
        ),
      };
    }
    try {
      const fraction = typeof cell === "number" ? fractionFromFiniteNumber(cell) : parseQuantityText(cell);
      return { ok: true, value: { fraction } };
    } catch (error) {
      if (error instanceof NumericDerivationError) {
        return {
          ok: false,
          failure: cannotDerive(
            "multistep_operand_ungrounded",
            `Cell at row '${rowLabel}', column '${columnHeader}' in table '${visualId}' is not an exact numeric/currency value.`,
          ),
        };
      }
      throw error;
    }
  }

  if (visual.type === "geometry_shape") {
    if (field === "perimeter" || field === "area") {
      const measures = deriveRectangleMeasures(visual);
      if (!measures) {
        return {
          ok: false,
          failure: cannotDerive(
            "multistep_operand_ungrounded",
            `Could not derive '${field}' for geometry shape '${visualId}' (unsupported shape or missing measurements).`,
          ),
        };
      }
      return { ok: true, value: { fraction: field === "perimeter" ? measures.perimeter : measures.area } };
    }
    const target = field.trim().toLocaleLowerCase("en-AU");
    const measurement = visual.data.measurements.find((entry) => entry.label.trim().toLocaleLowerCase("en-AU") === target);
    if (!measurement) {
      return {
        ok: false,
        failure: cannotDerive("multistep_operand_ungrounded", `Geometry shape '${visualId}' has no measurement labelled '${field}'.`),
      };
    }
    return { ok: true, value: { fraction: fractionFromFiniteNumber(measurement.value), unit: measurement.unit } };
  }

  return {
    ok: false,
    failure: cannotDerive("multistep_operand_ungrounded", `Visual '${visualId}' of type '${visual.type}' is not a supported multi-step operand source.`),
  };
}

function resolveOperand(
  ref: OperandRef,
  currentIndex: number,
  promptQuantities: PromptQuantityMap,
  stepResults: ReadonlyMap<number, Fraction>,
  question: Question,
): ResolveOutcome {
  if (ref.source === "prompt_quantity") {
    const resolved = promptQuantities.get(ref.quantityId);
    if (!resolved) {
      return {
        ok: false,
        failure: cannotDerive("multistep_operand_ungrounded", `Step ${currentIndex} references undeclared prompt quantity '${ref.quantityId}'.`),
      };
    }
    return { ok: true, value: resolved };
  }

  if (ref.source === "visual") {
    return resolveVisualOperand(question, ref.visualId, ref.field);
  }

  // ref.source === "step_output" — grounded by construction (it is the
  // verifier's own prior computation); only its index ordering needs
  // checking (design §3.3).
  if (ref.stepIndex >= currentIndex) {
    return {
      ok: false,
      failure: cannotDerive(
        "multistep_step_reference_invalid",
        `Step ${currentIndex} references step_output ${ref.stepIndex}, which is not strictly before it.`,
      ),
    };
  }
  const priorResult = stepResults.get(ref.stepIndex);
  if (priorResult === undefined) {
    return {
      ok: false,
      failure: cannotDerive("multistep_step_reference_invalid", `Step ${currentIndex} references step_output ${ref.stepIndex}, which was never computed.`),
    };
  }
  return { ok: true, value: { fraction: priorResult } };
}

function mapArithmeticError(error: NumericDerivationError): DerivationFailure {
  if (error.code === "division_by_zero") return cannotDerive("division_by_zero", error.message);
  return cannotDerive("numeric_overflow", error.message);
}

/**
 * Re-executes a candidate's declared `workingSteps` and produces the final
 * step's value as a `DerivedValue`, or a terminal failure. `not_applicable`
 * when no `workingSteps` is declared at all, so this method is purely
 * additive — a candidate without it falls through to whatever the
 * dispatcher tries next, exactly as if this method did not exist.
 */
export function attemptMultistep(question: Question, workingSteps?: DeclaredWorkingSolution): DerivationOutcome {
  if (!workingSteps) return NOT_APPLICABLE;

  if (workingSteps.promptQuantities.length > CORRECTNESS_LIMITS.MULTISTEP_MAX_PROMPT_QUANTITIES) {
    return cannotDerive(
      "multistep_resource_limit_exceeded",
      `Declared solution has ${workingSteps.promptQuantities.length} prompt quantities, exceeding the supported limit of ${CORRECTNESS_LIMITS.MULTISTEP_MAX_PROMPT_QUANTITIES}.`,
    );
  }
  if (workingSteps.steps.length > CORRECTNESS_LIMITS.MULTISTEP_MAX_STEPS) {
    return cannotDerive(
      "multistep_resource_limit_exceeded",
      `Declared solution has ${workingSteps.steps.length} steps, exceeding the supported limit of ${CORRECTNESS_LIMITS.MULTISTEP_MAX_STEPS}.`,
    );
  }

  const duplicateQuantityId = findDuplicate(workingSteps.promptQuantities.map((entry) => entry.id));
  if (duplicateQuantityId !== undefined) {
    return cannotDerive("multistep_step_reference_invalid", `Declared prompt quantity id '${duplicateQuantityId}' is declared more than once.`);
  }

  const orderedSteps = [...workingSteps.steps].sort((a, b) => a.index - b.index);
  for (let position = 0; position < orderedSteps.length; position += 1) {
    if (orderedSteps[position].index !== position) {
      return cannotDerive(
        "multistep_step_reference_invalid",
        `Declared steps must have strictly sequential, gap-free indices starting at 0; found index ${orderedSteps[position].index} at position ${position}.`,
      );
    }
  }

  const quantitiesOutcome = resolvePromptQuantities(workingSteps.promptQuantities, question);
  if (!quantitiesOutcome.ok) return quantitiesOutcome.failure;

  const stepResults = new Map<number, Fraction>();
  let finalResult: Fraction | undefined;

  for (const step of orderedSteps) {
    if (step.operation === "convert_unit") {
      if (step.operands.length !== 1 || step.targetUnit === undefined) {
        return cannotDerive("multistep_step_reference_invalid", `Step ${step.index} ('convert_unit') must declare exactly one operand and a targetUnit.`);
      }
      const operandOutcome = resolveOperand(step.operands[0], step.index, quantitiesOutcome.map, stepResults, question);
      if (!operandOutcome.ok) return operandOutcome.failure;
      if (operandOutcome.value.unit === undefined) {
        return cannotDerive(
          "multistep_unit_conversion_unsupported",
          `Step ${step.index} ('convert_unit') operand has no declared source unit to convert from.`,
        );
      }
      const converted = convertUnit(operandOutcome.value.fraction, operandOutcome.value.unit, step.targetUnit);
      if (converted === undefined) {
        return cannotDerive(
          "multistep_unit_conversion_unsupported",
          `Step ${step.index} requests converting from '${operandOutcome.value.unit}' to '${step.targetUnit}', which is outside the supported unit set.`,
        );
      }
      stepResults.set(step.index, converted);
      finalResult = converted;
      continue;
    }

    if (step.operands.length !== 2) {
      return cannotDerive("multistep_step_reference_invalid", `Step ${step.index} ('${step.operation}') must declare exactly two operands.`);
    }
    const leftOutcome = resolveOperand(step.operands[0], step.index, quantitiesOutcome.map, stepResults, question);
    if (!leftOutcome.ok) return leftOutcome.failure;
    const rightOutcome = resolveOperand(step.operands[1], step.index, quantitiesOutcome.map, stepResults, question);
    if (!rightOutcome.ok) return rightOutcome.failure;

    try {
      const left = leftOutcome.value.fraction;
      const right = rightOutcome.value.fraction;
      const result =
        step.operation === "add"
          ? addFractions(left, right)
          : step.operation === "subtract"
            ? subtractFractions(left, right)
            : step.operation === "multiply"
              ? multiplyFractions(left, right)
              : divideFractions(left, right);
      stepResults.set(step.index, result);
      finalResult = result;
    } catch (error) {
      if (error instanceof NumericDerivationError) return mapArithmeticError(error);
      throw error;
    }
  }

  // Unreachable: `steps` is schema-bounded to at least one entry (see
  // `declaredWorkingSolutionSchema`), so the loop above always runs at
  // least once and always sets `finalResult`.
  if (finalResult === undefined) {
    return cannotDerive("multistep_step_reference_invalid", "Declared solution produced no final step result.");
  }

  return success("multistep_declared_solution", { kind: "number", value: finalResult }, fractionToDisplayString(finalResult));
}
