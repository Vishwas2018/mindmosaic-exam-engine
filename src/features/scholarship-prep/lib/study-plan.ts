export interface StudyPlanDay {
  readonly day: 1 | 2 | 3 | 4 | 5 | 6;
  readonly focus: string;
  readonly minutes: number;
  readonly activity: string;
}

export interface StudyPlan {
  readonly days: readonly StudyPlanDay[];
  readonly totalMinutesPerWeek: number;
}

export function buildStudyPlan(weakSubjects: readonly string[] = []): StudyPlan {
  const days: StudyPlanDay[] = [
    { day: 1, focus: "mathematics", minutes: 60, activity: "lesson" },
    { day: 2, focus: "numerical_reasoning", minutes: 60, activity: "practice_quiz" },
    { day: 3, focus: "verbal_reasoning", minutes: 60, activity: "lesson" },
    { day: 4, focus: "reading_comprehension", minutes: 60, activity: "practice_quiz" },
    { day: 5, focus: "written_expression", minutes: 60, activity: "writing_task" },
    { day: 6, focus: weakSubjects[0] ?? "mixed_revision", minutes: 60, activity: "revision" },
  ];
  return { days, totalMinutesPerWeek: 360 };
}

export function recommendNextFocus(weakSubjects: readonly string[]) {
  return weakSubjects.length > 0 ? weakSubjects[0] : "mathematics";
}
