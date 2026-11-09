"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Eye, Info, Lock } from "lucide-react";
import { PREVIEW_CHILDREN } from "../fixtures";

export interface PracticePreviewViewProps {
  childId: string;
}

export function PracticePreviewView({ childId }: PracticePreviewViewProps) {
  const child = PREVIEW_CHILDREN.find((c) => c.id === childId) || PREVIEW_CHILDREN[0];

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/parent" className="hover:text-royal">
          Family Overview
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <Link href={`/parent/children/${child.id}/curriculum`} className="hover:text-royal">
          Learning for {child.firstName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <span aria-current="page" className="text-ink">
          Sample question preview
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-royal">
            NAPLAN-style Numeracy, Year {child.yearLevel}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Sample question preview
          </h1>
          <p className="mt-1 text-base text-muted">
            See exactly how questions appear to {child.firstName} during practice.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Illustrative sample family
        </span>
      </div>

      {/* Strict Honesty Banner: Isolated Parent Preview (Decision P8) */}
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-royal/20 bg-royal/[0.04] p-4 text-xs text-ink sm:text-sm"
      >
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-royal" aria-hidden="true" />
        <div>
          <b className="font-semibold text-royal">Parent preview mode active.</b>
          <p className="mt-0.5 text-muted">
            This session is for parent inspection only. It runs in an isolated sandbox and will <span className="font-semibold text-ink">never record an attempt, affect marks, or alter {child.firstName}&apos;s data</span>.
          </p>
        </div>
      </div>

      {/* Main Layout Row (b21) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Sample Question Column (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          <section
            aria-labelledby="h-sample-q"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-royal/8 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-royal">
                Question 4 &middot; Number &amp; algebra
              </span>
              <span className="rounded-full bg-royal/5 px-2.5 py-0.5 text-xs font-semibold text-royal">
                1 mark
              </span>
            </div>

            <div className="mt-5">
              <h2 id="h-sample-q" className="text-base font-bold text-ink sm:text-lg">
                A fruit shop has 4 boxes of apples with 6 apples in each box. 5 apples are sold.
                How many apples are left?
              </h2>

              {/* Multiple Choice Options */}
              <div className="mt-6 space-y-3">
                {[
                  { id: "A", text: "19 apples", correct: true },
                  { id: "B", text: "24 apples", correct: false },
                  { id: "C", text: "29 apples", correct: false },
                  { id: "D", text: "15 apples", correct: false },
                ].map((option) => {
                  const isSelected = selectedOption === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 text-sm font-semibold transition ${
                        isSelected
                          ? "border-royal bg-royal/5 text-royal ring-1 ring-royal"
                          : "border-royal/10 bg-white text-ink hover:border-royal/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal/8 text-xs font-bold text-royal">
                          {option.id}
                        </span>
                        <span>{option.text}</span>
                      </div>
                      <input
                        type="radio"
                        name="preview-answer"
                        value={option.id}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedOption(option.id);
                          setChecked(false);
                        }}
                        className="text-royal focus:ring-royal"
                      />
                    </label>
                  );
                })}
              </div>

              {/* Check Answer Button & Explanation */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={() => setChecked(true)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-5 text-xs font-extrabold text-white transition hover:bg-royal-deep disabled:bg-zinc-200 disabled:text-zinc-500"
                >
                  Check answer
                </button>
                {checked && (
                  <span className="text-xs font-semibold text-emerald-800">
                    {selectedOption === "A" ? "Correct! 4 × 6 = 24, and 24 - 5 = 19." : "Incorrect. Try multiplying 4 × 6 first."}
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Side Rail: Two Proposed Policies clearly drawn DISABLED (P9, P10, b21) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Proposal 1: Assign Practice (Decision P9) */}
          <section
            aria-labelledby="h-p9"
            className="rounded-2xl border border-dashed border-royal/20 bg-zinc-50/70 p-6 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted" aria-hidden="true" />
              <h2 id="h-p9" className="text-sm font-bold text-ink">
                Proposal: Assign practice (P9)
              </h2>
            </div>
            <span className="mt-1.5 inline-block rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
              PROPOSED POLICY &middot; DISABLED
            </span>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Parents could select specific practice papers or strands for their child to complete.
            </p>
            <p className="mt-2 text-xs font-medium text-muted/90">
              <span className="font-semibold text-ink">Policy Position:</span> MindMosaic deliberately avoids coercive homework paradigms. Students learn best through self-directed practice and honest diagnostic insight rather than mandatory parent assignments.
            </p>
          </section>

          {/* Proposal 2: Stretch Content (Decision P10) */}
          <section
            aria-labelledby="h-p10"
            className="rounded-2xl border border-dashed border-royal/20 bg-zinc-50/70 p-6 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted" aria-hidden="true" />
              <h2 id="h-p10" className="text-sm font-bold text-ink">
                Proposal: Stretch content (P10)
              </h2>
            </div>
            <span className="mt-1.5 inline-block rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
              PROPOSED POLICY &middot; DISABLED
            </span>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Allow high-performing students to access Year 4 or Year 5 content early.
            </p>
            <p className="mt-2 text-xs font-medium text-muted/90">
              <span className="font-semibold text-ink">Policy Position:</span> Kept disabled until cross-year curriculum scoring, prerequisite mastery, and attribution policies are formalized to prevent premature or misleading assessments.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
