import {
  ISOLABLE_SUBJECT_FILTERS,
  REGISTRY_SUBJECT_BY_FILTER,
  type SubjectFilter,
} from "@/features/exam-engine/selection";
import { isKnownSubject, isSubjectSatIn } from "@/features/taxonomy/subject-registry";
import { isKnownYearLevel } from "@/features/taxonomy/year-registry";
import type { ExamStyle, YearLevel } from "@/schemas/question.schema";

/**
 * A programme id is the name `docs/content-status/exam-patterns.md` uses for
 * one bank of content: `naplan-y3-numeracy`, `icas-y5-digital_technologies`.
 * It is a *content* address, not a URL and not a catalogue slug — the
 * catalogue's own hand-written programs are `naplan-g3-numeracy` (a "g"), and
 * its generated cells hyphenate the subject (`icas-y5-digital-technologies`).
 *
 * Rather than pick one of those spellings and make the pattern registry
 * depend on the catalogue, a programme id is parsed into the facts the
 * selection engine actually needs, and the catalogue cross-check lives in the
 * registry's test (`exam-patterns.test.ts`), which asserts every source
 * addresses a programme the catalogue also knows about.
 *
 * Both the documented underscore spelling (`digital_technologies`) and the
 * catalogue's hyphenated one are accepted, because both appear in the repo
 * today and neither is worth a second id vocabulary.
 */
export interface ProgrammeScope {
  readonly yearLevel: YearLevel;
  readonly examStyle: ExamStyle;
  /** The subject registry id, e.g. `language_conventions`, `writing`. */
  readonly subjectId: string;
  /**
   * The selection filter that isolates this subject — absent for `writing`,
   * which the engine can only ever serve inside `subject: "mixed"` (see
   * SUBJECTS_BY_FILTER in selection/select-questions.ts). A programme with no
   * filter is a real programme that cannot be drawn from, which is exactly
   * the state the deferred writing patterns are in.
   */
  readonly subject?: Exclude<SubjectFilter, "mixed">;
}

const STYLE_BY_PREFIX: Readonly<Record<string, ExamStyle>> = {
  naplan: "naplan_style",
  icas: "icas_style",
};

/**
 * Programme id subject segments that are NOT the registry's own id. Only
 * `language` needs one: the filter vocabulary calls it "language", the
 * registry calls it `language_conventions`, and the doc's programme ids use
 * the filter spelling.
 */
const REGISTRY_SUBJECT_BY_SEGMENT: Readonly<Record<string, string>> = {
  language: "language_conventions",
};

const PROGRAMME_ID_PATTERN = /^(naplan|icas)-y(\d{1,2})-([a-z_-]+)$/;

/**
 * Parse a programme id, or return undefined when it does not name a real
 * sitting. "Real" is three independent checks, all delegated to the
 * registries rather than restated here: the subject must be one the product
 * knows, the year must be a year the product knows, and `isSubjectSatIn` must
 * agree that this subject's paper is actually set in this style at this year
 * (NAPLAN sets no Science; ICAS stops setting Digital Technologies after
 * Year 7).
 */
export function parseProgrammeId(programmeId: string): ProgrammeScope | undefined {
  const match = PROGRAMME_ID_PATTERN.exec(programmeId);
  if (!match) return undefined;
  const [, prefix, yearText, subjectSegment] = match;

  const examStyle = STYLE_BY_PREFIX[prefix!];
  if (!examStyle) return undefined;

  const yearLevel = Number(yearText);
  if (!isKnownYearLevel(yearLevel)) return undefined;

  const segment = subjectSegment!.replaceAll("-", "_");
  const subjectId = REGISTRY_SUBJECT_BY_SEGMENT[segment] ?? segment;
  if (!isKnownSubject(subjectId)) return undefined;
  if (!isSubjectSatIn(subjectId, examStyle, yearLevel)) return undefined;

  const subject = (ISOLABLE_SUBJECT_FILTERS as readonly string[]).includes(segment)
    ? (segment as Exclude<SubjectFilter, "mixed">)
    : undefined;
  /* Belt and braces: if a filter exists it must address the same registry
     subject this id resolved to, so the two vocabularies cannot drift. */
  if (subject && REGISTRY_SUBJECT_BY_FILTER[subject] !== subjectId) return undefined;

  return { yearLevel, examStyle, subjectId, subject };
}

/** Same as `parseProgrammeId`, but throws — for module-load validation. */
export function requireProgrammeScope(programmeId: string): ProgrammeScope {
  const scope = parseProgrammeId(programmeId);
  if (!scope) {
    throw new Error(
      `'${programmeId}' is not a real sitting: expected <naplan|icas>-y<year>-<subject> naming a subject that style sets at that year.`,
    );
  }
  return scope;
}
