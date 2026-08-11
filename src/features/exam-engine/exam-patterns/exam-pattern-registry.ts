import type { ExamStyle, YearLevel } from "@/schemas/question.schema";

import { examPatternSchema, type ExamPattern } from "./exam-pattern";

/**
 * Every practice-paper shape the product offers, transcribed from
 * `docs/content-status/exam-patterns.md` v3 §2 and §3. Nothing here is
 * inferred: the NAPLAN counts follow the 2025 technical report and the ICAS
 * counts and durations are the published Paper A / Paper C figures. See the
 * doc's §7 for the sources.
 *
 * Labels follow the doc's §1 wording exactly — "full-length practice",
 * "practice module". Nothing here is a "real paper", an "official paper" or a
 * "simulation", and no label says so.
 *
 * The writing patterns are registered and deferred (the doc's ⏸️): a writing
 * task is rubric-marked and the selection engine has no writing-only filter,
 * so they are visible as planned work and are never startable.
 */

/* NAPLAN's language conventions paper is spelling, then grammar and
   punctuation. The real split inside that half is roughly 18-19 grammar to
   8-9 punctuation, and the doc is explicit that this platform must NOT fake
   that subdivision — so one source covers the whole half.

   This used to enumerate four strands, because the platform's internal
   taxonomy split grammar across "Grammar", "Parts of speech" and "Text
   structure" and the half had to be described as "everything that is not
   spelling and not vocabulary". Since the official NAPLAN taxonomy landed
   (fidelity backlog item 3) the conventions paper has exactly three strands
   — Spelling, Grammar, Punctuation — so the half IS Grammar plus
   Punctuation, stated directly rather than by exclusion. Vocabulary is no
   longer listed here because it is no longer a NAPLAN conventions strand at
   all: the backlog's finding was that it had been mis-filed, and the
   migration moved it out. */
const GRAMMAR_AND_PUNCTUATION_STRANDS = ["Grammar", "Punctuation"];

const NAPLAN_LANGUAGE_ADAPTATIONS = [
  "fixed_path",
  "text_only_spelling",
  "no_section_lock",
] as const;

function naplanLanguagePattern(yearLevel: 3 | 5): unknown {
  const programmeId = `naplan-y${yearLevel}-language`;
  return {
    id: `naplan-y${yearLevel}-language-full`,
    label: `NAPLAN-style Year ${yearLevel} Language Conventions — full-length practice`,
    examStyle: "naplan_style",
    yearLevel,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: [...NAPLAN_LANGUAGE_ADAPTATIONS],
    questionCount: 52,
    timeMinutes: 45,
    sources: [
      {
        id: "spelling",
        programmeId,
        count: 25,
        filters: { strandIn: ["Spelling"] },
        display: "section",
      },
      {
        id: "grammar-and-punctuation",
        programmeId,
        count: 27,
        filters: { strandIn: GRAMMAR_AND_PUNCTUATION_STRANDS },
        display: "section",
      },
    ],
    sectionOrder: [
      { id: "spelling", label: "Spelling", sourceIds: ["spelling"], locked: false },
      {
        id: "grammar-and-punctuation",
        label: "Grammar and punctuation",
        sourceIds: ["grammar-and-punctuation"],
        locked: false,
      },
    ],
  };
}

const NAPLAN_PATTERNS: readonly unknown[] = [
  {
    id: "naplan-y3-numeracy-full",
    label: "NAPLAN-style Year 3 Numeracy — full-length practice",
    examStyle: "naplan_style",
    yearLevel: 3,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: ["fixed_path"],
    questionCount: 36,
    timeMinutes: 45,
    sources: [
      { id: "numeracy", programmeId: "naplan-y3-numeracy", count: 36, display: "merged" },
    ],
  },
  {
    id: "naplan-y3-reading-full",
    label: "NAPLAN-style Year 3 Reading — full-length practice",
    examStyle: "naplan_style",
    yearLevel: 3,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: ["fixed_path"],
    questionCount: 39,
    timeMinutes: 45,
    sources: [
      { id: "reading", programmeId: "naplan-y3-reading", count: 39, display: "merged" },
    ],
    stimulusRule: {
      selectWholeGroup: true,
      questionsPerStimulus: [4, 7],
      distinctStimuli: [6, 7],
    },
  },
  naplanLanguagePattern(3),
  {
    id: "naplan-y5-numeracy-full",
    label: "NAPLAN-style Year 5 Numeracy — full-length practice",
    examStyle: "naplan_style",
    yearLevel: 5,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: ["fixed_path"],
    questionCount: 42,
    timeMinutes: 50,
    sources: [
      { id: "numeracy", programmeId: "naplan-y5-numeracy", count: 42, display: "merged" },
    ],
  },
  {
    id: "naplan-y5-reading-full",
    label: "NAPLAN-style Year 5 Reading — full-length practice",
    examStyle: "naplan_style",
    yearLevel: 5,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: ["fixed_path"],
    questionCount: 39,
    timeMinutes: 50,
    sources: [
      { id: "reading", programmeId: "naplan-y5-reading", count: 39, display: "merged" },
    ],
    stimulusRule: {
      selectWholeGroup: true,
      questionsPerStimulus: [4, 7],
      distinctStimuli: [6, 6],
    },
  },
  naplanLanguagePattern(5),
  {
    id: "naplan-y3-writing-deferred",
    label: "NAPLAN-style Year 3 Writing — full-length practice",
    examStyle: "naplan_style",
    yearLevel: 3,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: ["fixed_path"],
    questionCount: 1,
    timeMinutes: 40,
    sources: [
      { id: "writing", programmeId: "naplan-y3-writing", count: 1, display: "merged" },
    ],
    status: "deferred",
  },
  {
    id: "naplan-y5-writing-deferred",
    label: "NAPLAN-style Year 5 Writing — full-length practice",
    examStyle: "naplan_style",
    yearLevel: 5,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: ["fixed_path"],
    questionCount: 1,
    timeMinutes: 42,
    sources: [
      { id: "writing", programmeId: "naplan-y5-writing", count: 1, display: "merged" },
    ],
    status: "deferred",
  },
];

/*
 * ICAS English is ONE assessment. The 27/18 and 30/20 allocations below are
 * MindMosaic source-bank quotas, not published ICAS section counts — hence
 * `display: "merged"` on both sources, no sectionOrder, and
 * `internal_english_mix`. The child sits one undivided English paper; nothing
 * in the UI may render these two numbers as sections.
 */
function icasEnglishPattern(
  yearLevel: 3 | 5,
  paper: "A" | "C",
  readingCount: number,
  languageCount: number,
  questionCount: number,
  timeMinutes: number,
): unknown {
  return {
    id: `icas-y${yearLevel}-english-full`,
    label: `ICAS-style Year ${yearLevel} English — full-length practice`,
    examStyle: "icas_style",
    yearLevel,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: ["internal_english_mix"],
    questionCount,
    timeMinutes,
    sources: [
      {
        id: `paper-${paper.toLowerCase()}-comprehension`,
        programmeId: `icas-y${yearLevel}-reading`,
        count: readingCount,
        display: "merged",
      },
      {
        id: `paper-${paper.toLowerCase()}-syntax-vocabulary`,
        programmeId: `icas-y${yearLevel}-language`,
        count: languageCount,
        display: "merged",
      },
    ],
  };
}

/**
 * A single-programme ICAS English half. Never an English paper: ICAS sets one
 * English assessment, so half of it is a practice module with an internal
 * basis — the count and time are this half's share of the combined pattern,
 * not any published figure.
 */
function icasEnglishModule(
  yearLevel: 3 | 5,
  half: "reading" | "language",
  count: number,
  timeMinutes: number,
): unknown {
  const label = half === "reading" ? "Reading" : "Language";
  return {
    id: `icas-y${yearLevel}-${half}-module`,
    label: `ICAS-style Year ${yearLevel} ${label} — practice module`,
    examStyle: "icas_style",
    yearLevel,
    presentation: "practice_module",
    basis: "internal",
    adaptations: [],
    questionCount: count,
    timeMinutes,
    sources: [
      {
        id: half,
        programmeId: `icas-y${yearLevel}-${half}`,
        count,
        display: "merged",
      },
    ],
  };
}

function icasSubjectPattern(
  yearLevel: 3 | 5,
  subject: "numeracy" | "science" | "digital_technologies" | "spelling",
  label: string,
  questionCount: number,
  timeMinutes: number,
): unknown {
  return {
    id: `icas-y${yearLevel}-${subject.replaceAll("_", "-")}-full`,
    label: `ICAS-style Year ${yearLevel} ${label} — full-length practice`,
    examStyle: "icas_style",
    yearLevel,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    /* The Spelling Bee officially requires audio and headphones; this
       platform delivers it as text. Everything else in this family has no
       adaptation from the four the doc enumerates. */
    adaptations: subject === "spelling" ? ["text_only_spelling"] : [],
    questionCount,
    timeMinutes,
    sources: [
      {
        id: subject,
        programmeId: `icas-y${yearLevel}-${subject}`,
        count: questionCount,
        display: "merged",
      },
    ],
  };
}

const ICAS_PATTERNS: readonly unknown[] = [
  icasEnglishPattern(3, "A", 27, 18, 45, 45),
  icasSubjectPattern(3, "numeracy", "Mathematics", 40, 45),
  icasSubjectPattern(3, "science", "Science", 30, 45),
  icasSubjectPattern(3, "digital_technologies", "Digital Technologies", 30, 30),
  icasSubjectPattern(3, "spelling", "Spelling Bee", 40, 40),
  icasEnglishModule(3, "reading", 27, 27),
  icasEnglishModule(3, "language", 18, 18),
  {
    id: "icas-y3-writing-deferred",
    label: "ICAS-style Year 3 Writing — full-length practice",
    examStyle: "icas_style",
    yearLevel: 3,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: [],
    questionCount: 1,
    timeMinutes: 35,
    sources: [
      { id: "writing", programmeId: "icas-y3-writing", count: 1, display: "merged" },
    ],
    status: "deferred",
  },
  icasEnglishPattern(5, "C", 30, 20, 50, 50),
  icasSubjectPattern(5, "numeracy", "Mathematics", 40, 45),
  icasSubjectPattern(5, "science", "Science", 40, 55),
  icasSubjectPattern(5, "digital_technologies", "Digital Technologies", 35, 35),
  icasSubjectPattern(5, "spelling", "Spelling Bee", 45, 40),
  icasEnglishModule(5, "reading", 30, 30),
  icasEnglishModule(5, "language", 20, 20),
  {
    id: "icas-y5-writing-deferred",
    label: "ICAS-style Year 5 Writing — full-length practice",
    examStyle: "icas_style",
    yearLevel: 5,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: [],
    questionCount: 1,
    timeMinutes: 35,
    sources: [
      { id: "writing", programmeId: "icas-y5-writing", count: 1, display: "merged" },
    ],
    status: "deferred",
  },
];

/**
 * Validated at module load, not only in a test: an invalid registry should be
 * a boot failure everywhere it is imported, rather than something the suite
 * notices later. The unit test asserts the *rules* still bite.
 */
function validateRegistry(candidates: readonly unknown[]): readonly ExamPattern[] {
  const patterns = candidates.map((candidate) => examPatternSchema.parse(candidate));
  const seen = new Set<string>();
  for (const pattern of patterns) {
    if (seen.has(pattern.id)) {
      throw new Error(`Exam pattern registry has a duplicate id '${pattern.id}'.`);
    }
    seen.add(pattern.id);
  }
  return patterns;
}

export const EXAM_PATTERNS: readonly ExamPattern[] = validateRegistry([
  ...NAPLAN_PATTERNS,
  ...ICAS_PATTERNS,
]);

/** Patterns a child can actually sit — deferred entries excluded. */
export const STARTABLE_EXAM_PATTERNS: readonly ExamPattern[] = EXAM_PATTERNS.filter(
  (pattern) => pattern.status === "available",
);

export function getExamPattern(patternId: string): ExamPattern | undefined {
  return EXAM_PATTERNS.find((pattern) => pattern.id === patternId);
}

/**
 * The picker's grouping, computed once here rather than as three nested
 * `filter` calls in JSX: year level, then exam type, then the patterns in
 * registry order (full-length papers before practice modules before deferred).
 */
export interface ExamPatternGroup {
  readonly examStyle: ExamStyle;
  readonly patterns: readonly ExamPattern[];
}

export interface ExamPatternYearGroup {
  readonly yearLevel: YearLevel;
  readonly styles: readonly ExamPatternGroup[];
}

const STYLE_ORDER: readonly ExamStyle[] = ["naplan_style", "icas_style"];

export function groupExamPatterns(
  patterns: readonly ExamPattern[] = EXAM_PATTERNS,
): readonly ExamPatternYearGroup[] {
  const yearLevels = [...new Set(patterns.map((pattern) => pattern.yearLevel))].sort(
    (a, b) => a - b,
  );
  return yearLevels.map((yearLevel) => ({
    yearLevel,
    styles: STYLE_ORDER.flatMap((examStyle) => {
      const forStyle = patterns.filter(
        (pattern) => pattern.yearLevel === yearLevel && pattern.examStyle === examStyle,
      );
      return forStyle.length === 0 ? [] : [{ examStyle, patterns: forStyle }];
    }),
  }));
}
