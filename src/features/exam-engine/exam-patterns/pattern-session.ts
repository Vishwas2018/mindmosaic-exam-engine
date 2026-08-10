import {
  durationSecondsFor,
  type EstimatedTimeSource,
  type ExamSelectionConfig,
  type SubjectFilter,
} from "@/features/exam-engine/selection";

import type { Adaptation, ExamPattern } from "./exam-pattern";
import { getExamPattern } from "./exam-pattern-registry";
import { parseProgrammeId } from "./programme-id";

/**
 * The join between a pattern and the exam session that sits it. A pattern
 * sitting is an ordinary session — same store, same timer, same submit path —
 * whose config was written by the pattern instead of by a child at the
 * configurator. `patternId` on the config is what every downstream surface
 * (duration, the /exam heading, the results label, a resumed server session)
 * reads to know that.
 */

/** The subject filter that describes a whole pattern. */
export function patternSubjectFilter(pattern: ExamPattern): SubjectFilter {
  const subjects = new Set(
    pattern.sources.flatMap((source) => {
      const scope = parseProgrammeId(source.programmeId);
      return scope?.subject ? [scope.subject] : [];
    }),
  );
  /* The ICAS English patterns span two source programmes. There is no
     `english` subject filter (fidelity backlog item 4), so the engine's
     honest internal description of that span is "mixed" — and every
     candidate-facing surface shows the pattern's own label instead, because
     the child sits one undivided English paper. */
  const [only] = subjects;
  return subjects.size === 1 && only !== undefined ? only : "mixed";
}

/**
 * Minutes a reduced practice module runs for: the pattern's time, scaled by
 * how much of the paper is actually being sat (doc §6, "proportionally
 * recalculated time"), rounded up, and never under five minutes so a very
 * small module is not effectively untimed.
 */
export function reducedModuleMinutes(
  pattern: ExamPattern,
  servedQuestionCount: number,
): number {
  const scaled = Math.ceil(
    (pattern.timeMinutes * servedQuestionCount) / pattern.questionCount,
  );
  return Math.max(5, Math.min(pattern.timeMinutes, scaled));
}

/**
 * The selection config for a pattern sitting.
 *
 * `questionCount` is what will actually be SERVED, so a reduced module's
 * progress, submit dialog and results all count the real thing; `shortened`
 * is what stops that ever being mistaken for the full-length paper.
 */
export function patternExamConfig(
  pattern: ExamPattern,
  servedQuestionCount: number,
  reduced: boolean,
): ExamSelectionConfig {
  return {
    yearLevel: pattern.yearLevel,
    examStyle: pattern.examStyle,
    subject: patternSubjectFilter(pattern),
    questionCount: servedQuestionCount,
    timing: "timed",
    patternId: pattern.id,
    shortened: reduced,
  };
}

/**
 * A sitting's duration in seconds, or null when it is untimed.
 *
 * A full-length pattern sitting runs for the paper's published time limit,
 * whole — the one number the pattern exists to fix. A reduced practice module
 * gets the proportionally recalculated time the doc requires, computed from
 * the count actually served. Everything else falls through to the existing
 * count-based durations.
 *
 * Used by the client store and by all three session routes, so a resumed or
 * server-scored sitting can never disagree with the client about when the
 * paper was due.
 */
export function sessionDurationSeconds(
  config: ExamSelectionConfig,
  questions: readonly EstimatedTimeSource[] = [],
): number | null {
  if (config.timing !== "timed") return null;
  const pattern = config.patternId ? getExamPattern(config.patternId) : undefined;
  if (!pattern) return durationSecondsFor(config.questionCount, questions);
  if (!config.shortened) return pattern.timeMinutes * 60;
  const served =
    typeof config.questionCount === "number" ? config.questionCount : questions.length;
  return reducedModuleMinutes(pattern, served) * 60;
}

/** "36 questions · 45 minutes" — the plain-language line the picker shows. */
export function describePaperShape(questionCount: number, timeMinutes: number): string {
  return `${questionCount} questions · ${timeMinutes} minutes`;
}

/**
 * How a sitting is named wherever it appears — the picker, the exam header,
 * the results page.
 *
 * A reduced sitting is never named after the full-length pattern: it says it
 * is a practice module and says how big it actually is. That is the doc's
 * "never present a short paper as the full-length pattern", enforced in the
 * one function every surface formats through.
 */
export function patternSittingLabel(
  pattern: ExamPattern,
  servedQuestionCount: number,
  reduced: boolean,
): string {
  if (!reduced) return pattern.label;
  const base = pattern.label.replace(/ — full-length practice$/, "");
  return `${base} — practice module (${servedQuestionCount} of ${pattern.questionCount} questions)`;
}

/**
 * Plain-language wording for each adaptation, for the "How this differs from
 * the real assessment" disclosure. Written for a parent reading over an
 * eight-year-old's shoulder: what is different, and why.
 */
export const ADAPTATION_COPY: Readonly<
  Record<Adaptation, { title: string; body: string }>
> = {
  fixed_path: {
    title: "Everyone gets the same questions",
    body: "The real NAPLAN test changes which questions come next based on how you are going. This practice paper is one fixed set of questions from start to finish.",
  },
  text_only_spelling: {
    title: "Spelling words are written, not spoken",
    body: "In the real test a teacher or a recording reads the spelling words out loud. Here you read them and find the mistakes instead.",
  },
  no_section_lock: {
    title: "You can go back to any part",
    body: "In the real test, once you move on from the spelling part you cannot go back to it. Here you can move between all the questions at any time.",
  },
  internal_english_mix: {
    title: "We chose the mix of English questions",
    body: "ICAS English is one paper covering reading and language. ICAS does not publish how many questions come from each area, so we chose the balance ourselves.",
  },
};
