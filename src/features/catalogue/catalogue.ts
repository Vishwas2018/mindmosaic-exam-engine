import type {
  ExamBankId,
  ExamStyleFilter,
  SubjectFilter,
  YearLevelFilter,
} from "@/features/exam-engine/selection";

export type ProgramStatus = "live" | "coming_soon";

/**
 * Carried for future Phase-6 entitlement gating; NOT enforced yet. Every
 * program today is effectively "free" whether or not this field is set.
 */
export type PlanTier = "free";

/**
 * The subset of the real exam selection config a catalogue program can pin.
 * Deliberately excludes "mixed" for each dimension: a *scoped* program's
 * whole purpose is to identify one specific, real combination a learner can
 * recognise (e.g. "NAPLAN-style Grade 3 Numeracy"), not a fuzzy blend.
 */
export interface ProgramScope {
  yearLevel: Exclude<YearLevelFilter, "mixed">;
  examStyle: Exclude<ExamStyleFilter, "mixed">;
  subject: Exclude<SubjectFilter, "mixed">;
  /**
   * Which bank the configurator's "include extended practice bank" toggle
   * starts from for this program. Still a normal, user-editable toggle on
   * the rendered page — this only picks a starting point that is
   * guaranteed non-empty for the program's pinned dimensions (see
   * catalogue.test.ts). Some curated-bank combinations are too thin
   * (single digits) to usefully support the smallest fixed question count,
   * so those programs start from the extended "practice" bank instead.
   */
  initialBankId: ExamBankId;
}

export interface Program {
  id: string;
  /** URL segment: /practice/[slug]. Unique across the whole catalogue. */
  slug: string;
  name: string;
  blurb: string;
  status: ProgramStatus;
  /**
   * Present only for a "live" program that pins a specific combination.
   * Absent for "coming_soon" entries (no route exists for them at all) and
   * for the one "live" generic entry ("Mixed practice") that intentionally
   * renders the configurator completely unscoped, matching the product's
   * original bare-configurator flow.
   */
  scope?: ProgramScope;
  planTier?: PlanTier;
}

const NAPLAN_STYLE = "naplan_style" as const;
const ICAS_STYLE = "icas_style" as const;

/**
 * Live, single-subject programs: NAPLAN-style and ICAS-style, Grade 3 and 5,
 * across the three subjects the real selection filter can isolate on their
 * own (numeracy / reading / language). "Writing" is not offered as its own
 * program: the underlying selection engine only ever surfaces writing
 * content bundled inside subject: "mixed" (see
 * selection/select-questions.ts's SUBJECTS_BY_FILTER — there is no
 * writing-only filter value), and the curated bank has only one writing
 * question per grade/style anyway. Isolating it would mean changing
 * selection logic, which this catalogue is not permitted to do — writing
 * stays reachable the way it always was, via "Mixed practice" below.
 *
 * initialBankId per program is picked from the real bank counts (see
 * catalogue.test.ts and the eligibility dump this was derived from):
 * curated where it comfortably clears the smallest fixed question count
 * (10), the larger auto-generated "practice" bank where curated alone is
 * too thin.
 */
const SCOPED_LIVE_PROGRAMS: readonly Program[] = [
  {
    id: "naplan-g3-numeracy",
    slug: "naplan-g3-numeracy",
    name: "NAPLAN-style Numeracy — Grade 3",
    blurb: "Foundation number, measurement and geometry skills, NAPLAN-style.",
    status: "live",
    scope: { yearLevel: 3, examStyle: NAPLAN_STYLE, subject: "numeracy", initialBankId: "curated" },
  },
  {
    id: "naplan-g3-reading",
    slug: "naplan-g3-reading",
    name: "NAPLAN-style Reading — Grade 3",
    blurb: "Comprehension practice over original Grade 3 passages, NAPLAN-style.",
    status: "live",
    scope: { yearLevel: 3, examStyle: NAPLAN_STYLE, subject: "reading", initialBankId: "curated" },
  },
  {
    id: "naplan-g3-language",
    slug: "naplan-g3-language",
    name: "NAPLAN-style Language Conventions — Grade 3",
    blurb: "Spelling, grammar and punctuation practice, NAPLAN-style.",
    status: "live",
    scope: { yearLevel: 3, examStyle: NAPLAN_STYLE, subject: "language", initialBankId: "practice" },
  },
  {
    id: "naplan-g5-numeracy",
    slug: "naplan-g5-numeracy",
    name: "NAPLAN-style Numeracy — Grade 5",
    blurb: "Multi-step number, measurement and geometry skills, NAPLAN-style.",
    status: "live",
    scope: { yearLevel: 5, examStyle: NAPLAN_STYLE, subject: "numeracy", initialBankId: "curated" },
  },
  {
    id: "naplan-g5-reading",
    slug: "naplan-g5-reading",
    name: "NAPLAN-style Reading — Grade 5",
    blurb: "Comprehension practice over original Grade 5 passages, NAPLAN-style.",
    status: "live",
    scope: { yearLevel: 5, examStyle: NAPLAN_STYLE, subject: "reading", initialBankId: "curated" },
  },
  {
    id: "naplan-g5-language",
    slug: "naplan-g5-language",
    name: "NAPLAN-style Language Conventions — Grade 5",
    blurb: "Spelling, grammar and punctuation practice, NAPLAN-style.",
    status: "live",
    scope: { yearLevel: 5, examStyle: NAPLAN_STYLE, subject: "language", initialBankId: "curated" },
  },
  {
    id: "icas-g3-numeracy",
    slug: "icas-g3-numeracy",
    name: "ICAS-style Mathematics — Grade 3",
    blurb: "Reasoning and challenge-oriented maths problems, ICAS-style.",
    status: "live",
    scope: { yearLevel: 3, examStyle: ICAS_STYLE, subject: "numeracy", initialBankId: "practice" },
  },
  {
    id: "icas-g3-reading",
    slug: "icas-g3-reading",
    name: "ICAS-style English (Reading) — Grade 3",
    blurb: "Reasoning-focused comprehension practice, ICAS-style.",
    status: "live",
    scope: { yearLevel: 3, examStyle: ICAS_STYLE, subject: "reading", initialBankId: "practice" },
  },
  {
    id: "icas-g3-language",
    slug: "icas-g3-language",
    name: "ICAS-style English (Language) — Grade 3",
    blurb: "Reasoning-focused language conventions practice, ICAS-style.",
    status: "live",
    scope: { yearLevel: 3, examStyle: ICAS_STYLE, subject: "language", initialBankId: "practice" },
  },
  {
    id: "icas-g5-numeracy",
    slug: "icas-g5-numeracy",
    name: "ICAS-style Mathematics — Grade 5",
    blurb: "Reasoning and challenge-oriented maths problems, ICAS-style.",
    status: "live",
    scope: { yearLevel: 5, examStyle: ICAS_STYLE, subject: "numeracy", initialBankId: "practice" },
  },
  {
    id: "icas-g5-reading",
    slug: "icas-g5-reading",
    name: "ICAS-style English (Reading) — Grade 5",
    blurb: "Reasoning-focused comprehension practice, ICAS-style.",
    status: "live",
    scope: { yearLevel: 5, examStyle: ICAS_STYLE, subject: "reading", initialBankId: "practice" },
  },
  {
    id: "icas-g5-language",
    slug: "icas-g5-language",
    name: "ICAS-style English (Language) — Grade 5",
    blurb: "Reasoning-focused language conventions practice, ICAS-style.",
    status: "live",
    scope: { yearLevel: 5, examStyle: ICAS_STYLE, subject: "language", initialBankId: "practice" },
  },
];

/**
 * The generic escape hatch: today's original bare-configurator behaviour,
 * unchanged, reachable as one catalogue card among the rest rather than
 * embedded directly on /practice.
 */
const MIXED_PRACTICE_PROGRAM: Program = {
  id: "mixed-practice",
  slug: "mixed-practice",
  name: "Mixed practice",
  blurb:
    "Build your own set — pick any grade, style, subject and length, including writing tasks.",
  status: "live",
};

const COMING_SOON_PROGRAMS: readonly Program[] = [
  {
    id: "australian-maths-competition",
    slug: "australian-maths-competition",
    name: "Australian Maths Competition",
    blurb: "Competition-style problem solving practice.",
    status: "coming_soon",
  },
  {
    id: "maths-olympiad",
    slug: "maths-olympiad",
    name: "Maths Olympiad",
    blurb: "Olympiad-style extension and enrichment problems.",
    status: "coming_soon",
  },
  {
    id: "singapore-maths",
    slug: "singapore-maths",
    name: "Singapore Maths",
    blurb: "Bar-model and mastery-based maths practice.",
    status: "coming_soon",
  },
  {
    id: "sat-prep",
    slug: "sat-prep",
    name: "SAT Prep",
    blurb: "US college-entrance test preparation.",
    status: "coming_soon",
  },
];

/** The full catalogue: every browsable program, live and coming soon. */
export const PROGRAMS: readonly Program[] = [
  ...SCOPED_LIVE_PROGRAMS,
  MIXED_PRACTICE_PROGRAM,
  ...COMING_SOON_PROGRAMS,
];

export function getProgramBySlug(slug: string): Program | undefined {
  return PROGRAMS.find((program) => program.slug === slug);
}

/** A program a route can actually render: live, whether scoped or not. */
export function isLiveProgram(program: Program): boolean {
  return program.status === "live";
}
