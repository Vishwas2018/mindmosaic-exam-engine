"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle, Target } from "lucide-react";
import type { CheckSection as CheckSectionType } from "../schema";

interface LessonCheckSectionProps {
  section: CheckSectionType;
  availableQuestionsCount?: number;
}

export function LessonCheckSection({
  section,
  availableQuestionsCount = 5,
}: LessonCheckSectionProps) {
  return (
    <section
      aria-labelledby={`heading-${section.id}`}
      className="overflow-hidden rounded-2xl border-2 border-mm-brand/30 bg-gradient-to-br from-white to-mm-tint/20 shadow-sm"
    >
      <div className="border-b border-mm-line-soft bg-mm-brand/5 px-6 py-4">
        <div className="flex items-center gap-2 text-mm-brand">
          <Target className="h-5 w-5" aria-hidden="true" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            Check for Understanding
          </span>
        </div>
        <h2 id={`heading-${section.id}`} className="mt-1 text-xl font-bold text-mm-ink">
          {section.heading}
        </h2>
      </div>

      <div className="grid gap-5 p-6">
        <p className="text-[15.5px] leading-relaxed text-mm-ink-soft">
          {section.prompt}
        </p>

        <div className="grid gap-3 rounded-xl border border-mm-line bg-white p-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-mm-tint text-mm-brand font-bold">
              {availableQuestionsCount}
            </span>
            <div>
              <p className="text-sm font-bold text-mm-ink">
                Practice Questions Available
              </p>
              <p className="text-xs text-mm-muted">
                Curriculum node: <span className="font-mono font-semibold">{section.curriculumCode}</span> · Instant marking & worked solutions
              </p>
            </div>
          </div>

          <Link
            href={`/practice/session?curriculumCode=${encodeURIComponent(
              section.curriculumCode,
            )}&count=${section.practiceCount}`}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-mm-brand px-6 text-sm font-bold text-white shadow-sm transition-transform hover:bg-mm-brand-deep hover:scale-[1.02] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            <span>Start Practice Drill</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-mm-muted">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <span>Every practice question is verified and aligned to Victorian Curriculum Level 3 standards.</span>
        </div>
      </div>
    </section>
  );
}
