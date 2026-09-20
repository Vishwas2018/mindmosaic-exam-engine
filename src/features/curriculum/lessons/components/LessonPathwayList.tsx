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
    <div className="grid gap-5">
      {/* Pathway Header Banner */}
      <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary-tint/50 via-white to-teal-light/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-vietnam text-xs font-bold uppercase tracking-wider text-primary">
              Structured Pathway &middot; Victorian Curriculum v2.0
            </span>
          </div>

          {previewMode && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-border bg-amber-light px-3 py-1 text-xs font-bold text-amber-accent">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Draft Review Mode</span>
            </span>
          )}
        </div>

        <h3 className="mt-3 font-jakarta text-xl font-bold text-plum-dark sm:text-2xl">
          {pathway.title}
        </h3>
        <p className="mt-1.5 max-w-3xl font-vietnam text-[15px] leading-relaxed text-plum-muted">
          {pathway.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 font-vietnam text-xs font-bold text-plum-muted">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            {pathway.nodes.length} Structured Lessons
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            Concepts, Worked Examples &amp; Misconceptions
          </span>
          {totalPracticeQuestions > 0 && (
            <>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4 text-teal-accent" aria-hidden="true" />
                {totalPracticeQuestions} Aligned Practice Question
                {totalPracticeQuestions === 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Sequenced Lesson Cards */}
      <ol className="grid gap-3.5 sm:grid-cols-1">
        {pathway.nodes.map((node, index) => {
          const lessonHref = `/student/learn/lessons/${node.curriculumCode}`;
          const drillHref = `/practice/session?curriculumCode=${encodeURIComponent(
            node.curriculumCode,
          )}&count=5`;
          const hasDigitalPractice = !node.isClassroomOnly && node.questionCount > 0;

          return (
            <li
              key={node.curriculumCode}
              className="group relative overflow-hidden rounded-2xl border border-parchment-border bg-white p-5 shadow-warm-sm transition-all hover:border-primary/40 hover:shadow-warm-card sm:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="grid gap-2">
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 font-vietnam text-xs font-bold">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary font-mono text-[11px] text-white">
                      {index + 1}
                    </span>
                    <span className="font-mono uppercase tracking-wider text-primary">
                      {node.curriculumCode}
                    </span>
                    <span className="text-parchment-border">&bull;</span>
                    <span className="inline-flex items-center gap-1 text-plum-muted">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {node.estimatedMinutes} mins
                    </span>
                    <span className="text-parchment-border">&bull;</span>
                    {node.isClassroomOnly ? (
                      <span className="inline-flex items-center gap-1 rounded border border-primary/20 bg-primary-tint px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <School className="h-3 w-3" aria-hidden="true" />
                        Classroom-only skill
                      </span>
                    ) : (
                      <span className="rounded border border-teal-border bg-teal-light px-2 py-0.5 text-[11px] font-semibold text-teal-accent">
                        {node.questionCount} practice question{node.questionCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  {/* Title & Intention */}
                  <h4 className="font-jakarta text-lg font-bold text-plum-dark transition-colors group-hover:text-primary">
                    <Link
                      href={lessonHref}
                      className="focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      {node.title}
                    </Link>
                  </h4>
                  <p className="font-vietnam text-[14.5px] leading-relaxed text-plum-muted">
                    {node.learningIntention}
                  </p>

                  {/* Prerequisites */}
                  {node.prerequisites.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 font-vietnam text-xs text-plum-muted">
                      <span className="font-semibold">Prerequisites:</span>
                      {node.prerequisites.map((prereq) => (
                        <Link
                          key={prereq}
                          href={`/student/learn/lessons/${prereq}`}
                          className="font-mono text-primary hover:underline"
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
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-primary px-4 font-jakarta text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span>Start Lesson</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  {hasDigitalPractice ? (
                    <Link
                      href={drillHref}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-parchment-border bg-white px-3 font-vietnam text-xs font-bold text-plum-dark hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <PlayCircle className="h-3.5 w-3.5 text-teal-accent" aria-hidden="true" />
                      <span>Practise drill</span>
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-[38px] items-center gap-1.5 px-3 font-vietnam text-xs font-semibold text-plum-muted">
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
