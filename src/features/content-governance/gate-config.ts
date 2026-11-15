import type { Question } from "@/schemas/question.schema";

/** Reviewed, source-controlled switches. An omitted programme remains in report mode. */
export type PublicationGateMode = "report" | "enforce";
export const PROGRAMME_PUBLICATION_MODES: Readonly<Record<string, PublicationGateMode>> = Object.freeze({});

export function programmeIdForQuestion(question: Question): string {
  const family = question.examStyle.replace(/_style$/, "");
  const subject = question.metadata.subject === "language_conventions"
    ? "language"
    : question.metadata.subject.replace(/_/g, "-");
  return `${family}-y${question.yearLevel}-${subject}`;
}

export function publicationGateMode(
  programmeId: string,
  modes: Readonly<Record<string, PublicationGateMode>> = PROGRAMME_PUBLICATION_MODES,
  fallback: PublicationGateMode = "report",
): PublicationGateMode {
  if (modes[programmeId] !== undefined) return modes[programmeId]!;
  if (fallback === "enforce") return "enforce";
  if (programmeId.startsWith("scholarship-") || programmeId.startsWith("edutest")) return "enforce";
  return "report";
}

/** Every programme enforced: what a deployed beta serves (see resolveDeployedGateModes in src/server/exam-bank.ts). */
export const ENFORCE_ALL: PublicationGateMode = "enforce";

/** A pure boundary used by runtime and mixed-mode regression tests. */
export function selectServedQuestions<T extends Question>(
  authored: readonly T[],
  approvedIds: ReadonlySet<string>,
  modes: Readonly<Record<string, PublicationGateMode>> = PROGRAMME_PUBLICATION_MODES,
  fallback: PublicationGateMode = "report",
): readonly T[] {
  // Enforcement can come from the explicit switches or from a programme default (scholarship-*), so it is
  // decided per authored question rather than from the explicit map alone.
  const hasEnforced = authored.some((question) =>
    publicationGateMode(programmeIdForQuestion(question), modes, fallback) === "enforce");
  if (!hasEnforced) return authored;
  const filtered = authored.filter((question) =>
    publicationGateMode(programmeIdForQuestion(question), modes, fallback) === "report" ||
    approvedIds.has(question.id));
  return filtered.length === authored.length ? authored : filtered;
}
