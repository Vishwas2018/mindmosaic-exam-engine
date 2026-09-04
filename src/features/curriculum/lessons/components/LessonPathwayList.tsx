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
      className="group relative overflow-hidden rounded-2xl border border-mm-line bg-white p-4 shadow-sm transition-all hover:border-mm-brand hover:shadow-md scroll-mt-36 sm:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="grid min-w-0 gap-1.5">
          {/* Row 1 — always visible summary */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mm-brand text-white font-mono text-[11px]">
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
            {node.isClassroomOnly ? (
              <span className="inline-flex items-center gap-1 rounded bg-mm-brand/5 px-2 py-0.5 text-[11px] font-semibold text-mm-brand border border-mm-brand/20">
                <School className="h-3 w-3" aria-hidden="true" />
                Classroom-only skill
              </span>
            ) : node.questionCount > 0 ? (
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                {node.questionCount} practice question{node.questionCount === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="rounded px-2 py-0.5 text-[11px] font-semibold text-mm-muted-2">
                Coming soon
              </span>
            )}
          </div>

          <h4 className="text-[17px] font-bold leading-snug text-mm-ink transition-colors group-hover:text-mm-brand">
            <Link
              href={lessonHref}
              className="rounded focus-visible:outline-2 focus-visible:outline-mm-brand"
            >
              {node.title}
            </Link>
          </h4>

          {/* Row 2 — truncated intention */}
          <p className="line-clamp-2 text-[14px] leading-relaxed text-mm-ink-soft">
            {node.learningIntention}
          </p>

          {/* Prerequisites — tucked behind disclosure, not always-on noise */}
          {hasPrerequisites && (
            <div className="mt-0.5">
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                aria-expanded={showDetails}
                className="inline-flex items-center gap-1 text-xs font-semibold text-mm-muted hover:text-mm-brand focus-visible:outline-2 focus-visible:outline-mm-brand"
              >
                <ChevronDown
                  className={clsx("h-3.5 w-3.5 transition-transform", showDetails && "rotate-180")}
                  aria-hidden="true"
                />
                {showDetails ? "Hide prerequisites" : `${node.prerequisites.length} prerequisite${node.prerequisites.length === 1 ? "" : "s"}`}
              </button>
              {showDetails && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-mm-muted">
                  {node.prerequisites.map((prereq) => (
                    <Link
                      key={prereq}
                      href={`/student/learn/lessons/${prereq}`}
                      className="font-mono text-mm-brand hover:underline focus-visible:outline-2 focus-visible:outline-mm-brand"
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
        <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 md:flex-col md:items-end">
          <Link
            href={lessonHref}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-mm-brand px-4 text-sm font-bold text-white transition-colors hover:bg-mm-brand-deep focus-visible:outline-2 focus-visible:outline-mm-brand"
          >
            <span>Start lesson</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          {hasDigitalPractice && (
            <Link
              href={drillHref}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-mm-line bg-white px-3 text-xs font-bold text-mm-ink hover:border-mm-brand hover:text-mm-brand focus-visible:outline-2 focus-visible:outline-mm-brand"
            >
              <PlayCircle className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>Practise drill</span>
            </Link>
          )}
          {!hasDigitalPractice && (
            <span className="text-xs font-semibold text-mm-muted">
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
      className="overflow-hidden rounded-2xl border border-mm-line bg-white scroll-mt-36"
    >
      <h3 id={heading} className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panel}
          className="flex w-full min-h-[56px] items-center justify-between gap-3 px-5 py-4 text-left hover:bg-mm-tint/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mm-brand sm:px-6"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-mm-brand text-white">
              <GraduationCap className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="grid min-w-0 gap-0.5">
              {/* The short strand name leads so it never gets truncated away —
                  every pathway.title shares the "Victorian Curriculum Level N:"
                  prefix, so truncating that string first would make every
                  collapsed strand read identically on a narrow screen. */}
              <span className="flex items-center gap-1.5 text-[17px] font-bold text-mm-ink sm:text-[19px]">
                {strandLabel(pathway.strand)}
                {previewMode && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    <FlaskConical className="h-3 w-3 text-amber-600" aria-hidden="true" />
                    Draft
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5 truncate text-xs font-semibold text-mm-muted">
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-mm-brand" aria-hidden="true" />
                <span className="truncate">
                  {pathway.nodes.length} lesson{pathway.nodes.length === 1 ? "" : "s"} ·{" "}
                  <span>{pathway.title}</span>
                </span>
              </span>
            </span>
          </span>
          <ChevronDown
            className={clsx(
              "h-5 w-5 shrink-0 text-mm-muted transition-transform",
              isOpen && "rotate-180 text-mm-brand",
            )}
            aria-hidden="true"
          />
        </button>
      </h3>

      <div id={panel} role="region" aria-labelledby={heading} hidden={!isOpen}>
        <div className="border-t border-mm-line-soft bg-gradient-to-r from-mm-brand/5 via-white to-mm-tint/30 px-5 py-4 sm:px-6">
          <p className="max-w-3xl text-[14.5px] leading-relaxed text-mm-muted">
            {pathway.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-mm-ink-soft">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-mm-brand" aria-hidden="true" />
              Concepts, worked examples & misconceptions
            </span>
            {totalPracticeQuestions > 0 && (
              <span className="flex items-center gap-1.5">
                <PlayCircle className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {totalPracticeQuestions} aligned practice question
                {totalPracticeQuestions === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        <ol className="grid gap-3 p-5 sm:p-6">
          {pathway.nodes.map((node, index) => (
            <LessonNodeCard key={node.curriculumCode} node={node} index={index} />
          ))}
        </ol>
      </div>
    </section>
  );
}
