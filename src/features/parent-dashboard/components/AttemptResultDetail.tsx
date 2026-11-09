"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight, Info } from "lucide-react";
import { MarksMeter } from "@/features/parent-dashboard";
import { PREVIEW_CHILDREN, PREVIEW_RESULTS_AISHA, type PreviewPaperResult } from "../fixtures";

export interface AttemptResultDetailProps {
  childId: string;
  resultId: string;
}

export function AttemptResultDetail({ childId, resultId }: AttemptResultDetailProps) {
  const child = PREVIEW_CHILDREN.find((c) => c.id === childId) || PREVIEW_CHILDREN[0];
  const result: PreviewPaperResult =
    PREVIEW_RESULTS_AISHA.find((r) => r.id === resultId) || PREVIEW_RESULTS_AISHA[0];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/parent" className="hover:text-royal">
          Family Overview
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <Link href={`/parent/children/${child.id}/progress`} className="hover:text-royal">
          {child.firstName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <span aria-current="page" className="text-ink">
          {result.title}
        </span>
      </nav>

      {/* Header (b16) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-royal">
            {child.firstName}&apos;s progress
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {result.title}
          </h1>
          <p className="mt-1 text-base text-muted">
            Finished {result.date} &middot; Year {child.yearLevel} &middot; {result.timed ? "timed" : "untimed"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Illustrative sample family
        </span>
      </div>

      {/* Main Layout Row (b16) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Column (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          <section
            aria-labelledby="h-paper-summary"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 id="h-paper-summary" className="text-xl font-bold text-ink">
              This paper
            </h2>

            {/* Metrics */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Marks earned</p>
                <div className="mt-2">
                  <MarksMeter
                    label="Reading total"
                    earnedMarks={result.marksEarned}
                    availableMarks={result.marksAvailable}
                    papersCount={1}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Time taken</p>
                <p className="mt-2 text-2xl font-bold text-ink">
                  {result.durationMinutes} minutes
                </p>
                <p className="mt-1 text-xs text-muted">
                  of {result.allowedMinutes} minutes allowed
                </p>
              </div>
            </div>

            {/* Strand Breakdown */}
            <div className="mt-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
                Marks by text type
              </h3>
              <div className="mt-4 divide-y divide-royal/8 border-y border-royal/8">
                {result.strands.map((strand) => (
                  <div
                    key={strand.name}
                    className="flex items-center justify-between py-3.5 text-sm"
                  >
                    <span className="font-semibold text-ink">{strand.name}</span>
                    <span className="font-mono font-bold text-royal">
                      {strand.marksEarned} of {strand.marksAvailable} marks
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Action to Answer Review */}
            <div className="mt-8 border-t border-royal/8 pt-6">
              <Link
                href={`/parent/children/${child.id}/results/${result.id}/review`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-royal px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-royal-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 sm:w-auto"
              >
                <span>Go through the answers</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>

        {/* Side Rail (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          <section
            aria-labelledby="h-paper-info"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
          >
            <h2 id="h-paper-info" className="text-base font-bold text-ink">
              About this paper
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Timed practice paper following the Victorian Curriculum v2.0 NAPLAN test specification for Year 3.
            </p>
            <div className="mt-4 rounded-xl border border-royal/10 bg-royal/[0.02] p-4 text-xs text-muted">
              <b>Honesty Rule:</b> Scores are reported strictly as marks earned out of marks available. No speculative performance bands are assigned to individual papers.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
