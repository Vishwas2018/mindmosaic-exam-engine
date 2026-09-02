"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  FlaskConical,
  GraduationCap,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import type { LessonPathway } from "../types";

interface LessonPathwayListProps {
  pathway: LessonPathway;
  previewMode?: boolean;
}

export function LessonPathwayList({
  pathway,
  previewMode = false,
}: LessonPathwayListProps) {
  const onlinePracticeLessonCount = pathway.nodes.filter(
    (node) => node.practiceHref !== undefined,
  ).length;
  const classroomLessonCount = pathway.nodes.filter(
    (node) => node.practiceStatus === "classroom_only",
  ).length;
  const governedQuestionCount = pathway.nodes.reduce(
    (total, node) => total + node.questionCount,
    0,
  );

  return (
    <div className="grid gap-6">
      <div className="overflow-hidden rounded-2xl border border-mm-brand/30 bg-gradient-to-r from-mm-brand/5 via-white to-mm-tint/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-mm-brand text-white">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-mm-brand">
              Victorian Curriculum F-10 Version 2.0
            </span>
          </div>

          {previewMode && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
              <FlaskConical className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              <span>Draft Review Mode</span>
            </span>
          )}
        </div>

        <h4 className="mt-3 text-xl font-bold text-mm-ink sm:text-2xl">
          {pathway.title}
        </h4>
        <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-mm-muted">
          {pathway.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-mm-ink-soft">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-mm-brand" aria-hidden="true" />
            {pathway.nodes.length} structured lessons
          </span>
          <span aria-hidden="true">&middot;</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-mm-brand" aria-hidden="true" />
            Concept explanations and common misconceptions
          </span>
          {governedQuestionCount > 0 && (
            <>
              <span aria-hidden="true">&middot;</span>
              <span className="flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {governedQuestionCount} verified practice questions across{" "}
                {onlinePracticeLessonCount} lessons
              </span>
            </>
          )}
          {classroomLessonCount > 0 && (
            <>
              <span aria-hidden="true">&middot;</span>
              <span>{classroomLessonCount} practised in class</span>
            </>
          )}
        </div>
      </div>

      <ol className="grid gap-4">
        {pathway.nodes.map((node, index) => (
          <li
            key={node.curriculumCode}
            className="group relative overflow-hidden rounded-2xl border border-mm-line bg-white p-5 shadow-sm transition-colors hover:border-mm-brand sm:p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-mm-brand font-mono text-[11px] text-white">
                    {index + 1}
                  </span>
                  <span className="font-mono uppercase tracking-wider text-mm-brand">
                    {node.curriculumCode}
                  </span>
                  <span className="text-mm-line-soft" aria-hidden="true">
                    &middot;
                  </span>
                  <span className="inline-flex items-center gap-1 text-mm-muted">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {node.estimatedMinutes} mins
                  </span>
                  <span className="text-mm-line-soft" aria-hidden="true">
                    &middot;
                  </span>
                  {node.practiceStatus === "classroom_only" ? (
                    <span className="rounded border border-mm-brand/20 bg-mm-tint/50 px-2 py-0.5 text-[11px] font-semibold text-mm-brand-deep">
                      Practised in class
                    </span>
                  ) : node.practiceStatus === "none" ? (
                    <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Lesson only - no online practice
                    </span>
                  ) : (
                    <span
                      className={
                        node.practiceStatus === "partial"
                          ? "rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900"
                          : "rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
                      }
                    >
                      {node.questionCount} verified practice questions
                    </span>
                  )}
                </div>

                <h5 className="text-lg font-bold text-mm-ink transition-colors group-hover:text-mm-brand">
                  <Link
                    href={node.lessonHref}
                    className="focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                  >
                    {node.title}
                  </Link>
                </h5>
                <p className="text-[14.5px] leading-relaxed text-mm-ink-soft">
                  {node.learningIntention}
                </p>

                {node.prerequisites.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-mm-muted">
                    <span className="font-semibold">Prerequisites:</span>
                    {node.prerequisites.map((prerequisite) => (
                      <Link
                        key={prerequisite}
                        href={`/student/learn/lessons/${prerequisite}`}
                        className="font-mono text-mm-brand hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                      >
                        {prerequisite}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2.5 md:mt-0 md:flex-col md:items-end">
                <Link
                  href={node.lessonHref}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-mm-brand px-4 text-sm font-bold text-white transition-colors hover:bg-mm-brand-deep focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                >
                  <span>Start Lesson</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                {node.practiceHref && (
                  <Link
                    href={node.practiceHref}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-mm-line bg-white px-3 text-xs font-bold text-mm-ink transition-colors hover:border-mm-brand hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                  >
                    <PlayCircle
                      className="h-3.5 w-3.5 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>Practise drill</span>
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
