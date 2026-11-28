"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Play } from "lucide-react";

import {
  VIHAAN_CONCEPT_LESSONS,
  type VihaanConceptLesson,
} from "../content/concept-lessons";

const SUBJECT_TABS = [
  { key: "all", label: "All subjects" },
  { key: "numeracy", label: "Mathematics" },
  { key: "numerical_reasoning", label: "Numerical Reasoning" },
  { key: "verbal_reasoning", label: "Verbal Reasoning" },
  { key: "reading", label: "Reading Comprehension" },
  { key: "writing", label: "Written Expression" },
] as const;

export function VihaanConceptLearning({
  onPractiseLesson,
}: {
  onPractiseLesson?: (lesson: VihaanConceptLesson) => void;
}) {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [expandedLessonId, setExpandedLessonId] = useState<string>(
    VIHAAN_CONCEPT_LESSONS[0]?.id ?? "",
  );

  const visibleLessons =
    selectedSubject === "all"
      ? VIHAAN_CONCEPT_LESSONS
      : VIHAAN_CONCEPT_LESSONS.filter((lesson) => lesson.subject === selectedSubject);

  return (
    <section
      data-testid="vihaan-concept-learning"
      className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink">Concept learning & worked examples</h2>
        </div>
        <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          {VIHAAN_CONCEPT_LESSONS.length} lessons · Worked examples
        </span>
      </div>

      <p className="text-sm text-mm-muted">
        Start each 60-minute session with a focused 15-minute concept guide and worked example,
        then launch targeted adaptive practice directly on that skill.
      </p>

      <div className="flex flex-wrap gap-2">
        {SUBJECT_TABS.map((tab) => {
          const active = selectedSubject === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              data-testid={`concept-tab-${tab.key}`}
              onClick={() => setSelectedSubject(tab.key)}
              className={`rounded-btn border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-mm-line bg-mm-page/50 text-ink hover:border-primary/40 hover:bg-mm-tint"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {visibleLessons.map((lesson) => {
          const isOpen = expandedLessonId === lesson.id;
          return (
            <div
              key={lesson.id}
              data-testid={`concept-lesson-${lesson.id}`}
              className="rounded-xl border border-mm-line bg-mm-page/40 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-mm-line bg-white px-2 py-0.5 text-[10px] font-semibold text-mm-muted">
                      {lesson.subjectLabel}
                    </span>
                    <span className="text-[11px] text-mm-muted">{lesson.durationMinutes} min</span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-ink">{lesson.title}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid={`concept-toggle-${lesson.id}`}
                    onClick={() => setExpandedLessonId(isOpen ? "" : lesson.id)}
                    className="inline-flex items-center gap-1 rounded-btn border border-mm-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary/40"
                  >
                    {isOpen ? (
                      <>
                        Hide example <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </>
                    ) : (
                      <>
                        View worked example{" "}
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                  {onPractiseLesson && (
                    <button
                      type="button"
                      data-testid={`concept-practice-${lesson.id}`}
                      onClick={() => onPractiseLesson(lesson)}
                      className="inline-flex items-center gap-1 rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      Practise this concept
                    </button>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="space-y-3 border-t border-mm-line/80 pt-3 text-xs">
                  <p className="text-ink leading-relaxed">{lesson.summary}</p>
                  <div className="rounded-lg border border-mm-line bg-white p-3.5 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">
                      Worked example
                    </p>
                    <p className="font-semibold text-ink">{lesson.workedExample.problem}</p>
                    <ol className="list-decimal space-y-1 pl-4 text-ink">
                      {lesson.workedExample.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                    <p className="font-semibold text-emerald-700">
                      Result: {lesson.workedExample.answer}
                    </p>
                  </div>
                  <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-amber-950">
                    <span className="font-semibold">Watch out for:</span> {lesson.commonTrap}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
