import type {
  ExamBankId,
  ExamStyleFilter,
  SubjectFilter,
  YearLevelFilter,
} from "@/features/exam-engine/selection";

export type ProgramStatus = "live" | "coming_soon";

/**
 * Carried for future Phase-6 entitlement gating; NOT enforced yet. Every
 * program today is effectively "free" whether or not this field is set —
 * no catalogue program below sets planTier to "premium", so
 * isProgramLocked (../entitlement.ts) never locks anything in production
 * until a program actually opts in.
 */
export type PlanTier = "free" | "premium";

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
   * catalogue.test.ts).
   *
   * Must never be "practice" for a program that did not already start there:
   * "practice" includes the ~1,100 auto-generated seeds that have never been
   * through the publication gates, and ungated content must not be what a
   * child sees by default. Use "published" (curated + factory-published, all
   * gate-passed) for that; the toggle still lets a learner opt into the seed
   * pool deliberately.
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
 * initialBankId history, and why the two groups differ:
 *
 * The five NAPLAN programs below start from "published" (curated 100 +
 * factory-published 288 = 388, every item gate-passed, no seeds). They used to
 * start from "curated", which predated the first real question-factory
 * publication run and meant they could never serve any published content.
 * Moving them straight to "practice" would have fixed reachability but made
 * ~1,100 ungated auto-generated seeds their DEFAULT pool, which is worse than
 * the problem it solved — hence the separate "published" bank.
 *
 * The remaining five — icas-g3-numeracy, icas-g3-reading, icas-g3-language,
 * icas-g5-reading and icas-g5-language — used to start from "practice". They
 * no longer do. Every scoped program now pins "published", and NOTHING in
 * this catalogue may pin "practice".
 *
 * Why they moved: pinning "practice" pre-ticked the configurator's
 * "include the extended practice bank" checkbox, because that checkbox
 * initialised from this field. So the ~1,100 ungated seeds were those five
 * programs' DEFAULT pool — the exact thing the ProgramScope docblock above
 * forbids — and it stopped being theoretical when a real Grade 3 child sat
 * two exams in which 28 of 30 questions came from the seed pool, and again
 * when a Grade 5 child was served the same default.
 *
 * The checkbox no longer reads this field at all (it always starts
 * unticked), so "practice" here would now be dead configuration as well as
 * a policy violation. The toggle still lets a learner opt in deliberately.
 *
 * The cost is real and is accepted: "published" cannot yet fill every exam
 * length the configurator offers for these five, and selectExamQuestions
 * hard-fails with "insufficient_questions" rather than serving a short exam.
 * Those lengths now read as unavailable, with the configurator naming the
 * opt-in that would cover them. Eligible under "published" against the
 * 30-question option:
 *
 *   icas-g3-numeracy    7 of 30   (curated 7, published 0)
 *   icas-g3-reading     1 of 30   (curated 1, published 0)
 *   icas-g3-language    4 of 30   (curated 4, published 0)
 *   icas-g5-reading    18 of 30   (curated 1, published 17)
 *   icas-g5-language   13 of 30   (curated 5, published 8)
 *
 * Every one of those is closed by publishing more ICAS-style content for
 * that grade and subject — not by changing this file. Note the first three
 * have received nothing at all from the factory-published 288.
 *
 * naplan-g3-language and icas-g5-numeracy moved to "published" once their
 * gated pools reached 34 and 39 eligible questions respectively, which
 * covers every offered length.
 *
 * Both moves are additive: practiceExamBank and publishedExamBank each spread
 * questionBank (see src/content/questions/practice-bank.ts), so the curated
 * 100 remain in every pool and no question is lost.
 */
const SCOPED_LIVE_PROGRAMS: readonly Program[] = [
  {
    id: "naplan-g3-numeracy",
    slug: "naplan-g3-numeracy",
    name: "NAPLAN-style Numeracy — Grade 3",
    blurb: "Number, measurement, geometry and problem-solving practice.",
    status: "live",
    scope: { yearLevel: 3, examStyle: NAPLAN_STYLE, subject: "numeracy", initialBankId: "published" },
  },
  {
    id: "naplan-g3-reading",
    slug: "naplan-g3-reading",
    name: "NAPLAN-style Reading — Grade 3",
    blurb: "Original comprehension passages with reasoning-focused questions.",
    status: "live",
    scope: { yearLevel: 3, examStyle: NAPLAN_STYLE, subject: "reading", initialBankId: "published" },
  },
  {
    id: "naplan-g3-language",
    slug: "naplan-g3-language",
    name: "NAPLAN-style Language Conventions — Grade 3",
    blurb: "Spelling, grammar and punctuation practice.",
    status: "live",
    scope: { yearLevel: 3, examStyle: NAPLAN_STYLE, subject: "language", initialBankId: "published" },
  },
  {
    id: "naplan-g5-numeracy",
    slug: "naplan-g5-numeracy",
    name: "NAPLAN-style Numeracy — Grade 5",
    blurb: "Multi-step number, measurement, geometry and problem solving.",
    status: "live",
    scope: { yearLevel: 5, examStyle: NAPLAN_STYLE, subject: "numeracy", initialBankId: "published" },
  },
  {
    id: "naplan-g5-reading",
    slug: "naplan-g5-reading",
    name: "NAPLAN-style Reading — Grade 5",
    blurb: "Original comprehension passages with reasoning-focused questions.",
    status: "live",
    scope: { yearLevel: 5, examStyle: NAPLAN_STYLE, subject: "reading", initialBankId: "published" },
  },
  {
    id: "naplan-g5-language",
    slug: "naplan-g5-language",
    name: "NAPLAN-style Language Conventions — Grade 5",
    blurb: "Spelling, grammar and punctuation practice.",
    status: "live",
    scope: { yearLevel: 5, examStyle: NAPLAN_STYLE, subject: "language", initialBankId: "published" },
  },
  {
    id: "icas-g3-numeracy",
    slug: "icas-g3-numeracy",
    name: "ICAS-style Mathematics — Grade 3",
    blurb: "Challenge-oriented mathematical reasoning and problem solving.",
    status: "live",
    scope: { yearLevel: 3, examStyle: ICAS_STYLE, subject: "numeracy", initialBankId: "published" },
  },
  {
    id: "icas-g3-reading",
    slug: "icas-g3-reading",
    name: "ICAS-style English: Reading — Grade 3",
    blurb: "Reasoning-focused reading practice with original passages.",
    status: "live",
    scope: { yearLevel: 3, examStyle: ICAS_STYLE, subject: "reading", initialBankId: "published" },
  },
  {
    id: "icas-g3-language",
    slug: "icas-g3-language",
    name: "ICAS-style English: Language — Grade 3",
    blurb: "Reasoning-focused spelling, grammar and punctuation practice.",
    status: "live",
    scope: { yearLevel: 3, examStyle: ICAS_STYLE, subject: "language", initialBankId: "published" },
  },
  {
    id: "icas-g5-numeracy",
    slug: "icas-g5-numeracy",
    name: "ICAS-style Mathematics — Grade 5",
    blurb: "Challenge-oriented mathematical reasoning and problem solving.",
    status: "live",
    scope: { yearLevel: 5, examStyle: ICAS_STYLE, subject: "numeracy", initialBankId: "published" },
  },
  {
    id: "icas-g5-reading",
    slug: "icas-g5-reading",
    name: "ICAS-style English: Reading — Grade 5",
    blurb: "Reasoning-focused reading practice with original passages.",
    status: "live",
    scope: { yearLevel: 5, examStyle: ICAS_STYLE, subject: "reading", initialBankId: "published" },
  },
  {
    id: "icas-g5-language",
    slug: "icas-g5-language",
    name: "ICAS-style English: Language — Grade 5",
    blurb: "Reasoning-focused spelling, grammar and punctuation practice.",
    status: "live",
    scope: { yearLevel: 5, examStyle: ICAS_STYLE, subject: "language", initialBankId: "published" },
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
  /* Renamed from "Mixed practice", which read as a thirteenth fixed program
     sitting among twelve others. It is a different pathway — the unscoped
     configurator — and BuildYourOwnCard presents it as one. The slug is
     unchanged: /practice/mixed-practice is a live URL and e2e specs, the
     catalogue tests and any existing link all resolve through it. */
  name: "Build your own practice",
  blurb:
    "Choose the grade, subject, assessment style and length yourself — including writing tasks.",
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
  /*
   * "SAT Prep" (US college-entrance preparation) was removed. Every other
   * entry in this catalogue, live or planned, is Australian primary-school
   * assessment for Years 3 and 5; advertising a US college test to that
   * audience promised a product this one is not, and put an unsupported
   * roadmap claim on the page. The other three planned entries stay: they
   * are all Australian primary maths extension, which is a plausible next
   * step from what already ships.
   */
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
