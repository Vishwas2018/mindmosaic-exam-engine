import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { SubjectMastery } from "@/features/student/attempt-summary";

export interface WorthRevisitingTask {
  subjectBadge: string;
  dateLabel?: string;
  title: string;
  curriculumCode: string;
  nationalCode?: string;
  checkInScore?: { correct: number; total: number };
  pedagogicalNote?: string;
  lessonSlug: string;
  learningArea: "Mathematics" | "English";
}

export const GRADE_5_FOCUS_TASKS: readonly WorthRevisitingTask[] = Object.freeze([
  {
    subjectBadge: "Mathematics · Number",
    dateLabel: "14 Oct",
    title: "Adding Fractions with Related Denominators",
    curriculumCode: "VC2M5N05",
    nationalCode: "AC9M5N04",
    checkInScore: { correct: 5, total: 8 },
    pedagogicalNote: "Review fraction slices and common denominators before subtracting.",
    lessonSlug: "VC2M5N05",
    learningArea: "Mathematics",
  },
  {
    subjectBadge: "English · Language",
    dateLabel: "12 Oct",
    title: "Compound Sentences & Subordinating Conjunctions",
    curriculumCode: "VC2E5LA03",
    nationalCode: "AC9E5LY03",
    checkInScore: { correct: 6, total: 9 },
    pedagogicalNote: "Review complex clause connectors ('although', 'whereas', 'unless').",
    lessonSlug: "VC2E5LA03",
    learningArea: "English",
  },
  {
    subjectBadge: "Mathematics · Measurement",
    dateLabel: "8 Oct",
    title: "Angles on a Straight Line & Point",
    curriculumCode: "VC2M5M02",
    nationalCode: "AC9M5M02",
    checkInScore: { correct: 7, total: 10 },
    pedagogicalNote: "Supplementary angles always sum to 180°; full turns equal 360°.",
    lessonSlug: "VC2M5M02",
    learningArea: "Mathematics",
  },
]);

export const GRADE_3_FOCUS_TASKS: readonly WorthRevisitingTask[] = Object.freeze([
  {
    subjectBadge: "Mathematics · Number",
    dateLabel: "14 Oct",
    title: "Fractions: Halves, Quarters and Eighths",
    curriculumCode: "VC2M3N03",
    nationalCode: "AC9M3N03",
    checkInScore: { correct: 5, total: 8 },
    pedagogicalNote: "Model equal parts of a whole with paper strips and number lines.",
    lessonSlug: "VC2M3N03",
    learningArea: "Mathematics",
  },
  {
    subjectBadge: "English · Language",
    dateLabel: "12 Oct",
    title: "Compound Sentences with Conjunctions",
    curriculumCode: "VC2E3LA02",
    nationalCode: "AC9E3LA02",
    checkInScore: { correct: 6, total: 9 },
    pedagogicalNote: "Join two independent clauses using 'for', 'and', 'nor', 'but', 'or', 'yet', 'so'.",
    lessonSlug: "VC2E3LA02",
    learningArea: "English",
  },
  {
    subjectBadge: "Mathematics · Measurement",
    dateLabel: "8 Oct",
    title: "Angles as Measures of Turn",
    curriculumCode: "VC2M3M04",
    nationalCode: "AC9M3M04",
    checkInScore: { correct: 7, total: 10 },
    pedagogicalNote: "Identify right angles, quarter turns, half turns, and full rotations.",
    lessonSlug: "VC2M3M04",
    learningArea: "Mathematics",
  },
]);

interface WorthRevisitingPanelProps {
  revisit?: readonly SubjectMastery[];
  tasks?: readonly WorthRevisitingTask[];
  yearLevel?: number | null;
  learningAreaFilter?: "Mathematics" | "English" | null;
}

/**
 * Worth Revisiting Panel — renders high-yield practice lessons where taking
 * another look builds student confidence, matching the Stitch Learn Hub specifications.
 */
export function WorthRevisitingPanel({
  revisit = [],
  tasks,
  yearLevel = 5,
  learningAreaFilter = null,
}: WorthRevisitingPanelProps) {
  const baseTasks =
    tasks ?? (yearLevel === 3 ? GRADE_3_FOCUS_TASKS : GRADE_5_FOCUS_TASKS);

  const displayTasks = learningAreaFilter
    ? baseTasks.filter((t) => t.learningArea === learningAreaFilter)
    : baseTasks;

  if (displayTasks.length === 0 && revisit.length === 0) {
    return (
      <section aria-labelledby="worth-revisiting-heading" className="flex flex-col gap-4 pb-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-coral-accent" aria-hidden="true" />
          <h2
            id="worth-revisiting-heading"
            className="font-jakarta text-xl font-bold tracking-tight text-plum-dark md:text-2xl"
          >
            Worth revisiting
          </h2>
        </div>
        <div className="rounded-2xl border border-dashed border-parchment-border bg-white p-6 text-center font-vietnam text-sm text-plum-muted">
          Nothing to revisit yet &mdash; past practice questions with room for growth will appear here.
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="worth-revisiting-heading" className="flex flex-col gap-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-coral-accent" aria-hidden="true" />
            <h2
              id="worth-revisiting-heading"
              className="font-jakarta text-xl font-bold tracking-tight text-plum-dark md:text-2xl"
            >
              Worth revisiting
            </h2>
          </div>
          <p className="mt-0.5 font-vietnam text-xs text-plum-muted md:text-sm">
            Past practice questions where taking another look builds confidence.
          </p>
        </div>
        {displayTasks.length > 0 && (
          <span className="rounded-full bg-surface-container px-3 py-1 font-vietnam text-xs font-semibold text-plum-muted">
            {displayTasks.length} Focus Task{displayTasks.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {displayTasks.map((task) => {
          const isMaths = task.learningArea === "Mathematics";
          const codes = [task.nationalCode, task.curriculumCode].filter(Boolean).join(" · ");

          return (
            <article
              key={task.curriculumCode}
              className="flex flex-col justify-between rounded-2xl border border-parchment-border bg-white p-5 shadow-warm-sm transition-shadow hover:shadow-warm-card"
            >
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  {/*
                    text-[#007566] (2026-09 e2e repair): the English badge's
                    original text-teal-accent (#008579) on bg-teal-light
                    measured 4.10:1 — under WCAG 2.1 AA's 4.5:1 minimum for
                    text this size (axe-core color-contrast). This darker
                    shade of the same teal clears 5.08:1.
                  */}
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-vietnam text-[11px] font-semibold uppercase tracking-wide ${
                      isMaths ? "bg-primary-tint text-primary" : "bg-teal-light text-[#007566]"
                    }`}
                  >
                    {task.subjectBadge}
                  </span>
                  {task.dateLabel && (
                    <span className="font-vietnam text-xs text-plum-muted">{task.dateLabel}</span>
                  )}
                </div>

                <h3 className="font-jakarta text-base font-bold text-plum-dark">{task.title}</h3>

                {codes && (
                  <div
                    className={`mb-3 mt-1 font-mono text-xs font-semibold ${
                      isMaths ? "text-primary" : "text-teal-accent"
                    }`}
                  >
                    {codes}
                  </div>
                )}

                <div className="mb-4 rounded-xl bg-surface-container-low p-3">
                  {task.checkInScore && (
                    <div className="mb-1 flex items-center justify-between text-plum-dark">
                      <span className="font-vietnam text-xs font-semibold text-plum-muted">
                        Prior check-in:
                      </span>
                      <span className="font-jakarta text-xs font-bold text-plum-dark">
                        {task.checkInScore.correct} of {task.checkInScore.total} correct
                      </span>
                    </div>
                  )}
                  {task.pedagogicalNote && (
                    <p className="font-vietnam text-xs italic leading-relaxed text-plum-muted">
                      &ldquo;{task.pedagogicalNote}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/*
                bg-[#b33b3f]/hover:bg-[#993336] (2026-09 e2e repair): white
                text on the original bg-coral-accent (#ff555a) measured
                3.13:1, and even bg-coral-hover (#e84449) only reaches
                3.92:1 — both under WCAG 2.1 AA's 4.5:1 minimum (axe-core
                color-contrast). These darker shades of the same coral
                clear 5.81:1 / 7.29:1.
              */}
              <Link
                href={`/student/learn/lessons/${task.lessonSlug}`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b33b3f] font-jakarta text-sm font-bold text-white shadow-warm-sm transition-all hover:bg-[#993336] active:translate-y-0.5"
              >
                <span>Revisit lesson</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
