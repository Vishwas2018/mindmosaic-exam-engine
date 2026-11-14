"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";

import { type PreviewSampleQuestion } from "../fixtures";

export interface ParentPracticePreviewProps {
  child: {
    id: string;
    displayName: string;
    yearLevel?: number | null;
  };
  programme: {
    id: string;
    title: string;
    subject: string;
  };
  sampleQuestions: PreviewSampleQuestion[];
  isLocalPreview?: boolean;
}

/**
 * ParentPracticePreview (Parent Journey 5 - Artboard #24):
 *
 * Core architectural safeguards:
 * 1. Zero Mutation: Previewing and interacting with sample questions NEVER saves to the database,
 *    never generates student attempts, and never mutates child progress or streaks.
 * 2. Unambiguous Preview Banner: "Answering here changes nothing. It is not saved, not marked, and never appears in [Name]'s results."
 * 3. Deferred Features Honesty:
 *    - "Set this for [Name]" (Assignment) is explicitly marked "PROPOSED POLICY" with disabled button and architectural rationale.
 *    - "Let [Name] try Year 5" (Stretch) is explicitly marked "PROPOSED POLICY / NEEDS SIGN-OFF" with disabled button.
 *    Never pretends backend capabilities exist when they are deferred.
 */
export function ParentPracticePreview({
  child,
  programme,
  sampleQuestions,
  isLocalPreview = false,
}: ParentPracticePreviewProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const sampleHeadingId = useId();
  const aboutHeadingId = useId();
  const assignHeadingId = useId();
  const stretchHeadingId = useId();

  const year = child.yearLevel ?? 3;
  const stretchYear = year === 3 ? 5 : 7;
  const currentQ = sampleQuestions[questionIndex] ?? sampleQuestions[0];

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setQuestionIndex((prev) => (prev + 1) % sampleQuestions.length);
  };

  return (
    <div className="space-y-8">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Link href="/parent" className="hover:text-royal transition">
              Family Overview
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/parent/children/${child.id}/learning`}
              className="hover:text-royal transition"
            >
              Learning for {child.displayName}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink font-bold">Preview</span>
          </nav>
          <p className="text-xs font-extrabold uppercase tracking-wider text-royal">
            Learning for {child.displayName}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            {programme.title}, Year {year}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted sm:text-base">
            A look at what {child.displayName} would see. Nothing here is recorded.
          </p>
        </div>

        {isLocalPreview && (
          <span className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal shadow-xs">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Illustrative sample family
          </span>
        )}
      </div>

      {/* Preview Safeguard Banner */}
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4 text-xs sm:text-sm text-ink"
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
        <div>
          <p className="font-extrabold text-sky-950">You are previewing.</p>
          <p className="mt-0.5 text-muted">
            Answering here changes nothing. It is not saved, not marked, and never appears in {child.displayName}’s results.
          </p>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Sample Question Box (Main Column: 7 cols) */}
        <section
          aria-labelledby={sampleHeadingId}
          className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs lg:col-span-7 xl:col-span-8"
        >
          <div className="flex items-center justify-between border-b border-royal/10 pb-4">
            <h2 id={sampleHeadingId} className="text-lg font-black text-ink">
              A sample question
            </h2>
            <span className="text-xs font-bold text-muted">
              Question {questionIndex + 1} of {sampleQuestions.length}
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-royal/10 bg-surface-container-low/30 p-6">
            <p className="text-base font-medium leading-relaxed text-ink sm:text-lg">
              {currentQ.prompt}
            </p>

            <fieldset className="mt-6 space-y-3">
              <legend className="sr-only">Choose an answer option</legend>
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                return (
                  <label
                    key={idx}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-semibold transition ${
                      isSelected
                        ? "border-royal bg-royal/10 text-royal font-bold shadow-2xs"
                        : "border-royal/10 bg-white text-ink hover:border-royal/30 hover:bg-royal/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sample-choice"
                      value={idx}
                      checked={isSelected}
                      onChange={() => setSelectedOption(idx)}
                      className="h-4 w-4 accent-royal"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </fieldset>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleNextQuestion}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-royal/20 bg-white px-4 py-2 text-xs font-extrabold text-royal shadow-2xs hover:bg-royal/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
            >
              Show the next one &rarr;
            </button>
            <Link
              href={`/parent/children/${child.id}/learning`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-ink transition"
            >
              Back to the list
            </Link>
          </div>
        </section>

        {/* Sidebar Controls & Policies (4-5 cols) */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          {/* Card 1: About this one */}
          <section
            aria-labelledby={aboutHeadingId}
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
          >
            <h2 id={aboutHeadingId} className="text-base font-black text-ink">
              About this one
            </h2>
            <dl className="mt-4 divide-y divide-royal/10 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted">Year</dt>
                <dd className="font-extrabold text-ink">{year}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted">Strands covered</dt>
                <dd className="font-extrabold text-ink">4</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted">Set sizes</dt>
                <dd className="font-extrabold text-ink">10, 20, full</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted">Typical time</dt>
                <dd className="font-extrabold text-ink">About 15 minutes</dd>
              </div>
            </dl>
          </section>

          {/* Card 2: Set this for Aisha (Deferred Assignment Policy) */}
          <section
            aria-labelledby={assignHeadingId}
            className="rounded-2xl border border-dashed border-royal/30 bg-royal/5 p-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={assignHeadingId} className="text-base font-black text-ink">
                Set this for {child.displayName}
              </h2>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                PROPOSED POLICY
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-muted">
              A parent picks a set and it waits on the child’s My Space until done.
            </p>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-4 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-xl border border-royal/20 bg-white/70 px-4 py-2 text-xs font-extrabold text-muted shadow-2xs"
            >
              Set a 10-question set
            </button>

            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Not available. Practice on MindMosaic stays your child’s choice, so parents cannot set work for them.
            </p>
          </section>

          {/* Card 3: Let Aisha try Year 5 (Deferred Stretch Policy) */}
          <section
            aria-labelledby={stretchHeadingId}
            className="rounded-2xl border border-dashed border-royal/30 bg-royal/5 p-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={stretchHeadingId} className="text-base font-black text-ink">
                Let {child.displayName} try Year {stretchYear}
              </h2>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                PROPOSED POLICY
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-muted">
              A parent switch that opens the year above for a child who is ahead.
            </p>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-4 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-xl border border-royal/20 bg-white/70 px-4 py-2 text-xs font-extrabold text-muted shadow-2xs"
            >
              Open Year {stretchYear} for {child.displayName}
            </button>

            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Not available yet: a Year {stretchYear} paper sat by a Year {year} child must not quietly land in their Year {year} figures, and that rule is still being decided.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
