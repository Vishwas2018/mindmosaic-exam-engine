"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Clock,
  FlaskConical,
  GraduationCap,
  PlayCircle,
  School,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import type { LessonPathway, LessonPathwayNode } from "../types";

interface LessonPathwayListProps {
  pathway: LessonPathway;
  previewMode?: boolean;
  /**
   * Accordion open state — controlled by the parent tab/strand nav on
   * `/student/learn`. Defaults to open when rendered standalone (e.g. the
   * one-off content-review screenshot scripts), matching this component's
   * pre-accordion behaviour for those callers.
   */
  isOpen?: boolean;
  onToggle?: () => void;
}

/** Stable per-pathway ids: `pathway.strand` is unique within a learning area
 *  and strands never repeat across Mathematics/English, so it's safe as a
 *  global DOM-id key on its own. */
function panelId(strand: string): string {
  return `pathway-panel-${strand}`;
}
function headingId(strand: string): string {
  return `pathway-heading-${strand}`;
}

function strandLabel(strand: string): string {
  return strand.charAt(0).toUpperCase() + strand.slice(1);
}

function LessonNodeCard({ node, index }: { node: LessonPathwayNode; index: number }) {
  const [showDetails, setShowDetails] = useState(false);
  const lessonHref = `/student/learn/lessons/${node.curriculumCode}`;
  const drillHref = `/practice/session?curriculumCode=${encodeURIComponent(
    node.curriculumCode,
  )}&count=5`;
  const hasDigitalPractice = !node.isClassroomOnly && node.questionCount > 0;
  const hasPrerequisites = node.prerequisites.length > 0;

  return (
    <li
      id={`lesson-${node.curriculumCode}`}
      className="group relative overflow-hidden rounded-2xl border border-mm-line bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-mm-brand/40 hover:shadow-md scroll-mt-36 sm:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="grid min-w-0 gap-2">
          {/* Row 1 — metadata summary */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-mm-brand to-mm-brand-deep text-white font-mono text-[11px] shadow-xs">
              {index + 1}
            </span>
            <span className="font-mono text-xs font-bold tracking-wider text-mm-brand uppercase bg-mm-tint/60 px-2 py-0.5 rounded-md border border-mm-brand/15">
              {node.curriculumCode}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100/80 px-2 py-0.5 text-mm-muted border border-slate-200/60 font-medium">
              <Clock className="h-3 w-3 text-mm-muted" aria-hidden="true" />
              {node.estimatedMinutes} mins
            </span>
            {node.isClassroomOnly ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-900 border border-indigo-200/80">
                <School className="h-3 w-3 text-indigo-700" aria-hidden="true" />
                Classroom-only skill
              </span>
            ) : node.questionCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                <PlayCircle className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                {node.questionCount} practice question{node.questionCount === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-mm-muted-2 border border-slate-200">
                Coming soon
              </span>
            )}
          </div>

          <h4 className="text-[17.5px] font-bold leading-snug text-mm-ink transition-colors duration-180 group-hover:text-mm-brand">
            <Link
              href={lessonHref}
              className="rounded-md focus-visible:outline-2 focus-visible:outline-mm-brand"
            >
              {node.title}
            </Link>
          </h4>

          {/* Row 2 — intention */}
          <p className="line-clamp-2 text-[14.5px] leading-relaxed text-mm-ink-soft">
            {node.learningIntention}
          </p>

          {/* Prerequisites */}
          {hasPrerequisites && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                aria-expanded={showDetails}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-mm-muted hover:bg-mm-tint/50 hover:text-mm-brand focus-visible:outline-2 focus-visible:outline-mm-brand cursor-pointer transition-colors"
              >
                <ChevronDown
                  className={clsx("h-3.5 w-3.5 transition-transform duration-200", showDetails && "rotate-180 text-mm-brand")}
                  aria-hidden="true"
                />
                {showDetails ? "Hide prerequisites" : `${node.prerequisites.length} prerequisite${node.prerequisites.length === 1 ? "" : "s"}`}
              </button>
              {showDetails && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-mm-line-soft bg-slate-50/70 p-2.5 text-xs text-mm-muted">
                  <span className="font-semibold text-mm-ink-soft">Required prior knowledge:</span>
                  {node.prerequisites.map((prereq) => (
                    <Link
                      key={prereq}
                      href={`/student/learn/lessons/${prereq}`}
                      className="inline-flex items-center rounded-md border border-mm-brand/20 bg-white px-2 py-0.5 font-mono text-xs font-bold text-mm-brand hover:border-mm-brand hover:bg-mm-tint/40 focus-visible:outline-2 focus-visible:outline-mm-brand transition-colors"
                    >
                      {prereq}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-row flex-wrap items-center gap-2.5 pt-1 md:flex-col md:items-end">
          <Link
            href={lessonHref}
            className="group/btn inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-mm-brand px-4.5 text-sm font-bold text-white shadow-xs transition-all duration-200 hover:bg-mm-brand-deep hover:shadow-sm active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            <span>Start lesson</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" aria-hidden="true" />
          </Link>

          {hasDigitalPractice && (
            <Link
              href={drillHref}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-mm-line bg-white px-3.5 text-xs font-bold text-mm-ink shadow-2xs transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-50/60 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-mm-brand"
            >
              <PlayCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>Practise drill</span>
            </Link>
          )}
          {!hasDigitalPractice && (
            <span className="text-xs font-semibold text-mm-muted py-1">
              {node.isClassroomOnly ? "Practised in class" : "Practice coming soon"}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

export function LessonPathwayList({
  pathway,
  previewMode = false,
  isOpen = true,
  onToggle = () => {},
}: LessonPathwayListProps) {
  const totalPracticeQuestions = pathway.nodes.reduce((sum, node) => sum + node.questionCount, 0);
  const panel = panelId(pathway.strand);
  const heading = headingId(pathway.strand);

  return (
    <section
      id={`pathway-${pathway.strand}`}
      aria-labelledby={heading}
      className="overflow-hidden rounded-2xl border border-mm-line bg-white shadow-xs transition-shadow duration-200 hover:shadow-sm scroll-mt-36"
    >
      <h3 id={heading} className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panel}
          className="flex w-full min-h-[64px] items-center justify-between gap-3.5 px-5 py-4 text-left transition-colors duration-180 hover:bg-mm-tint/30 focus-visible:outline-3 focus-visible:-outline-offset-2 focus-visible:outline-mm-brand cursor-pointer sm:px-6"
        >
          <span className="flex min-w-0 items-center gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-mm-brand to-mm-brand-deep text-white shadow-xs">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="grid min-w-0 gap-0.5">
              <span className="flex items-center gap-2 text-[18px] font-bold text-mm-ink sm:text-[20px]">
                {strandLabel(pathway.strand)}
                {previewMode && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                    <FlaskConical className="h-3 w-3 text-amber-600" aria-hidden="true" />
                    Draft
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2 truncate text-xs font-semibold text-mm-muted">
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-mm-brand" aria-hidden="true" />
                <span className="truncate">
                  {pathway.nodes.length} lesson{pathway.nodes.length === 1 ? "" : "s"} ·{" "}
                  <span className="text-mm-ink-soft">{pathway.title}</span>
                </span>
              </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            {totalPracticeQuestions > 0 && (
              <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/80 md:inline-flex">
                <PlayCircle className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {totalPracticeQuestions} questions
              </span>
            )}
            <ChevronDown
              className={clsx(
                "h-5 w-5 shrink-0 text-mm-muted transition-transform duration-250",
                isOpen && "rotate-180 text-mm-brand",
              )}
              aria-hidden="true"
            />
          </div>
        </button>
      </h3>

      <div id={panel} role="region" aria-labelledby={heading} hidden={!isOpen}>
        <div className="border-t border-mm-line-soft bg-gradient-to-r from-mm-brand/5 via-white to-mm-tint/30 px-5 py-4.5 sm:px-6">
          <p className="max-w-3xl text-[14.5px] leading-relaxed text-mm-muted">
            {pathway.description}
          </p>
          <div className="mt-3.5 flex flex-wrap items-center gap-3 text-xs font-bold text-mm-ink-soft">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 border border-mm-line/80 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-mm-brand" aria-hidden="true" />
              Concepts, worked examples & misconceptions
            </span>
            {totalPracticeQuestions > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/90 px-3 py-1 text-emerald-900 border border-emerald-200/80 shadow-2xs">
                <PlayCircle className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {totalPracticeQuestions} aligned practice question
                {totalPracticeQuestions === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        <ol className="grid gap-3.5 p-5 sm:p-6 bg-slate-50/40">
          {pathway.nodes.map((node, index) => (
            <LessonNodeCard key={node.curriculumCode} node={node} index={index} />
          ))}
        </ol>
      </div>
    </section>
  );
}
