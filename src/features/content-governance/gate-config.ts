import type { Question } from "@/schemas/question.schema";

/** Reviewed, source-controlled switches. An omitted programme remains in report mode. */
export type PublicationGateMode = "report" | "enforce";
export const PROGRAMME_PUBLICATION_MODES: Readonly<Record<string, PublicationGateMode>> = Object.freeze({});

export function programmeIdForQuestion(question: Question): string {
  const family = question.examStyle.replace(/_style$/, "");
  const subject = question.metadata.subject === "language_conventions"
    ? "language"
    : question.metadata.subject;
  return `${family}-y${question.yearLevel}-${subject}`;
}

export function publicationGateMode(
  programmeId: string,
  modes: Readonly<Record<string, PublicationGateMode>> = PROGRAMME_PUBLICATION_MODES,
): PublicationGateMode {
  return modes[programmeId] ?? "report";
}

/** A pure boundary used by runtime and mixed-mode regression tests. */
export function selectServedQuestions<T extends Question>(
  authored: readonly T[],
  approvedIds: ReadonlySet<string>,
  modes: Readonly<Record<string, PublicationGateMode>> = PROGRAMME_PUBLICATION_MODES,
): readonly T[] {
  return authored.filter((question) =>
    publicationGateMode(programmeIdForQuestion(question), modes) === "report" ||
    approvedIds.has(question.id));
}
