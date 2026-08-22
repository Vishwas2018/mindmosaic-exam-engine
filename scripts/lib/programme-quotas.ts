/**
 * Machine-enforceable composition quotas for manual-questions batches.
 *
 * Transcribed from GENERATION-SPEC.md section 2 (set size/composition) and
 * section 4 (allowed question types, diversity, single-type cap). This is
 * the SOURCE OF TRUTH the validators check against — batchSelfReport is
 * diagnostic only and is never trusted (see REVIEW-PIPELINE.md addendum).
 *
 * Visual range: reinstated as a floor+ceiling per Vish's 2026-08-21 decision
 * (see REVIEW-PIPELINE.md "MACHINE GATES ARE ENFORCED" addendum). The
 * GENERATION-SPEC.md "VISUAL QUOTA — SUPERSEDED (2026-08-10)" section that
 * turned this into a ceiling-only rule is retracted; section 2's original
 * range is authoritative again.
 */

export interface ProgrammeQuota {
  readonly programme: string;
  readonly questionCount: number;
  readonly easy: number;
  readonly medium: number;
  readonly challenging: number;
  readonly visualMin: number;
  readonly visualMax: number;
  readonly timeMinutes: number;
  readonly permittedTypes: readonly string[];
  /** null = no minimum distinct-type requirement (reading sets). */
  readonly typeDiversityMin: number | null;
  readonly typeCapPercent: number;
}

const NUMERACY_ICAS_TYPES = [
  "multiple_choice",
  "multiple_select",
  "number_entry",
  "ordering",
  "matching",
  "drag_drop",
] as const;

const NUMERACY_NAPLAN_TYPES = [
  "multiple_choice",
  "multiple_select",
  "number_entry",
  "drag_drop",
  "ordering",
  "matching",
] as const;

const READING_NAPLAN_TYPES = [
  "reading_comprehension",
  "multiple_choice",
  "multiple_select",
  "ordering",
  "drag_drop",
] as const;

const READING_ICAS_TYPES = [
  "reading_comprehension",
  "multiple_choice",
  "multiple_select",
] as const;

const LANGUAGE_NAPLAN_TYPES = [
  "fill_blank",
  "short_answer",
  "multiple_choice",
  "multiple_select",
  "dropdown",
  "drag_drop",
  "ordering",
] as const;

const LANGUAGE_ICAS_TYPES = [
  "multiple_choice",
  "multiple_select",
  "dropdown",
  "fill_blank",
] as const;

const SCIENCE_TYPES = [
  "multiple_choice",
  "multiple_select",
  "true_false",
  "matching",
  "ordering",
  "number_entry",
] as const;

const DIGITAL_TECH_TYPES = [
  "multiple_choice",
  "multiple_select",
  "true_false",
  "ordering",
  "matching",
  "drag_drop",
] as const;

const SPELLING_TYPES = ["fill_blank", "short_answer", "multiple_choice"] as const;

export const PROGRAMME_QUOTAS: Record<string, ProgrammeQuota> = {
  "naplan-y3-numeracy": {
    programme: "naplan-y3-numeracy",
    questionCount: 36,
    easy: 11,
    medium: 16,
    challenging: 9,
    visualMin: 14,
    visualMax: 21,
    timeMinutes: 45,
    permittedTypes: NUMERACY_NAPLAN_TYPES,
    typeDiversityMin: 4,
    typeCapPercent: 60,
  },
  "naplan-y3-reading": {
    programme: "naplan-y3-reading",
    questionCount: 39,
    easy: 13,
    medium: 17,
    challenging: 9,
    visualMin: 4,
    visualMax: 8,
    timeMinutes: 45,
    permittedTypes: READING_NAPLAN_TYPES,
    typeDiversityMin: null,
    typeCapPercent: 85,
  },
  "naplan-y3-language": {
    programme: "naplan-y3-language",
    questionCount: 52,
    easy: 17,
    medium: 23,
    challenging: 12,
    visualMin: 0,
    visualMax: 4,
    timeMinutes: 45,
    permittedTypes: LANGUAGE_NAPLAN_TYPES,
    typeDiversityMin: 3,
    typeCapPercent: 60,
  },
  "naplan-y5-numeracy": {
    programme: "naplan-y5-numeracy",
    questionCount: 42,
    easy: 13,
    medium: 19,
    challenging: 10,
    visualMin: 17,
    visualMax: 25,
    timeMinutes: 50,
    permittedTypes: NUMERACY_NAPLAN_TYPES,
    typeDiversityMin: 4,
    typeCapPercent: 60,
  },
  "naplan-y5-reading": {
    programme: "naplan-y5-reading",
    questionCount: 39,
    easy: 13,
    medium: 17,
    challenging: 9,
    visualMin: 4,
    visualMax: 8,
    timeMinutes: 50,
    permittedTypes: READING_NAPLAN_TYPES,
    typeDiversityMin: null,
    typeCapPercent: 85,
  },
  "naplan-y5-language": {
    programme: "naplan-y5-language",
    questionCount: 52,
    easy: 17,
    medium: 23,
    challenging: 12,
    visualMin: 0,
    visualMax: 4,
    timeMinutes: 45,
    permittedTypes: LANGUAGE_NAPLAN_TYPES,
    typeDiversityMin: 3,
    typeCapPercent: 60,
  },
  "icas-y3-numeracy": {
    programme: "icas-y3-numeracy",
    questionCount: 40,
    easy: 13,
    medium: 18,
    challenging: 9,
    visualMin: 16,
    visualMax: 24,
    timeMinutes: 45,
    permittedTypes: NUMERACY_ICAS_TYPES,
    typeDiversityMin: 4,
    typeCapPercent: 60,
  },
  "icas-y3-reading": {
    programme: "icas-y3-reading",
    questionCount: 27,
    easy: 9,
    medium: 12,
    challenging: 6,
    visualMin: 3,
    visualMax: 5,
    timeMinutes: 45,
    permittedTypes: READING_ICAS_TYPES,
    typeDiversityMin: null,
    typeCapPercent: 85,
  },
  "icas-y3-language": {
    programme: "icas-y3-language",
    questionCount: 18,
    easy: 6,
    medium: 8,
    challenging: 4,
    visualMin: 0,
    visualMax: 2,
    timeMinutes: 45,
    permittedTypes: LANGUAGE_ICAS_TYPES,
    typeDiversityMin: 3,
    typeCapPercent: 60,
  },
  "icas-y3-science": {
    programme: "icas-y3-science",
    questionCount: 30,
    easy: 10,
    medium: 13,
    challenging: 7,
    visualMin: 12,
    visualMax: 18,
    timeMinutes: 45,
    permittedTypes: SCIENCE_TYPES,
    typeDiversityMin: 4,
    typeCapPercent: 60,
  },
  "icas-y3-digital_technologies": {
    programme: "icas-y3-digital_technologies",
    questionCount: 30,
    easy: 10,
    medium: 13,
    challenging: 7,
    visualMin: 6,
    visualMax: 12,
    timeMinutes: 30,
    permittedTypes: DIGITAL_TECH_TYPES,
    typeDiversityMin: 4,
    typeCapPercent: 60,
  },
  "icas-y3-spelling": {
    programme: "icas-y3-spelling",
    questionCount: 40,
    easy: 13,
    medium: 18,
    challenging: 9,
    visualMin: 0,
    visualMax: 2,
    timeMinutes: 40,
    permittedTypes: SPELLING_TYPES,
    typeDiversityMin: 3,
    typeCapPercent: 60,
  },
  "icas-y5-numeracy": {
    programme: "icas-y5-numeracy",
    questionCount: 40,
    easy: 13,
    medium: 18,
    challenging: 9,
    visualMin: 16,
    visualMax: 24,
    timeMinutes: 45,
    permittedTypes: NUMERACY_ICAS_TYPES,
    typeDiversityMin: 4,
    typeCapPercent: 60,
  },
  "icas-y5-reading": {
    programme: "icas-y5-reading",
    questionCount: 30,
    easy: 10,
    medium: 13,
    challenging: 7,
    visualMin: 4,
    visualMax: 6,
    timeMinutes: 50,
    permittedTypes: READING_ICAS_TYPES,
    typeDiversityMin: null,
    typeCapPercent: 85,
  },
  "icas-y5-language": {
    programme: "icas-y5-language",
    questionCount: 20,
    easy: 6,
    medium: 9,
    challenging: 5,
    visualMin: 0,
    visualMax: 2,
    timeMinutes: 50,
    permittedTypes: LANGUAGE_ICAS_TYPES,
    typeDiversityMin: 3,
    typeCapPercent: 60,
  },
  "icas-y5-science": {
    programme: "icas-y5-science",
    questionCount: 40,
    easy: 13,
    medium: 18,
    challenging: 9,
    visualMin: 16,
    visualMax: 24,
    timeMinutes: 55,
    permittedTypes: SCIENCE_TYPES,
    typeDiversityMin: 4,
    typeCapPercent: 60,
  },
  "icas-y5-digital_technologies": {
    programme: "icas-y5-digital_technologies",
    questionCount: 35,
    easy: 11,
    medium: 16,
    challenging: 8,
    visualMin: 7,
    visualMax: 14,
    timeMinutes: 35,
    permittedTypes: DIGITAL_TECH_TYPES,
    typeDiversityMin: 4,
    typeCapPercent: 60,
  },
  "icas-y5-spelling": {
    programme: "icas-y5-spelling",
    questionCount: 45,
    easy: 14,
    medium: 20,
    challenging: 11,
    visualMin: 0,
    visualMax: 2,
    timeMinutes: 40,
    permittedTypes: SPELLING_TYPES,
    typeDiversityMin: 3,
    typeCapPercent: 60,
  },
};

/** Splits `icas-y3-science-b01` into { programme: "icas-y3-science", batch: "b01" }. */
export function splitProgrammeAndBatch(
  batchIdentifier: string,
): { programme: string; batch: string } | null {
  const match = /^(.+)-(b\d{2})$/.exec(batchIdentifier);
  if (!match) return null;
  return { programme: match[1], batch: match[2] };
}

/** Derives the canonical on-disk path for a `<programme>-<batch>` identifier. */
export function expectedBatchPath(programme: string, batch: string): string | null {
  const yearMatch = /-y(3|5)-/.exec(programme);
  const examMatch = /^(naplan|icas)-/.exec(programme);
  if (!yearMatch || !examMatch) return null;
  const grade = `grade-${yearMatch[1]}`;
  const exam = examMatch[1];
  return `content/manual-questions/${grade}/${exam}/${programme}/${programme}-${batch}.json`;
}
