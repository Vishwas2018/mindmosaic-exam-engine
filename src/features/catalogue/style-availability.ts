import "server-only";

import type { ExamStyle } from "@/schemas/question.schema";
import { EXAM_PATTERNS } from "@/features/exam-engine/exam-patterns/exam-pattern-registry";
import { patternSubjectName } from "@/features/exam-engine/exam-patterns/pattern-presentation";
import { getPatternReadiness } from "@/server/exam-bank";

/**
 * What a learner can actually start today in one assessment style, read off the same pattern readiness the exam picker
 * uses (so it follows the approved-content gate on deployed builds). Marketing and Exam Centre copy is held to this by
 * tests; it is the one place that answers "is ICAS-style / AMC-style open?".
 *
 * - `in_development`: nothing in the style can be started.
 * - `modules_only`: something can be started, but only as practice modules (never a full-length paper).
 * - `open`: at least one full-length or shortened paper can be started.
 */
export type StyleAvailabilityState = "open" | "modules_only" | "in_development";

export interface StyleAvailability {
  readonly examStyle: ExamStyle;
  readonly state: StyleAvailabilityState;
  readonly years: readonly number[];
  readonly subjects: readonly string[];
}

export function getStyleAvailability(examStyle: ExamStyle): StyleAvailability {
  const readiness = getPatternReadiness();
  const startable = EXAM_PATTERNS.filter(
    (pattern) =>
      pattern.examStyle === examStyle &&
      pattern.status === "available" &&
      readiness[pattern.id]?.state !== undefined &&
      readiness[pattern.id]!.state !== "unavailable",
  );
  const years = [...new Set(startable.map((pattern) => pattern.yearLevel))].sort((a, b) => a - b);
  const subjects = [...new Set(startable.map((pattern) => patternSubjectName(pattern)))];
  const hasRealPaper = startable.some(
    (pattern) =>
      pattern.presentation === "full_length_practice" &&
      !startable.some(
        (other) =>
          other.presentation === "practice_module" &&
          other.yearLevel === pattern.yearLevel &&
          other.sources[0]?.programmeId === pattern.sources[0]?.programmeId &&
          readiness[pattern.id]!.state === "short",
      ),
  );
  const state: StyleAvailabilityState =
    startable.length === 0 ? "in_development" : hasRealPaper ? "open" : "modules_only";
  return { examStyle, state, years, subjects };
}
