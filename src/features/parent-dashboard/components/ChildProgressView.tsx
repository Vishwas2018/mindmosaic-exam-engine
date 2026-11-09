"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  PenTool,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  ChildSwitcher,
  MarksMeter,
  ClaimWithEvidence,
  LoadingStateBlock,
  NothingYetStateBlock,
  CouldNotLoadStateBlock,
} from "@/features/parent-dashboard";
import {
  PREVIEW_CHILDREN,
  PREVIEW_RESULTS_AISHA,
  type PreviewPaperResult,
} from "../fixtures";

export interface ChildProgressViewProps {
  childId: string;
}

export function ChildProgressView({ childId }: ChildProgressViewProps) {
  const [selectedChildId, setSelectedChildId] = useState(childId);
  const [stateVariant, setStateVariant] = useState<"normal" | "below_floor" | "empty" | "partial" | "loading" | "error">("normal");

  const currentChild =
    PREVIEW_CHILDREN.find((c) => c.id === selectedChildId) || PREVIEW_CHILDREN[0];

  const switcherItems = PREVIEW_CHILDREN.map((c) => ({
    id: c.id,
    name: c.firstName,
  }));

  // Results for the selected child
  const results: PreviewPaperResult[] =
    stateVariant === "empty"
      ? []
      : stateVariant === "below_floor"
      ? [
          {
            ...PREVIEW_RESULTS_AISHA[0],
            marksEarned: 4,
            marksAvailable: 6,
          },
        ]
      : PREVIEW_RESULTS_AISHA;

  const finishedPapers = results.filter((r) => r.status === "finished");
  const pendingPapers = results.filter((r) => r.status === "awaiting_parent_marking");

  const totalEarned = finishedPapers.reduce((sum, r) => sum + r.marksEarned, 0);
  const totalAvailable = finishedPapers.reduce((sum, r) => sum + r.marksAvailable, 0);

  return (
    <div className="space-y-6">
      {/* Test State Selector for Reviewers / Artboards */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-royal/10 bg-white/60 p-2.5 text-xs">
        <span className="font-semibold text-muted">Preview Artboard State:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStateVariant("normal")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              stateVariant === "normal"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Normal (b15/b19)
          </button>
          <button
            type="button"
            onClick={() => setStateVariant("below_floor")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              stateVariant === "below_floor"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Below Floor (b18-1)
          </button>
          <button
            type="button"
            onClick={() => setStateVariant("empty")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              stateVariant === "empty"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Nothing Yet (b18-2)
          </button>
          <button
            type="button"
            onClick={() => setStateVariant("partial")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              stateVariant === "partial"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Partial Failure (b18-3)
          </button>
          <button
            type="button"
            onClick={() => setStateVariant("loading")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              stateVariant === "loading"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Loading
          </button>
          <button
            type="button"
            onClick={() => setStateVariant("error")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              stateVariant === "error"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Could Not Load
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/parent" className="hover:text-royal">
          Family Overview
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <span aria-current="page" className="text-ink">
          {currentChild.firstName}
        </span>
      </nav>

      {/* Header & Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-royal">Child Progress</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {currentChild.firstName}&apos;s progress
          </h1>
          <p className="mt-1 text-base text-muted">
            Year {currentChild.yearLevel} &middot; {finishedPapers.length} finished paper
            {finishedPapers.length === 1 ? "" : "s"} &middot; worked out from timed papers only
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Illustrative sample family
        </span>
      </div>

      {/* Child Switcher Pills */}
      <ChildSwitcher
        childrenList={switcherItems}
        selectedId={selectedChildId}
        showAllOption={false}
        onSelect={(id) => {
          if (id) setSelectedChildId(id);
        }}
      />

      {/* State Blocks Dispatch */}
      {stateVariant === "loading" ? (
        <LoadingStateBlock />
      ) : stateVariant === "error" ? (
        <CouldNotLoadStateBlock
          title="We couldn't load Aisha's progress"
          description="Something interrupted loading this child's results. Her completed work is safe on the server. Please try refreshing."
          onRetry={() => setStateVariant("normal")}
        />
      ) : stateVariant === "empty" ? (
        <NothingYetStateBlock
          childName={currentChild.firstName}
          action={
            <Link
              href={`/parent/children/${currentChild.id}/curriculum`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-5 text-xs font-bold text-white transition hover:bg-royal-deep"
            >
              Explore learning &rarr;
            </Link>
          }
        />
      ) : (
        <>
          {/* Partial Failure Notice (b18-3) */}
          {stateVariant === "partial" && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 sm:text-sm"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <b className="font-semibold">Some of this week&apos;s activity couldn&apos;t be read.</b>
                <p className="mt-0.5 text-muted">
                  1 sitting response record was excluded from these totals because its question structure failed validation.
                </p>
              </div>
            </div>
          )}

          {/* 3 Metric Tiles (b15) */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Finished Papers */}
            <div className="rounded-2xl border border-royal/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Finished papers
              </p>
              <p className="mt-2 text-3xl font-black text-ink">{finishedPapers.length}</p>
              <p className="mt-2 text-xs text-muted">Timed papers only</p>
            </div>

            {/* Marks Earned (Strictly MarksMeter, no %, no bands) */}
            <div className="rounded-2xl border border-royal/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Marks earned</p>
              <div className="mt-2">
                <MarksMeter
                  label="All timed papers"
                  earnedMarks={totalEarned}
                  availableMarks={totalAvailable}
                  papersCount={finishedPapers.length}
                />
              </div>
            </div>

            {/* Awaiting Marking */}
            <div className="rounded-2xl border border-royal/10 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Awaiting marking
              </p>
              <p className="mt-2 text-3xl font-black text-royal">{pendingPapers.length}</p>
              <p className="mt-2 text-xs text-muted">
                {pendingPapers.length > 0 ? "Narrative writing &middot; marked by parent" : "No pending essays"}
              </p>
            </div>
          </div>

          {/* Evaluative Claims (Floor >= 2 papers & >= 8 marks enforced) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <section
              aria-labelledby="claim-numeracy"
              className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
            >
              <h2 id="claim-numeracy" className="text-xs font-bold uppercase tracking-wider text-muted">
                Numeracy insight
              </h2>
              <div className="mt-3">
                <ClaimWithEvidence
                  headline="Going well: Numeracy"
                  papersCount={stateVariant === "below_floor" ? 1 : 2}
                  marksCount={stateVariant === "below_floor" ? 6 : 28}
                  grouping="subject"
                />
              </div>
            </section>

            <section
              aria-labelledby="claim-reading"
              className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
            >
              <h2 id="claim-reading" className="text-xs font-bold uppercase tracking-wider text-muted">
                Reading insight
              </h2>
              <div className="mt-3">
                <ClaimWithEvidence
                  headline="To practise: Reading"
                  papersCount={stateVariant === "below_floor" ? 1 : 2}
                  marksCount={stateVariant === "below_floor" ? 4 : 13}
                  grouping="subject"
                />
              </div>
            </section>
          </div>

          {/* Breakdown by Subject */}
          <section aria-labelledby="h-subjects" className="space-y-4">
            <h2 id="h-subjects" className="text-xl font-bold text-ink">
              Breakdown by subject
            </h2>

            {/* Subject 1: Numeracy */}
            <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-royal/8 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-ink">NAPLAN-style Numeracy</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Number and algebra &middot; Measurement &middot; Statistics
                  </p>
                </div>
                <div className="sm:text-right">
                  <MarksMeter
                    label="Numeracy total"
                    earnedMarks={stateVariant === "below_floor" ? 6 : 23}
                    availableMarks={stateVariant === "below_floor" ? 10 : 35}
                    papersCount={stateVariant === "below_floor" ? 1 : 2}
                  />
                </div>
              </div>

              {/* Papers list */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-royal/[0.02] p-3.5 text-xs font-semibold text-ink">
                  <div>
                    <span className="font-bold">NAPLAN-style Numeracy Paper 1</span>
                    <span className="ml-2 text-muted">&middot; 25 Oct 2026 &middot; 35 mins</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-royal">23 of 35 marks</span>
                    <Link
                      href={`/parent/children/${currentChild.id}/results/res-numeracy-302`}
                      className="font-bold text-royal underline underline-offset-2 hover:text-royal-deep"
                    >
                      View result &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject 2: Reading */}
            <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-royal/8 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-ink">NAPLAN-style Reading</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Informative &middot; Narrative &middot; Persuasive texts
                  </p>
                </div>
                <div className="sm:text-right">
                  <MarksMeter
                    label="Reading total"
                    earnedMarks={stateVariant === "below_floor" ? 4 : 18}
                    availableMarks={stateVariant === "below_floor" ? 8 : 25}
                    papersCount={stateVariant === "below_floor" ? 1 : 2}
                  />
                </div>
              </div>

              {/* Papers list */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-royal/[0.02] p-3.5 text-xs font-semibold text-ink">
                  <div>
                    <span className="font-bold">NAPLAN-style Reading Paper 1</span>
                    <span className="ml-2 text-muted">&middot; 29 Oct 2026 &middot; 28 mins</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-royal">18 of 25 marks</span>
                    <Link
                      href={`/parent/children/${currentChild.id}/results/res-reading-301`}
                      className="font-bold text-royal underline underline-offset-2 hover:text-royal-deep"
                    >
                      View result &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject 3: Conventions of Language (Below Floor State) */}
            <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-royal/8 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-ink">Conventions of Language</h3>
                  <p className="mt-0.5 text-xs text-muted">Spelling &middot; Grammar &middot; Punctuation</p>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs font-bold text-muted">0 papers finished</span>
                </div>
              </div>

              <div className="mt-4">
                <ClaimWithEvidence
                  headline="To practise: Conventions of Language"
                  papersCount={0}
                  marksCount={0}
                  grouping="subject"
                />
              </div>
            </div>
          </section>

          {/* Writing Section (b15) */}
          <section
            aria-labelledby="h-writing"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-royal/8 pb-4">
              <div>
                <h2 id="h-writing" className="text-lg font-bold text-ink">
                  Writing (marking done by parents)
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Writing is open-ended. You mark your child&apos;s essays using the structured rubric.
                </p>
              </div>
              <Link
                href={`/parent/children/${currentChild.id}/writing`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-royal/8 px-4 text-xs font-bold text-royal transition hover:bg-royal/15"
              >
                <PenTool className="h-4 w-4" aria-hidden="true" />
                <span>Writing rubric hub</span>
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-950">Narrative Writing &mdash; The Hidden Door</span>
                    <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      Awaiting parent marking
                    </span>
                  </div>
                  <p className="mt-1 text-muted">
                    Submitted 22 Oct 2026 &middot; 30 mins writing duration &middot; Year 3
                  </p>
                </div>
                <Link
                  href={`/parent/children/${currentChild.id}/writing`}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-royal px-4 text-xs font-bold text-white transition hover:bg-royal-deep self-start sm:self-center"
                >
                  Mark this writing &rarr;
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
