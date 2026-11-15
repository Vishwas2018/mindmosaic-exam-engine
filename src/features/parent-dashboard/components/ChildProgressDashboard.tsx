"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, BookOpen, Clock, FileText, Info } from "lucide-react";

import { ChildSwitcher, type ChildSwitcherItem } from "./ChildSwitcher";
import { MarksMeter } from "./MarksMeter";
import {
  type PreviewPaperResult,
  type ProgressRecommendation,
  type StrandMarksProgress,
  type SubjectMarksProgress,
} from "../fixtures";

export interface ChildProgressDashboardProps {
  child: {
    id: string;
    displayName: string;
    yearLevel?: number | null;
  };
  siblings: ChildSwitcherItem[];
  papers: PreviewPaperResult[];
  subjects: SubjectMarksProgress[];
  strands: StrandMarksProgress[];
  suggestion?: ProgressRecommendation | null;
  activeFilter?: "30d" | "3m" | "all";
  unreadableCount?: number;
  isLocalPreview?: boolean;
  forcedState?: "below_floor" | "nothing" | "error" | "loading";
}

/**
 * ChildProgressDashboard (Parent Journey 4 - Artboards #06, #07, #09):
 *
 * Visual hierarchy and honesty requirements:
 * 1. Honest Marks: reports objective marks earned out of marks available. NEVER percentages or performance bands.
 * 2. Evidence floor: at least 2 completed papers and 8 scored marks before evaluative claims appear.
 * 3. Strand thresholds: strands with < 2 papers or < 8 marks explicitly say "Not enough yet".
 * 4. Distinct Suggestion Card: clearly separated visually from child results ("Our suggestion, not Aisha's result").
 * 5. Finished papers ledger: links directly to PaperResultView (/parent/results/[id]).
 */
export function ChildProgressDashboard({
  child,
  siblings,
  papers,
  subjects,
  strands,
  suggestion,
  activeFilter = "30d",
  unreadableCount = 0,
  isLocalPreview = false,
  forcedState,
}: ChildProgressDashboardProps) {
  const [filter, setFilter] = useState<"30d" | "3m" | "all">(activeFilter);
  const subjectSectionId = useId();
  const strandSectionId = useId();

  const totalFinishedPapers = papers.length;
  const totalMarksEarned = subjects.reduce((sum, s) => sum + s.marksEarned, 0);
  const totalMarksAvailable = subjects.reduce((sum, s) => sum + s.marksAvailable, 0);
  const awaitingMarkingCount = papers.reduce(
    (sum, p) => sum + (p.pendingQuestions ?? (p.status === "awaiting_person" ? 2 : 0)),
    0,
  );

  const isBelowFloor =
    forcedState === "below_floor" ||
    (forcedState !== "nothing" && totalFinishedPapers > 0 && (totalFinishedPapers < 2 || totalMarksAvailable < 8));

  const isNothingYet = forcedState === "nothing" || totalFinishedPapers === 0;

  return (
    <div className="space-y-8">
      {/* Header & Greet */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Link href="/parent" className="inline-flex min-h-11 items-center hover:text-royal transition">
              Family Overview
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink font-bold">{child.displayName}’s progress</span>
          </nav>
          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
            {child.displayName}’s progress
          </h1>
          <p className="mt-1 text-sm font-medium text-muted sm:text-base">
            Year {child.yearLevel ?? 3} · {totalFinishedPapers}{" "}
            {totalFinishedPapers === 1 ? "finished paper" : "finished papers"} · worked out from timed papers only
          </p>
        </div>

        {isLocalPreview && (
          <span className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal shadow-xs">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Illustrative sample family
          </span>
        )}
      </div>

      {/* Child Switcher Pill Navigation */}
      <ChildSwitcher
        childrenList={siblings}
        selectedId={child.id}
        showAllOption={true}
        hrefForChild={(id) => (id ? `/parent/children/${id}/progress` : "/parent")}
      />

      {/* Date Filter Strip */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
        <span className="mr-1 text-muted">Showing:</span>
        <button
          type="button"
          onClick={() => setFilter("30d")}
          aria-pressed={filter === "30d"}
          className={`min-h-11 rounded-lg px-3 py-1.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 ${
            filter === "30d"
              ? "bg-royal text-white shadow-xs"
              : "border border-royal/10 bg-white text-ink hover:bg-royal/5"
          }`}
        >
          Last 30 days
        </button>
        <button
          type="button"
          onClick={() => setFilter("3m")}
          aria-pressed={filter === "3m"}
          className={`min-h-11 rounded-lg px-3 py-1.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 ${
            filter === "3m"
              ? "bg-royal text-white shadow-xs"
              : "border border-royal/10 bg-white text-ink hover:bg-royal/5"
          }`}
        >
          Last 3 months
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
          className={`min-h-11 rounded-lg px-3 py-1.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 ${
            filter === "all"
              ? "bg-royal text-white shadow-xs"
              : "border border-royal/10 bg-white text-ink hover:bg-royal/5"
          }`}
        >
          All time
        </button>
      </div>

      {/* Partial Failure Notice (State 3: Partly unreadable) */}
      {unreadableCount > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-coral-500/25 bg-coral-500/5 p-4 text-xs sm:text-sm text-ink"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral-600" aria-hidden="true" />
          <div>
            <p className="font-extrabold text-coral-950">
              We couldn’t load {unreadableCount} of {child.displayName}’s {totalFinishedPapers + unreadableCount} papers.
            </p>
            <p className="mt-1 text-muted">
              Nothing has changed. The other {totalFinishedPapers} are included in everything above. The figures are from {totalFinishedPapers} papers, not {totalFinishedPapers + unreadableCount}.
            </p>
          </div>
        </div>
      )}

      {/* State 2: Nothing Finished Yet */}
      {isNothingYet ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-royal/10 bg-white p-8 text-center shadow-xs sm:p-12">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-royal/8 text-royal"
          >
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-black text-ink">No finished papers yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Practice sets are not recorded, so they do not appear here. A timed paper from the Exam Centre is what starts this off.
          </p>
          <div className="mt-6">
            <Link
              href="/exam"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-royal px-5 text-sm font-extrabold text-white shadow-xs transition hover:bg-royal/90"
            >
              Start an Exam Paper <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : isBelowFloor ? (
        /* State 1: Below the Evidence Floor */
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center sm:p-12">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-800"
            >
              <Info className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-black text-ink">One paper so far</h2>
            <p className="mt-2 max-w-md text-sm font-medium text-muted">
              {child.displayName} has finished 1 paper. We need 2 papers and 8 marks before showing subject figures, so that one short paper does not decide how {child.displayName} looks.
            </p>
          </div>

          {/* Finished papers table is still shown so the parent can inspect the 1 paper */}
          <section aria-labelledby="h-finished-papers" className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs">
            <div className="flex items-baseline justify-between border-b border-royal/10 pb-4">
              <h2 id="h-finished-papers" className="text-base font-black text-ink sm:text-lg">
                Finished papers
              </h2>
              <span className="text-xs font-semibold text-muted">
                Look at the papers behind this · {papers.length} {papers.length === 1 ? "paper" : "papers"}
              </span>
            </div>

            <div className="mt-4 divide-y divide-royal/10">
              {papers.map((paper) => (
                <div key={paper.id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-medium text-muted">{paper.date}</span>
                    <h3 className="font-extrabold text-ink">{paper.title}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black tabular-nums text-ink">
                      {paper.marksEarned} of {paper.marksAvailable} marks
                    </span>
                    <Link
                      href={`/parent/results/${paper.id}`}
                      className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-royal/20 bg-white px-3 py-1.5 text-xs font-bold text-royal hover:bg-royal/5 transition"
                    >
                      Open &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Normal State: Evidence Floor Met */
        <div className="space-y-8">
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-royal/10 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">
                Finished papers
              </h3>
              <p className="mt-2 font-display text-3xl font-black text-ink tabular-nums">
                {totalFinishedPapers}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted">
                <FileText className="h-3.5 w-3.5 text-muted/70" aria-hidden="true" />
                In the last 30 days
              </p>
            </div>

            <div className="rounded-2xl border border-royal/10 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">
                Marks earned
              </h3>
              <p className="mt-2 font-display text-3xl font-black text-ink tabular-nums">
                {totalMarksEarned} of {totalMarksAvailable}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted">
                <Info className="h-3.5 w-3.5 text-muted/70" aria-hidden="true" />
                Across {totalFinishedPapers} papers, auto-marked only
              </p>
            </div>

            <div className="rounded-2xl border border-royal/10 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">
                Awaiting marking
              </h3>
              <p className="mt-2 font-display text-3xl font-black text-ink tabular-nums">
                {awaitingMarkingCount}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted">
                <Clock className="h-3.5 w-3.5 text-muted/70" aria-hidden="true" />
                <span className="hidden sm:inline">Written answers a person still has to read</span>
                <span className="sm:hidden">Written answers</span>
              </p>
            </div>
          </div>

          {/* 2-Column Section: By Subject & By Strand */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            {/* By subject */}
            <section
              aria-labelledby={subjectSectionId}
              className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
            >
              <h2 id={subjectSectionId} className="text-lg font-black text-ink">
                By subject
              </h2>
              <p className="mt-1 text-xs font-medium text-muted">
                Marks earned out of marks available, added up across finished papers.
              </p>

              <div className="mt-6 space-y-5 divide-y divide-royal/10">
                {subjects.map((sub, idx) => (
                  <div key={sub.subject} className={idx > 0 ? "pt-5" : ""}>
                    <MarksMeter
                      label={sub.label}
                      earnedMarks={sub.marksEarned}
                      availableMarks={sub.marksAvailable}
                      papersCount={sub.papersCount}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* By strand */}
            <section
              aria-labelledby={strandSectionId}
              className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
            >
              <h2 id={strandSectionId} className="text-lg font-black text-ink">
                By strand, within Numeracy
              </h2>
              <p className="mt-1 text-xs font-medium text-muted">
                A strand is a part of a subject. Some have too little behind them to be worth reporting.
              </p>

              <div className="mt-6 space-y-5 divide-y divide-royal/10">
                {strands.map((strand, idx) => {
                  const meetsFloor = !strand.belowFloor && strand.papersCount >= 2 && strand.marksAvailable >= 8;
                  return (
                    <div key={strand.strand} className={idx > 0 ? "pt-5" : ""}>
                      {meetsFloor ? (
                        <MarksMeter
                          label={strand.label}
                          earnedMarks={strand.marksEarned}
                          availableMarks={strand.marksAvailable}
                          papersCount={strand.papersCount}
                        />
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="font-extrabold text-muted">{strand.label}</span>
                            <span className="rounded-full bg-royal/10 px-2 py-0.5 text-xs font-extrabold text-royal">
                              Not enough yet
                            </span>
                          </div>
                          <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                            <Info className="h-3 w-3 shrink-0 text-muted/70" aria-hidden="true" />
                            {strand.papersCount} {strand.papersCount === 1 ? "paper" : "papers"} · {strand.marksAvailable} {strand.marksAvailable === 1 ? "mark" : "marks"} so far. A strand needs 2 papers and 8 marks before we say anything.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Separated Recommendation Card: What we would suggest */}
          {suggestion && (
            <div className="rounded-2xl border border-royal/20 bg-royal/5 p-6 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-royal">
                    What we would suggest
                  </span>
                  <h3 className="mt-1 text-base font-black text-ink">
                    {suggestion.headline}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/80">
                    {suggestion.description}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-muted">
                    Kept visually apart from the figures above on purpose: everything above is what {child.displayName} did, this is what we think.
                  </p>
                </div>
                <div className="shrink-0 self-start sm:self-center">
                  <Link
                    href={suggestion.actionHref}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-royal px-5 text-sm font-extrabold text-white shadow-xs transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/30"
                  >
                    {suggestion.actionLabel} &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Finished Papers Ledger Table */}
          <section aria-labelledby="h-papers-table" className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs">
            <div className="flex items-baseline justify-between border-b border-royal/10 pb-4">
              <div>
                <h2 id="h-papers-table" className="text-lg font-black text-ink">
                  Finished papers
                </h2>
                <p className="mt-0.5 text-xs font-medium text-muted">
                  Look at the papers behind this · See all {papers.length}
                </p>
              </div>
            </div>

            <div className="mt-2 divide-y divide-royal/10">
              {papers.map((paper) => {
                const isAwaiting = paper.status === "awaiting_person";
                return (
                  <div
                    key={paper.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-muted">{paper.date}</span>
                      <h3 className="text-sm font-extrabold text-ink sm:text-base">
                        {paper.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div className="text-left sm:text-right">
                        <span className="font-display text-sm font-black tabular-nums text-ink">
                          {paper.marksEarned} of {paper.marksAvailable}
                        </span>
                        <span className="ml-1 text-xs text-muted">marks</span>
                      </div>

                      {isAwaiting ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-extrabold text-amber-800">
                          {paper.statusLabel ?? "2 awaiting a person"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-1 text-xs font-extrabold text-teal-800">
                          {paper.statusLabel ?? "Complete"}
                        </span>
                      )}

                      <Link
                        href={`/parent/results/${paper.id}`}
                        className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-royal/20 bg-white px-3.5 py-1.5 text-xs font-extrabold text-royal shadow-2xs hover:bg-royal/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
                      >
                        Open &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
