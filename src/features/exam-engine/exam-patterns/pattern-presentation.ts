import type { ExamPattern } from "./exam-pattern";
import { parseProgrammeId } from "./programme-id";

/**
 * Display-only derivations for the picker. Nothing here decides what is sat —
 * that is the registry and the selection — so a change in this module can
 * never change a paper's shape.
 */

/**
 * The short subject name for a card heading: "Numeracy", "English",
 * "Digital Technologies".
 *
 * Read off the pattern's own label rather than reconstructed from its
 * sources, because the label is the one place a pattern's subject is named
 * and the ICAS English patterns draw from two source programmes (reading and
 * language) while being ONE subject to the child. Deriving from sources would
 * have to special-case that and would risk printing "Reading and Language",
 * which is exactly the two-section reading the doc forbids.
 *
 * The registry's labels all follow the doc's §1 form, and
 * `exam-patterns.test.ts` asserts every pattern yields a non-empty name, so a
 * label that drifted from the form fails the suite rather than rendering an
 * empty heading.
 */
const SUBJECT_FROM_LABEL = /^(?:NAPLAN|ICAS)-style Year \d+ (.+?) — /;

export function patternSubjectName(pattern: ExamPattern): string {
  return SUBJECT_FROM_LABEL.exec(pattern.label)?.[1] ?? pattern.label;
}

/**
 * Which of the catalogue's subject plates illustrates this paper, so an exam
 * card and the practice card for the same subject carry the same artwork.
 * The merged English patterns take the reading plate: they are one English
 * paper, and reading is its larger source.
 */
export type PatternPlateSubject =
  | "numeracy"
  | "reading"
  | "language"
  | "spelling"
  | "science"
  | "digital_technologies";

export function patternPlateSubject(pattern: ExamPattern): PatternPlateSubject {
  const subjects = pattern.sources.flatMap((source) => {
    const scope = parseProgrammeId(source.programmeId);
    return scope?.subject ? [scope.subject] : [];
  });
  const first = subjects[0];
  if (first === "numeracy") return "numeracy";
  if (first === "language") return subjects.includes("reading") ? "reading" : "language";
  if (first === "spelling") return "spelling";
  if (first === "science") return "science";
  if (first === "digital_technologies") return "digital_technologies";
  return "reading";
}

export const EXAM_STYLE_NAMES: Readonly<Record<string, string>> = {
  naplan_style: "NAPLAN-style",
  icas_style: "ICAS-style",
};
