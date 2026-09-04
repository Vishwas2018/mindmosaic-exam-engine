"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  FlaskConical,
  GraduationCap,
  Sparkles,
  Target,
} from "lucide-react";
import { clsx } from "clsx";
import type { Lesson, LessonSection } from "../schema";
import { isClassroomOnlyCurriculumNode } from "../classroom-only";
import { ClassroomPracticeNotice } from "./ClassroomPracticeNotice";
import { ConceptSection } from "./ConceptSection";
import { WorkedExampleStepper } from "./WorkedExampleStepper";
import { MisconceptionCard } from "./MisconceptionCard";
import { LessonCheckSection } from "./LessonCheckSection";

interface LessonViewProps {
  lesson: Lesson;
  nextLesson?: { curriculumCode: string; title: string };
  availableQuestionsCount?: number;
}

const SECTION_META: Record<LessonSection["kind"], { label: string; icon: typeof BookOpen }> = {
  concept: { label: "Concept", icon: BookOpen },
  worked_example: { label: "Worked example", icon: Sparkles },
  misconception: { label: "Watch out for", icon: AlertCircle },
  check: { label: "Check yourself", icon: Target },
};

/**
 * Which section is currently under the reader's eye, purely for the stage
 * rail's highlight — a scroll-position indicator, not a saved or tracked
 * completion state. It resets on reload and is never persisted, so it
 * cannot be mistaken for per-lesson progress (which this data model does
 * not have — see `LessonPathwayNode.status`, an authoring status only).
 */
function useActiveSectionId(sectionIds: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);

  useEffect(() => {
    /* No IntersectionObserver (very old browser, or a test DOM): leave the
       first section active rather than throwing. */
    if (sectionIds.length <= 1 || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 },
    );
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
}

export function LessonView({
  lesson,
  nextLesson,
  availableQuestionsCount = 5,
}: LessonViewProps) {
  const sectionIds = lesson.sections.map((section) => section.id);
  const activeSectionId = useActiveSectionId(sectionIds);
  const activeIndex = sectionIds.indexOf(activeSectionId ?? "");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Status Bar */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/student/learn"
          className="group inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-mm-brand transition-colors hover:bg-mm-tint/50 hover:text-mm-brand-deep focus-visible:outline-3 focus-visible:outline-mm-brand cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
          <span>Back to Learning Pathway</span>
        </Link>

        {lesson.status === "draft" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
            <FlaskConical className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            <span>Draft Preview Mode</span>
          </span>
        )}
      </nav>

      {/* Lesson Header Card */}
      <header className="mb-8 overflow-hidden rounded-3xl border border-mm-line bg-white p-6 shadow-xs transition-shadow duration-200 hover:shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold uppercase text-mm-muted">
          <span className="font-mono text-xs font-bold tracking-wider text-mm-brand bg-mm-tint/80 px-2.5 py-0.5 rounded-md border border-mm-brand/15">
            {lesson.curriculumCode}
          </span>
          <span className="text-mm-line">•</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-mm-ink font-semibold">{lesson.level}</span>
          <span className="text-mm-line">•</span>
          <span className="capitalize text-mm-ink-soft">{lesson.strand}</span>
          <span className="text-mm-line">•</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-mm-muted border border-slate-200/60 font-medium">
            <Clock className="h-3.5 w-3.5 text-mm-muted" aria-hidden="true" />
            {lesson.estimatedMinutes} mins
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-mm-ink sm:text-3xl lg:text-4xl">
          {lesson.title}
        </h1>

        {/* Learning Intention Banner */}
        <div className="mt-6 rounded-2xl border border-mm-brand/20 bg-gradient-to-br from-mm-tint/40 via-white to-mm-tint/20 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2.5 text-mm-brand font-bold text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-mm-brand text-white shadow-2xs">
              <GraduationCap className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-mm-brand">
              Learning Intention
            </span>
          </div>
          <p className="mt-3 text-[16.5px] font-semibold leading-relaxed text-mm-ink">
            {lesson.learningIntention}
          </p>

          <div className="mt-5 border-t border-mm-brand/10 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-mm-muted">
              Success Criteria:
            </p>
            <ul className="mt-2.5 grid gap-2.5 text-[14.5px] text-mm-ink-soft">
              {lesson.successCriteria.map((criterion, idx) => (
                <li key={idx} className="flex items-start gap-2.5 rounded-lg bg-white/70 p-2.5 border border-mm-line/60">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span className="leading-snug">{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* Sticky stage rail — a reading-position indicator, not a progress
          tracker: it reflects scroll position only, resets on reload, and
          is never saved. */}
      {lesson.sections.length > 1 && (
        <nav
          aria-label="Lesson stages"
          className="sticky top-[80px] z-10 mb-8 overflow-x-auto rounded-2xl border border-mm-line/80 bg-white/90 p-2.5 shadow-xs backdrop-blur-md"
        >
          <ol className="flex min-w-max items-center">
            {lesson.sections.map((section, index) => {
              const meta = SECTION_META[section.kind];
              const isActive = index === activeIndex;
              const isPast = activeIndex >= 0 && index < activeIndex;
              return (
                <li key={section.id} className="flex items-center">
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className={clsx(
                        "h-px w-4 shrink-0 sm:w-8",
                        isPast || isActive ? "bg-mm-brand/40" : "bg-mm-line",
                      )}
                    />
                  )}
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? "step" : undefined}
                    className={clsx(
                      "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-[13px] font-bold transition-all duration-180 focus-visible:outline-2 focus-visible:outline-mm-brand cursor-pointer",
                      isActive
                        ? "bg-mm-brand text-white shadow-xs"
                        : isPast
                          ? "text-mm-brand hover:bg-mm-tint"
                          : "text-mm-ink-soft hover:bg-mm-tint hover:text-mm-brand",
                    )}
                  >
                    <span
                      className={clsx(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                        isActive
                          ? "bg-white/20 text-white"
                          : isPast
                            ? "bg-mm-brand/10 text-mm-brand"
                            : "bg-slate-100 text-mm-muted",
                      )}
                    >
                      {isPast ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}
                    </span>
                    <span className="hidden sm:inline">{meta.label}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Main Lesson Content Sections */}
      <main className="grid gap-8">
        {lesson.sections.map((section) => {
          switch (section.kind) {
            case "concept":
              return <ConceptSection key={section.id} section={section} />;
            case "worked_example":
              return <WorkedExampleStepper key={section.id} section={section} />;
            case "misconception":
              return <MisconceptionCard key={section.id} section={section} />;
            case "check":
              return (
                <LessonCheckSection
                  key={section.id}
                  section={section}
                  availableQuestionsCount={availableQuestionsCount}
                />
              );
            default:
              return null;
          }
        })}
        {isClassroomOnlyCurriculumNode(lesson.curriculumCode) && (
          <ClassroomPracticeNotice />
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-mm-line pt-8">
        <Link
          href="/student/learn"
          className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-mm-line bg-white px-4.5 text-sm font-bold text-mm-ink shadow-2xs transition-all duration-180 hover:border-mm-brand hover:text-mm-brand hover:bg-mm-tint/30 focus-visible:outline-2 focus-visible:outline-mm-brand"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
          <span>All {lesson.level} Lessons</span>
        </Link>

        {nextLesson && (
          <Link
            href={`/student/learn/lessons/${nextLesson.curriculumCode}`}
            className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-mm-brand px-5.5 text-sm font-bold text-white shadow-xs transition-all duration-180 hover:bg-mm-brand-deep hover:shadow-sm active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            <span>Next Lesson: {nextLesson.curriculumCode}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        )}
      </footer>
    </div>
  );
}
