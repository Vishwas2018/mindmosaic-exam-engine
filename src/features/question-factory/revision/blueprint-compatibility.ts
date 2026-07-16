import { toNumericYearLevel, type Blueprint } from "../blueprints";
import { skillTaxonomyRegistry } from "../taxonomy";

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

export interface RevisionBlueprintMismatch {
  readonly field: RevisionBlueprintDimension;
  readonly expected: string;
  readonly actual: string;
}

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

/**
 * Resolves a declared skill id/alias to its canonical taxonomy id via the
 * same registry `checkTaxonomy` already uses (`skillTaxonomyRegistry.resolve`,
 * id-or-declared-alias only, never fuzzy matching) — so a revision that
 * declares the parent blueprint's skill via one of its own declared aliases
 * is not flagged as drift, while an unresolvable or genuinely different
 * skill is compared literally against the blueprint's own id.
 */
function resolveSkillId(declaredSkill: string): string {
  const entry = skillTaxonomyRegistry.resolve(declaredSkill);
  return entry ? entry.id : declaredSkill;
}

/**
 * Pure comparison of a revision's proposed content against the immutable
 * dimensions of the parent's bound blueprint. This exists because
 * `parentBlueprintHash` equality (checked separately, before this function
 * is ever called) only proves the caller is *referencing* the same
 * blueprint record — it says nothing about whether the revised content
 * itself still conforms to that blueprint's cohort/subject/exam
 * style/skill/question-type constraints. A revision could, in principle,
 * declare a correct, current `parentBlueprintHash` while silently changing
 * the content to target a different cohort, subject, exam style, skill, or
 * question type — exactly the gap the Mission 3C P1 finding identified.
 *
 * Deliberately narrow and read-only: no filesystem or repository access,
 * no wall-clock, no randomness, and no duplication of structural
 * validation's full schema/registry/taxonomy checks (`checkTaxonomy`,
 * `checkRegistryMembership`, `checkAgainstProductionSchema`) — this
 * function only ever compares against the one specific blueprint record
 * the revision claims to target, not the wider set of values that
 * blueprint's skill entry would otherwise tolerate.
 *
 * Fields absent or not of the expected primitive type on `revisedContent`
 * are skipped rather than flagged: a shape defect (missing `yearLevel`,
 * non-string `examStyle`, etc.) is structural validation's job to reject
 * once the revised candidate re-enters the pipeline at `generated`;
 * duplicating that here would be exactly the "second, divergent
 * interpretation of blueprint compatibility" the remediation must avoid.
 */
export function checkRevisionBlueprintCompatibility(
  revisedContent: unknown,
  blueprint: Blueprint,
): readonly RevisionBlueprintMismatch[] {
  const record = readRecord(revisedContent);
  const metadata = readRecord(record.metadata);
  const mismatches: RevisionBlueprintMismatch[] = [];

  const declaredYearLevel = record.yearLevel;
  if (typeof declaredYearLevel === "number") {
    const expectedYearLevel = toNumericYearLevel(blueprint.yearLevel);
    if (declaredYearLevel !== expectedYearLevel) {
      mismatches.push({
        field: "yearLevel",
        expected: String(expectedYearLevel),
        actual: String(declaredYearLevel),
      });
    }
  }

  const declaredSubject = metadata.subject;
  if (typeof declaredSubject === "string" && declaredSubject !== blueprint.subject) {
    mismatches.push({ field: "subject", expected: blueprint.subject, actual: declaredSubject });
  }

  const declaredExamStyle = record.examStyle;
  if (typeof declaredExamStyle === "string" && declaredExamStyle !== blueprint.examStyle) {
    mismatches.push({ field: "examStyle", expected: blueprint.examStyle, actual: declaredExamStyle });
  }

  const declaredSkill = metadata.skill;
  if (typeof declaredSkill === "string" && declaredSkill.trim().length > 0) {
    const resolvedSkillId = resolveSkillId(declaredSkill);
    if (resolvedSkillId !== blueprint.skill) {
      mismatches.push({ field: "skill", expected: blueprint.skill, actual: resolvedSkillId });
    }
  }

  const declaredQuestionType = record.type;
  if (typeof declaredQuestionType === "string" && declaredQuestionType !== blueprint.questionType) {
    mismatches.push({
      field: "questionType",
      expected: blueprint.questionType,
      actual: declaredQuestionType,
    });
  }

  return mismatches;
}

/** Deterministic, human-readable summary of every mismatch found — same wording regardless of call order, since `checkRevisionBlueprintCompatibility` always evaluates dimensions in the same fixed order. */
export function describeRevisionBlueprintMismatches(
  mismatches: readonly RevisionBlueprintMismatch[],
): string {
  return mismatches
    .map((m) => `${m.field} (blueprint requires '${m.expected}', revised content declares '${m.actual}')`)
    .join("; ");
}
