import { normalizeTaxonomyLabel, skillTaxonomyRegistry } from "../taxonomy";
import type { CandidateQuestion } from "../ingestion/candidate-question";
import type { StructuralValidationIssue } from "./types";

function issue(
  code: StructuralValidationIssue["code"],
  path: string,
  message: string,
): StructuralValidationIssue {
  return { code, path, message, severity: "error" };
}

/**
 * Resolves `metadata.skill` through the authoritative taxonomy registry
 * (`skillTaxonomyRegistry.resolve`, id-or-declared-alias only — never
 * fuzzy/semantic matching, per the registry's own contract) and checks the
 * declared grade, subject, strand and exam style against the resolved
 * entry. A candidate with no declared skill is rejected as
 * `ambiguous_taxonomy_reference`: without a skill, there is no single
 * taxonomy entry to check grade/subject/strand/exam-style against, and
 * this validator never guesses which one was intended from the other
 * fields alone.
 */
export function checkTaxonomy(question: CandidateQuestion): readonly StructuralValidationIssue[] {
  const { skill } = question.metadata;

  if (skill === undefined || skill.trim().length === 0) {
    return [
      issue(
        "ambiguous_taxonomy_reference",
        "question.metadata.skill",
        "No skill declared; the taxonomy entry this candidate belongs to cannot be unambiguously resolved.",
      ),
    ];
  }

  const entry = skillTaxonomyRegistry.resolve(skill);
  if (!entry) {
    return [
      issue(
        "unknown_taxonomy_skill",
        "question.metadata.skill",
        `Skill '${skill}' does not resolve to any taxonomy id or declared alias.`,
      ),
    ];
  }

  const issues: StructuralValidationIssue[] = [];

  if (!entry.yearLevels.includes(question.yearLevel)) {
    issues.push(
      issue(
        "taxonomy_grade_mismatch",
        "question.yearLevel",
        `Taxonomy entry '${entry.id}' supports year level(s) ${entry.yearLevels.join(", ")}; candidate declares ${question.yearLevel}.`,
      ),
    );
  }

  if (entry.subject !== question.metadata.subject) {
    issues.push(
      issue(
        "taxonomy_subject_mismatch",
        "question.metadata.subject",
        `Taxonomy entry '${entry.id}' belongs to subject '${entry.subject}'; candidate declares '${question.metadata.subject}'.`,
      ),
    );
  }

  if (normalizeTaxonomyLabel(entry.strand) !== normalizeTaxonomyLabel(question.metadata.strand)) {
    issues.push(
      issue(
        "taxonomy_strand_mismatch",
        "question.metadata.strand",
        `Taxonomy entry '${entry.id}' belongs to strand '${entry.strand}'; candidate declares '${question.metadata.strand}'.`,
      ),
    );
  }

  if (!entry.examStyles.includes(question.examStyle)) {
    issues.push(
      issue(
        "taxonomy_exam_style_unsupported",
        "question.examStyle",
        `Taxonomy entry '${entry.id}' supports exam style(s) ${entry.examStyles.join(", ")}; candidate declares '${question.examStyle}'.`,
      ),
    );
  }

  return issues;
}
