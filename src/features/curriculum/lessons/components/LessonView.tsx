"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FlaskConical,
  GraduationCap,
} from "lucide-react";
import type { Lesson } from "../schema";
import { ConceptSection } from "./ConceptSection";
import { WorkedExampleStepper } from "./WorkedExampleStepper";
import { MisconceptionCard } from "./MisconceptionCard";
import { LessonCheckSection } from "./LessonCheckSection";

interface LessonViewProps {
  lesson: Lesson;
  nextLesson?: { curriculumCode: string; title: string };
  availableQuestionsCount?: number;
}

export function LessonView({
  lesson,
  nextLesson,
  availableQuestionsCount = 5,
}: LessonViewProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Status Bar */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/student/learn"
          className="inline-flex items-center gap-2 text-sm font-semibold text-mm-brand hover:text-mm-brand-deep focus-visible:outline-2 focus-visible:outline-mm-brand"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Learning Pathway</span>
        </Link>

        {lesson.status === "draft" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
            <FlaskConical className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            <span>Draft Preview Mode</span>
          </span>
        )}
      </nav>

      {/* Lesson Header Card */}
      <header className="mb-8 overflow-hidden rounded-2xl border border-mm-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold uppercase text-mm-muted">
          <span className="font-mono text-mm-brand">{lesson.curriculumCode}</span>
          <span>•</span>
          <span>{lesson.level}</span>
          <span>•</span>
          <span className="capitalize">{lesson.strand}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {lesson.estimatedMinutes} mins
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-mm-ink sm:text-3xl">
          {lesson.title}
        </h1>

        {/* Learning Intention Banner */}
        <div className="mt-6 rounded-xl border border-mm-brand/20 bg-mm-tint/30 p-5">
          <div className="flex items-center gap-2 text-mm-brand font-bold text-sm">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
            <span className="uppercase tracking-wider">Learning Intention</span>
          </div>
          <p className="mt-2 text-[16px] font-semibold text-mm-ink">
            {lesson.learningIntention}
          </p>

          <div className="mt-4 border-t border-mm-line-soft pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-mm-muted">
              Success Criteria:
            </p>
            <ul className="mt-2 grid gap-2 text-sm text-mm-ink-soft">
              {lesson.successCriteria.map((criterion, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

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
      </main>

      {/* Footer Navigation */}
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-mm-line pt-6">
        <Link
          href="/student/learn"
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-mm-line bg-white px-4 text-sm font-bold text-mm-ink hover:border-mm-brand hover:text-mm-brand focus-visible:outline-2 focus-visible:outline-mm-brand"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>All Level 3 Lessons</span>
        </Link>

        {nextLesson && (
          <Link
            href={`/student/learn/lessons/${nextLesson.curriculumCode}`}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-mm-brand px-5 text-sm font-bold text-white hover:bg-mm-brand-deep focus-visible:outline-2 focus-visible:outline-mm-brand"
          >
            <span>Next Lesson: {nextLesson.curriculumCode}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </footer>
    </div>
  );
}
