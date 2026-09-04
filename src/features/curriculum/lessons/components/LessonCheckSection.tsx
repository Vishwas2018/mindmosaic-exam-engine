"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles, Target } from "lucide-react";
import type { CheckSection as CheckSectionType } from "../schema";
import { isClassroomOnlyCurriculumNode } from "../classroom-only";

interface LessonCheckSectionProps {
  section: CheckSectionType;
  availableQuestionsCount?: number;
}

export function LessonCheckSection({
  section,
  availableQuestionsCount = 5,
}: LessonCheckSectionProps) {
  const hasPractice = availableQuestionsCount > 0;
  const drillCount = Math.min(section.practiceCount, availableQuestionsCount);

  return (
    <section
      id={section.id}
      aria-labelledby={`heading-${section.id}`}
      className="scroll-mt-36 overflow-hidden rounded-2xl border-2 border-mm-brand/35 bg-gradient-to-br from-white via-mm-tint/25 to-mm-tint/40 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="border-b border-mm-brand/15 bg-gradient-to-r from-mm-brand/10 via-mm-tint/40 to-white px-6 py-4.5 sm:px-8">
        <div className="flex items-center gap-2 text-mm-brand">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-mm-brand text-white shadow-2xs">
            <Target className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-mm-brand">
            Check for Understanding
          </span>
        </div>
        <h2 id={`heading-${section.id}`} className="mt-2 text-xl font-bold tracking-tight text-mm-ink sm:text-2xl">
          {section.heading}
        </h2>
      </div>

      <div className="grid gap-6 p-6 sm:p-8">
        <p className="text-[16px] font-medium leading-relaxed text-mm-ink-soft">
          {section.prompt}
        </p>

        <div className="grid gap-4 rounded-2xl border border-mm-line bg-white p-5 shadow-xs sm:flex sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-mm-brand to-mm-brand-deep text-white font-extrabold text-lg shadow-xs">
              {availableQuestionsCount}
            </span>
            <div>
              <p className="text-[15.5px] font-bold text-mm-ink flex items-center gap-1.5">
                Practice Questions Available
                {hasPractice && <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />}
              </p>
              <p className="text-xs text-mm-muted mt-0.5">
                Curriculum node: <span className="font-mono font-bold text-mm-brand">{section.curriculumCode}</span> · Instant marking & worked solutions
              </p>
            </div>
          </div>

          {hasPractice ? (
            <Link
              href={`/practice/session?curriculumCode=${encodeURIComponent(
                section.curriculumCode,
              )}&count=${drillCount}`}
              className="group inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-mm-brand px-6 text-[14.5px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-mm-brand-deep hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              <PlayCircle className="h-4.5 w-4.5 text-emerald-300" aria-hidden="true" />
              <span>Start Practice Drill</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ) : (
            <span className="inline-flex min-h-[46px] items-center gap-1.5 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-mm-muted border border-slate-200">
              {isClassroomOnlyCurriculumNode(section.curriculumCode)
                ? "Practised in class"
                : "Practice coming soon"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-mm-muted bg-slate-50/70 p-3 rounded-xl border border-mm-line-soft">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Every practice question is verified and aligned to Victorian Curriculum Level 3 standards.</span>
        </div>
      </div>
    </section>
  );
}
