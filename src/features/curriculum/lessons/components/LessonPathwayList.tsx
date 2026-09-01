"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  FlaskConical,
  GraduationCap,
  PlayCircle,
  School,
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
  const totalPracticeQuestions = pathway.nodes.reduce((sum, node) => sum + node.questionCount, 0);

  return (
    <div className="grid gap-6">
      {/* Pathway Header Banner */}
      <div className="overflow-hidden rounded-2xl border border-mm-brand/30 bg-gradient-to-r from-mm-brand/5 via-white to-mm-tint/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-mm-brand text-white">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-mm-brand">
              Structured Pathway · Victorian Curriculum v2.0
            </span>
          </div>

          {previewMode && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
              <FlaskConical className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              <span>Draft Review Mode</span>
            </span>
          )}
        </div>

        <h3 className="mt-3 text-xl font-bold text-mm-ink sm:text-2xl">
          {pathway.title}
        </h3>
        <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-mm-muted">
          {pathway.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-mm-ink-soft">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-mm-brand" aria-hidden="true" />
            {pathway.nodes.length} Structured Lessons
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-mm-brand" aria-hidden="true" />
            Concepts, Worked Examples & Misconceptions
          </span>
          {totalPracticeQuestions > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {totalPracticeQuestions} Aligned Practice Question
                {totalPracticeQuestions === 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Sequenced Lesson Cards */}
      <ol className="grid gap-4 sm:grid-cols-1">
        {pathway.nodes.map((node, index) => {
          const lessonHref = `/student/learn/lessons/${node.curriculumCode}`;
          const drillHref = `/practice/session?curriculumCode=${encodeURIComponent(
            node.curriculumCode,
          )}&count=5`;
          const hasDigitalPractice = !node.isClassroomOnly && node.questionCount > 0;

          return (
            <li
              key={node.curriculumCode}
              className="group relative overflow-hidden rounded-2xl border border-mm-line bg-white p-5 shadow-sm transition-all hover:border-mm-brand hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="grid gap-2">
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-mm-brand text-white font-mono text-[11px]">
                      {index + 1}
                    </span>
                    <span className="font-mono text-mm-brand uppercase tracking-wider">
                      {node.curriculumCode}
                    </span>
                    <span className="text-mm-line-soft">•</span>
                    <span className="inline-flex items-center gap-1 text-mm-muted">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {node.estimatedMinutes} mins
                    </span>
                    <span className="text-mm-line-soft">•</span>
                    {node.isClassroomOnly ? (
                      <span className="inline-flex items-center gap-1 rounded bg-mm-brand/5 px-2 py-0.5 text-[11px] font-semibold text-mm-brand border border-mm-brand/20">
                        <School className="h-3 w-3" aria-hidden="true" />
                        Classroom-only skill
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                        {node.questionCount} practice question{node.questionCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  {/* Title & Intention */}
                  <h4 className="text-lg font-bold text-mm-ink group-hover:text-mm-brand transition-colors">
                    <Link
                      href={lessonHref}
                      className="focus-visible:outline-2 focus-visible:outline-mm-brand"
                    >
                      {node.title}
                    </Link>
                  </h4>
                  <p className="text-[14.5px] leading-relaxed text-mm-ink-soft">
                    {node.learningIntention}
                  </p>

                  {/* Prerequisites */}
                  {node.prerequisites.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-mm-muted">
                      <span className="font-semibold">Prerequisites:</span>
                      {node.prerequisites.map((prereq) => (
                        <Link
                          key={prereq}
                          href={`/student/learn/lessons/${prereq}`}
                          className="font-mono text-mm-brand hover:underline"
                        >
                          {prereq}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-2 flex flex-wrap items-center gap-2.5 md:mt-0 md:flex-col md:items-end">
                  <Link
                    href={lessonHref}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-mm-brand px-4 text-sm font-bold text-white transition-colors hover:bg-mm-brand-deep focus-visible:outline-2 focus-visible:outline-mm-brand"
                  >
                    <span>Start Lesson</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  {hasDigitalPractice ? (
                    <Link
                      href={drillHref}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-mm-line bg-white px-3 text-xs font-bold text-mm-ink hover:border-mm-brand hover:text-mm-brand focus-visible:outline-2 focus-visible:outline-mm-brand"
                    >
                      <PlayCircle className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Practise drill</span>
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-[38px] items-center gap-1.5 px-3 text-xs font-semibold text-mm-muted">
                      {node.isClassroomOnly ? "Practised in class" : "Practice coming soon"}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
