import type {
  ExamStyle,
  QuestionMetadata,
  QuestionType,
  VisualType,
  YearLevel,
} from "@/features/exam-engine/types";
import type { SubjectId } from "@/features/taxonomy/subject-registry";

// Wired directly to the subject registry (rather than indirectly through
// `QuestionMetadata["subject"]`) so the taxonomy module and the question
// schema share one source of truth for which subjects exist.
export type TaxonomySubject = SubjectId;
export type TaxonomyDifficulty = QuestionMetadata["difficulty"];

/**
 * One authoritative curriculum skill. `id` is the stable machine identifier —
 * it must never be recomputed from `displayName` at runtime. `aliases` is the
 * only mechanism by which existing production-bank skill text and legacy
 * `_HARVEST` taxonomy labels resolve to this entry.
 */
export interface TaxonomyEntry {
  readonly id: string;
  readonly displayName: string;
  readonly aliases: readonly string[];
  /**
   * The years this ONE SKILL is taught at — curriculum data, varying per entry
   * (`[6]`, `[3, 4]`, `[3, 4, 5, 6]`). Typed as `YearLevel`, so the registry
   * range constrains every value.
   *
   * Classified by spec Phase 0 (ADR-001 §3) as **per-skill data**, not a
   * duplicate year constant, and therefore left as-is: it is not derivable from
   * anything, since no two skills share a span. Where it raises a validity
   * question it is already checked against the registry — `./validate.ts`
   * crosses `yearLevels` with `examStyles` through `isValidStyleYear` and
   * rejects an entry whose cross product contains no real sitting.
   */
  readonly yearLevels: readonly YearLevel[];
  readonly examStyles: readonly ExamStyle[];
  readonly subject: TaxonomySubject;
  readonly strand: string;
  readonly prerequisites: readonly string[];
  readonly recommendedQuestionTypes: readonly QuestionType[];
  readonly recommendedVisualTypes: readonly VisualType[];
  readonly supportedDifficulties: readonly TaxonomyDifficulty[];
  readonly curriculumNotes: readonly string[];
  readonly generationConstraints: readonly string[];
}
