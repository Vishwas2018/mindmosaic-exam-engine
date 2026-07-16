import { questionRendererRegistry } from "@/features/exam-engine/question-renderers/question-renderer-registry";
import { examStyleSchema, questionMetadataSchema, yearLevelSchema } from "@/schemas/question.schema";

import { toNumericYearLevel, type Blueprint } from "../blueprints";
import { skillTaxonomyRegistry } from "../taxonomy";

const subjectSchema = questionMetadataSchema.shape.subject;

/**
 * The immutable blueprint-bound dimensions a revision must not drift on.
 * Deliberately narrow — the same five dimensions the Mission 3C audit
 * requires (cohort/year, subject, exam style, skill, question type) — never
 * a wholesale re-check of every blueprint field (marks, targetCount,
 * constraints, etc. remain structural validation's concern, not this
 * identity-adjacent gate's).
 */
export type RevisionBlueprintDimension =
  | "yearLevel"
  | "subject"
  | "examStyle"
  | "skill"
  | "questionType";

/**
 * Why a given dimension failed to compare cleanly, so a caller (and the
 * rejection message) can distinguish "you didn't declare this at all" from
 * "you declared it, but not usably" from "it's a real value, just not the
 * one this blueprint requires" — all four collapse to the same
 * `revision_blueprint_mismatch` issue code, but the diagnostic should not
 * blur them into one indistinguishable string.
 */
export type RevisionBlueprintMismatchReason =
  | "missing"
  | "invalid_type"
  | "invalid_value"
  | "incompatible";

export interface RevisionBlueprintMismatch {
  readonly field: RevisionBlueprintDimension;
  readonly reason: RevisionBlueprintMismatchReason;
  readonly expected: string;
  readonly actual: string;
}

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Safe, bounded, stack-trace-free rendering of an arbitrary runtime value for a diagnostic message — never throws, never leaks more than a short preview. */
function describeRuntimeType(value: unknown): string {
  if (Array.isArray(value)) return "array";
  return typeof value;
}

const MAX_DESCRIBED_VALUE_LENGTH = 80;

function describeRuntimeValue(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.length > MAX_DESCRIBED_VALUE_LENGTH ? `${value.slice(0, MAX_DESCRIBED_VALUE_LENGTH)}…` : value;
    return `"${trimmed}"`;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    const serialised = JSON.stringify(value);
    if (serialised === undefined) return describeRuntimeType(value);
    return serialised.length > MAX_DESCRIBED_VALUE_LENGTH
      ? `${serialised.slice(0, MAX_DESCRIBED_VALUE_LENGTH)}…`
      : serialised;
  } catch {
    return `an unserialisable ${describeRuntimeType(value)}`;
  }
}

/**
 * Resolves a declared skill id/alias to its canonical taxonomy id via the
 * same registry `checkTaxonomy` already uses (`skillTaxonomyRegistry.resolve`,
 * id-or-declared-alias only, never fuzzy matching) — so a revision that
 * declares the parent blueprint's skill via one of its own declared aliases
 * is not flagged as drift, while an unresolvable or genuinely different
 * skill is compared literally against the blueprint's own id.
 */
function resolveSkillId(declaredSkill: string): string | undefined {
  const entry = skillTaxonomyRegistry.resolve(declaredSkill);
  return entry?.id;
}

function checkYearLevel(record: Record<string, unknown>, blueprint: Blueprint): RevisionBlueprintMismatch | undefined {
  const expectedYearLevel = toNumericYearLevel(blueprint.yearLevel);
  const expected = `comparable year ${expectedYearLevel}`;
  const value = record.yearLevel;

  if (value === undefined || value === null) {
    return { field: "yearLevel", reason: "missing", expected, actual: "missing" };
  }
  if (typeof value !== "number") {
    return { field: "yearLevel", reason: "invalid_type", expected: "a finite number", actual: `invalid type ${describeRuntimeType(value)}` };
  }
  if (!Number.isFinite(value)) {
    return { field: "yearLevel", reason: "invalid_value", expected, actual: `a non-finite number (${String(value)})` };
  }
  if (!yearLevelSchema.safeParse(value).success) {
    return { field: "yearLevel", reason: "invalid_value", expected, actual: `unsupported year ${value}` };
  }
  if (value !== expectedYearLevel) {
    return { field: "yearLevel", reason: "incompatible", expected, actual: `year ${value}` };
  }
  return undefined;
}

function checkSubject(metadata: Record<string, unknown>, blueprint: Blueprint): RevisionBlueprintMismatch | undefined {
  const expected = `"${blueprint.subject}"`;
  const value = metadata.subject;

  if (value === undefined || value === null) {
    return { field: "subject", reason: "missing", expected, actual: "missing" };
  }
  if (typeof value !== "string") {
    return { field: "subject", reason: "invalid_type", expected, actual: `invalid type ${describeRuntimeType(value)}` };
  }
  if (value.trim().length === 0) {
    return { field: "subject", reason: "invalid_value", expected, actual: "an empty string" };
  }
  if (!subjectSchema.safeParse(value).success) {
    return { field: "subject", reason: "invalid_value", expected, actual: `unknown subject ${describeRuntimeValue(value)}` };
  }
  if (value !== blueprint.subject) {
    return { field: "subject", reason: "incompatible", expected, actual: describeRuntimeValue(value) };
  }
  return undefined;
}

function checkExamStyle(record: Record<string, unknown>, blueprint: Blueprint): RevisionBlueprintMismatch | undefined {
  const expected = `"${blueprint.examStyle}"`;
  const value = record.examStyle;

  if (value === undefined || value === null) {
    return { field: "examStyle", reason: "missing", expected, actual: "missing" };
  }
  if (typeof value !== "string") {
    return { field: "examStyle", reason: "invalid_type", expected, actual: `invalid type ${describeRuntimeType(value)}` };
  }
  if (value.trim().length === 0) {
    return { field: "examStyle", reason: "invalid_value", expected, actual: "an empty string" };
  }
  if (!examStyleSchema.safeParse(value).success) {
    return { field: "examStyle", reason: "invalid_value", expected, actual: `unknown exam style ${describeRuntimeValue(value)}` };
  }
  if (value !== blueprint.examStyle) {
    return { field: "examStyle", reason: "incompatible", expected, actual: describeRuntimeValue(value) };
  }
  return undefined;
}

function checkSkill(metadata: Record<string, unknown>, blueprint: Blueprint): RevisionBlueprintMismatch | undefined {
  const expected = `registered compatible skill "${blueprint.skill}"`;
  const value = metadata.skill;

  if (value === undefined || value === null) {
    return { field: "skill", reason: "missing", expected, actual: "missing" };
  }
  if (typeof value !== "string") {
    return { field: "skill", reason: "invalid_type", expected, actual: `invalid type ${describeRuntimeType(value)}` };
  }
  if (value.trim().length === 0) {
    return { field: "skill", reason: "invalid_value", expected, actual: "an empty or whitespace-only string" };
  }
  const resolvedSkillId = resolveSkillId(value);
  if (resolvedSkillId === undefined) {
    return { field: "skill", reason: "invalid_value", expected, actual: `unresolved ${describeRuntimeValue(value)}` };
  }
  if (resolvedSkillId !== blueprint.skill) {
    return {
      field: "skill",
      reason: "incompatible",
      expected,
      actual: `resolved skill "${resolvedSkillId}" (declared ${describeRuntimeValue(value)})`,
    };
  }
  return undefined;
}

function checkQuestionType(record: Record<string, unknown>, blueprint: Blueprint): RevisionBlueprintMismatch | undefined {
  const expected = `"${blueprint.questionType}"`;
  const value = record.type;

  if (value === undefined || value === null) {
    return { field: "questionType", reason: "missing", expected, actual: "missing" };
  }
  if (typeof value !== "string") {
    return { field: "questionType", reason: "invalid_type", expected, actual: `invalid type ${describeRuntimeType(value)}` };
  }
  if (value.trim().length === 0) {
    return { field: "questionType", reason: "invalid_value", expected, actual: "an empty string" };
  }
  if (!questionRendererRegistry.supports(value)) {
    return { field: "questionType", reason: "invalid_value", expected, actual: `unknown question type ${describeRuntimeValue(value)}` };
  }
  if (value !== blueprint.questionType) {
    return { field: "questionType", reason: "incompatible", expected, actual: describeRuntimeValue(value) };
  }
  return undefined;
}

/**
 * Pure comparison of a revision's proposed content against the immutable
 * dimensions of the parent's bound blueprint. This exists because
 * `parentBlueprintHash` equality (checked separately, before this function
 * is ever called) only proves the caller is *referencing* the same
 * blueprint record — it says nothing about whether the revised content
 * itself still conforms to that blueprint's cohort/subject/exam
 * style/skill/question-type constraints.
 *
 * **Every one of the five dimensions is mandatory and always evaluated —
 * there is no code path that skips a dimension.** A revision that omits a
 * dimension, declares it with the wrong runtime type, declares an empty or
 * unresolvable value, or declares a well-formed but different value is
 * flagged identically: as a mismatch. This is a deliberate correction of an
 * earlier version of this function, which only compared a dimension when
 * the revised content already happened to carry a correctly-typed,
 * non-empty value for it — silently *skipping* the check otherwise. That
 * let malformed revised content (a missing `yearLevel`, a null
 * `metadata.subject`, an unresolvable `metadata.skill`, etc.) pass this
 * gate, claim the parent's `supersededBy` slot, and create a child
 * candidate, with the defect caught only by structural validation *after*
 * both writes had already landed — precisely the governance bypass this
 * function must prevent at the revision boundary, before any write.
 *
 * Deliberately narrow and read-only: no filesystem or repository access,
 * no wall-clock, no randomness, and no duplication of structural
 * validation's full schema/registry/taxonomy checks (`checkTaxonomy`,
 * `checkRegistryMembership`, `checkAgainstProductionSchema`) — this
 * function only ever compares against the one specific blueprint record
 * the revision claims to target, using narrow, already-authoritative
 * domain checks (`yearLevelSchema`, `subjectSchema`, `examStyleSchema`,
 * `skillTaxonomyRegistry.resolve`, `questionRendererRegistry.supports`)
 * purely to classify *why* a declared value can't be compared, never to
 * re-validate the candidate's full shape.
 */
export function checkRevisionBlueprintCompatibility(
  revisedContent: unknown,
  blueprint: Blueprint,
): readonly RevisionBlueprintMismatch[] {
  const record = readRecord(revisedContent);
  const metadata = readRecord(record.metadata);

  const mismatches: RevisionBlueprintMismatch[] = [];
  const yearLevelMismatch = checkYearLevel(record, blueprint);
  if (yearLevelMismatch) mismatches.push(yearLevelMismatch);
  const subjectMismatch = checkSubject(metadata, blueprint);
  if (subjectMismatch) mismatches.push(subjectMismatch);
  const examStyleMismatch = checkExamStyle(record, blueprint);
  if (examStyleMismatch) mismatches.push(examStyleMismatch);
  const skillMismatch = checkSkill(metadata, blueprint);
  if (skillMismatch) mismatches.push(skillMismatch);
  const questionTypeMismatch = checkQuestionType(record, blueprint);
  if (questionTypeMismatch) mismatches.push(questionTypeMismatch);

  return mismatches;
}

/** Deterministic, human-readable summary of every mismatch found — same wording regardless of call order, since `checkRevisionBlueprintCompatibility` always evaluates dimensions in the same fixed order. Never includes a stack trace or filesystem path: every `actual`/`expected` fragment is built from `describeRuntimeValue`/`describeRuntimeType`, which only ever render the value's own (bounded, safely-serialised) content. */
export function describeRevisionBlueprintMismatches(
  mismatches: readonly RevisionBlueprintMismatch[],
): string {
  return mismatches.map((m) => `${m.field}: expected ${m.expected}, received ${m.actual}`).join("; ");
}
