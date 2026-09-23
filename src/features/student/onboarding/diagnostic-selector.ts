/**
 * Deterministic 5-Question Diagnostic Warmup Selector (Guardrail G2).
 *
 * Reuses the published-only question bank (getExamBank("published")) to assemble
 * a 5-question baseline warmup for a Grade 3 or Grade 5 student.
 *
 * Rules:
 * - Only approved, published questions (no unpublished or draft items).
 * - Matches the student's confirmed year level (3 or 5).
 * - Balanced spread across core curriculum strands/subjects:
 *     1. Number and Arithmetic (Numeracy)
 *     2. Reading Comprehension (Reading)
 *     3. Conventions of Language / Grammar / Spelling
 *     4. Measurement / Geometry / Space / Patterns
 *     5. Problem Solving / Applied Mathematics / Science
 * - Only auto-markable objective question types (excludes manual-review essay).
 * - Stable selection given the same seed.
 *
 * @module
 */

import type { Question } from "@/schemas/question.schema";
import { seededShuffle } from "@/features/exam-engine/selection/seeded-random";

export const DIAGNOSTIC_QUESTION_COUNT = 5;

export type DiagnosticSelectionResult =
  | {
      readonly ok: true;
      readonly questions: readonly Question[];
      readonly yearLevel: number;
      readonly seed: string;
    }
  | {
      readonly ok: false;
      readonly reason: "insufficient_questions" | "invalid_year_level";
      readonly message: string;
    };

/** Core strand targets for a balanced 5-question baseline. */
const CORE_STRAND_TARGETS = [
  {
    name: "Number & Arithmetic",
    matcher: (q: Question) =>
      q.metadata.subject === "numeracy" &&
      /(number|arithmetic|operations|fraction|decimal|addition|multiplication|subtraction|division)/i.test(
        `${q.metadata.strand ?? ""} ${q.metadata.skill ?? ""} ${q.metadata.topic ?? ""}`,
      ),
  },
  {
    name: "Reading & Comprehension",
    matcher: (q: Question) =>
      q.metadata.subject === "reading" &&
      /(reading|comprehension|inference|meaning|text|vocabulary)/i.test(
        `${q.metadata.strand ?? ""} ${q.metadata.skill ?? ""} ${q.metadata.topic ?? ""}`,
      ),
  },
  {
    name: "Language & Conventions",
    matcher: (q: Question) =>
      (q.metadata.subject === "language_conventions" ||
        q.metadata.subject === "spelling") &&
      /(language|grammar|spelling|punctuation|syntax|convention)/i.test(
        `${q.metadata.strand ?? ""} ${q.metadata.skill ?? ""} ${q.metadata.topic ?? ""}`,
      ),
  },
  {
    name: "Measurement & Geometry",
    matcher: (q: Question) =>
      q.metadata.subject === "numeracy" &&
      /(measurement|geometry|space|shape|time|area|perimeter|pattern|algebra)/i.test(
        `${q.metadata.strand ?? ""} ${q.metadata.skill ?? ""} ${q.metadata.topic ?? ""}`,
      ),
  },
  {
    name: "Problem Solving & Inquiry",
    matcher: (q: Question) =>
      q.metadata.subject === "science" ||
      q.metadata.subject === "digital_technologies" ||
      q.metadata.subject === "critical_creative_thinking" ||
      /(problem|logic|data|statistics|chance|inquiry|reasoning)/i.test(
        `${q.metadata.strand ?? ""} ${q.metadata.skill ?? ""} ${q.metadata.topic ?? ""}`,
      ),
  },
] as const;

/**
 * Selects 5 published diagnostic warmup questions.
 */
export function selectDiagnosticQuestions(
  publishedBank: readonly Question[],
  yearLevel: number,
  seed: string = `diagnostic-warmup-y${yearLevel}`,
): DiagnosticSelectionResult {
  if (yearLevel !== 3 && yearLevel !== 5) {
    return {
      ok: false,
      reason: "invalid_year_level",
      message: `Diagnostic warmup is only configured for Year 3 and Year 5 (received ${yearLevel}).`,
    };
  }

  // Filter bank to published, objective questions for this year level
  const eligible = publishedBank.filter((q) => {
    return q.yearLevel === yearLevel && q.type !== "essay";
  });

  if (eligible.length < DIAGNOSTIC_QUESTION_COUNT) {
    return {
      ok: false,
      reason: "insufficient_questions",
      message: `Insufficient published questions for Year ${yearLevel} diagnostic (found ${eligible.length}, needed ${DIAGNOSTIC_QUESTION_COUNT}).`,
    };
  }

  const selectedQuestions: Question[] = [];
  const selectedIds = new Set<string>();

  // Attempt to select 1 question per core strand target
  for (let i = 0; i < CORE_STRAND_TARGETS.length; i++) {
    const target = CORE_STRAND_TARGETS[i]!;
    const matching = eligible.filter(
      (q) => !selectedIds.has(q.id) && target.matcher(q),
    );

    if (matching.length > 0) {
      const shuffled = seededShuffle(matching, `${seed}-target-${i}`);
      const chosen = shuffled[0]!;
      selectedQuestions.push(chosen);
      selectedIds.add(chosen.id);
    }
  }

  // If any target slots were unfilled, fill from remaining eligible questions with diversity
  if (selectedQuestions.length < DIAGNOSTIC_QUESTION_COUNT) {
    const remaining = eligible.filter((q) => !selectedIds.has(q.id));
    const shuffledRemaining = seededShuffle(remaining, `${seed}-fill`);

    for (const q of shuffledRemaining) {
      if (selectedQuestions.length >= DIAGNOSTIC_QUESTION_COUNT) break;
      selectedQuestions.push(q);
      selectedIds.add(q.id);
    }
  }

  if (selectedQuestions.length !== DIAGNOSTIC_QUESTION_COUNT) {
    return {
      ok: false,
      reason: "insufficient_questions",
      message: `Could not assemble exactly ${DIAGNOSTIC_QUESTION_COUNT} diverse questions for Year ${yearLevel}.`,
    };
  }

  return {
    ok: true,
    questions: selectedQuestions,
    yearLevel,
    seed,
  };
}
