import type {
  ExamStyle,
  QuestionMetadata,
  QuestionType,
  VisualType,
  YearLevel,
} from "@/features/exam-engine/types";

export type TaxonomySubject = QuestionMetadata["subject"];
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
