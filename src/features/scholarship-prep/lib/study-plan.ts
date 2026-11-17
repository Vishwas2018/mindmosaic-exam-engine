export interface StudyPlanBlock {
  readonly label: string;
  readonly minutes: number;
  readonly mode: "concept" | "adaptive_practice" | "writing" | "weak_revision" | "timed_sectional";
}

export interface StudyPlanDay {
  readonly day: 1 | 2 | 3 | 4 | 5 | 6;
  readonly focus: string;
  readonly canonicalSubject: string;
  readonly minutes: number;
  readonly activity: string;
  readonly recommendedQuestionCount: number;
  readonly targetTopics: readonly string[];
  readonly blocks: readonly StudyPlanBlock[];
}

export interface StudyPlan {
  readonly days: readonly StudyPlanDay[];
  readonly totalMinutesPerWeek: number;
}

function toCanonicalSubject(focus: string): string {
  switch (focus) {
    case "mathematics":
    case "numeracy":
      return "numeracy";
    case "reading_comprehension":
    case "reading":
      return "reading";
    case "written_expression":
    case "writing":
      return "writing";
    case "numerical_reasoning":
    case "verbal_reasoning":
      return focus;
    default:
      return "mixed";
  }
}

export function buildStudyPlan(
  weakSubjects: readonly string[] = [],
  weakTopics: readonly string[] = [],
): StudyPlan {
  const day6Focus = weakSubjects[0] ?? "mixed_revision";
  const days: StudyPlanDay[] = [
    {
      day: 1,
      focus: "mathematics",
      canonicalSubject: "numeracy",
      minutes: 60,
      activity: "lesson",
      recommendedQuestionCount: 12,
      targetTopics: [],
      blocks: [
        { label: "Concept lesson & worked examples", minutes: 15, mode: "concept" },
        { label: "Adaptive problem solving", minutes: 25, mode: "adaptive_practice" },
        { label: "Timed mathematics sprint (12 items)", minutes: 20, mode: "timed_sectional" },
      ],
    },
    {
      day: 2,
      focus: "numerical_reasoning",
      canonicalSubject: "numerical_reasoning",
      minutes: 60,
      activity: "practice_quiz",
      recommendedQuestionCount: 15,
      targetTopics: [],
      blocks: [
        { label: "Pattern & matrix strategy lesson", minutes: 15, mode: "concept" },
        { label: "Adaptive numerical reasoning", minutes: 25, mode: "adaptive_practice" },
        { label: "Timed pattern drill (15 items)", minutes: 20, mode: "timed_sectional" },
      ],
    },
    {
      day: 3,
      focus: "verbal_reasoning",
      canonicalSubject: "verbal_reasoning",
      minutes: 60,
      activity: "lesson",
      recommendedQuestionCount: 15,
      targetTopics: [],
      blocks: [
        { label: "Analogies & conditional logic guide", minutes: 15, mode: "concept" },
        { label: "Adaptive verbal reasoning", minutes: 25, mode: "adaptive_practice" },
        { label: "Timed vocabulary & deduction sprint", minutes: 20, mode: "timed_sectional" },
      ],
    },
    {
      day: 4,
      focus: "reading_comprehension",
      canonicalSubject: "reading",
      minutes: 60,
      activity: "practice_quiz",
      recommendedQuestionCount: 10,
      targetTopics: [],
      blocks: [
        { label: "Evidence & authorial craft review", minutes: 15, mode: "concept" },
        { label: "Paired passage comprehension sets", minutes: 25, mode: "adaptive_practice" },
        { label: "Timed passage analysis (2 passages)", minutes: 20, mode: "timed_sectional" },
      ],
    },
    {
      day: 5,
      focus: "written_expression",
      canonicalSubject: "writing",
      minutes: 60,
      activity: "writing_task",
      recommendedQuestionCount: 1,
      targetTopics: [],
      blocks: [
        { label: "Structure, persuasive & craft mini-lesson", minutes: 15, mode: "concept" },
        { label: "Timed writing response (15m + plan/edit)", minutes: 25, mode: "writing" },
        { label: "Parent 1–5 rubric check & revision notes", minutes: 20, mode: "weak_revision" },
      ],
    },
    {
      day: 6,
      focus: day6Focus,
      canonicalSubject: toCanonicalSubject(day6Focus),
      minutes: 60,
      activity: "revision",
      recommendedQuestionCount: 12,
      targetTopics: weakTopics,
      blocks: [
        { label: "Weak-topic recap & error log review", minutes: 15, mode: "weak_revision" },
        { label: "Targeted weak-topic adaptive practice", minutes: 25, mode: "adaptive_practice" },
        { label: "Mixed revision check & pacing review", minutes: 20, mode: "timed_sectional" },
      ],
    },
  ];
  return { days, totalMinutesPerWeek: 360 };
}

export function recommendNextFocus(weakSubjects: readonly string[]) {
  return weakSubjects.length > 0 ? weakSubjects[0] : "mathematics";
}
