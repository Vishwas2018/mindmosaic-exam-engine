"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import {
  buildVihaanParentSummary,
  type RecordedOutcome,
} from "@/features/scholarship-prep/lib/practice";
import { recommendNextFocus } from "@/features/scholarship-prep/lib/study-plan";

const FOCUS_LABELS: Readonly<Record<string, string>> = {
  mathematics: "Mathematics",
  numeracy: "Mathematics",
  numerical_reasoning: "Numerical Reasoning",
  verbal_reasoning: "Verbal Reasoning",
  reading_comprehension: "Reading Comprehension",
  reading: "Reading Comprehension",
  written_expression: "Written Expression",
  writing: "Written Expression",
};

function formatFocusLabel(focus: string): string {
  return FOCUS_LABELS[focus] ?? focus.replace(/_/g, " ");
}

/**
 * Vihaan Parent Dashboard — displays weekly progress, subject performance,
 * time spent, weak areas and recommended next steps derived from real
 * recorded `vihaan-*` sitting outcomes (honest empty state when none exist).
 */
export function VihaanParentDashboard({
  outcomes = [],
  childName = "Vihaan",
}: {
  outcomes?: readonly RecordedOutcome[];
  childName?: string;
}) {
  const summary = buildVihaanParentSummary(outcomes);
  const nextFocusLabel = formatFocusLabel(recommendNextFocus(summary.weakSubjects));
  const hasAnyRecordedData = summary.recordedItemsCount > 0;

  return (
    <div className="space-y-8" data-testid="vihaan-parent-dashboard">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Vihaan Scholarship Prep
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted">
            Parent dashboard — progress and recommendations
          </p>
        </div>
        <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-tint/40 text-[10px] font-semibold text-mm-muted">
          Draft — pending content approval
        </span>
      </div>

      <section className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-ink mb-4">Weekly progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <p className="text-[10px] font-semibold text-mm-muted uppercase tracking-wider">
              Activities completed
            </p>
            <p className="text-2xl font-black text-ink" data-testid="parent-activities-count">
              {summary.activitiesCompleted}
            </p>
            <p className="mt-1 text-xs text-mm-muted">
              {summary.activitiesCompleted === 0
                ? "No activities recorded yet"
                : `${summary.recordedItemsCount} item ${summary.recordedItemsCount === 1 ? "attempt" : "attempts"} recorded`}
            </p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <p className="text-[10px] font-semibold text-mm-muted uppercase tracking-wider">
              Time spent this week
            </p>
            <p className="text-2xl font-black text-ink" data-testid="parent-time-spent">
              {summary.timeSpentMinutes} min
            </p>
            <p className="mt-1 text-xs text-mm-muted">Target: 360 min per week</p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <p className="text-[10px] font-semibold text-mm-muted uppercase tracking-wider">
              Overall accuracy
            </p>
            <p className="text-2xl font-black text-ink" data-testid="parent-overall-accuracy">
              {summary.overallAccuracyPercent === null
                ? "—"
                : `${summary.overallAccuracyPercent}%`}
            </p>
            <p className="mt-1 text-xs text-mm-muted">
              {summary.overallAccuracyPercent === null
                ? summary.pendingWriting > 0
                  ? `${summary.pendingWriting} writing ${summary.pendingWriting === 1 ? "task" : "tasks"} pending rubric review`
                  : "No attempts recorded"
                : "Objective questions only"}
            </p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <p className="text-[10px] font-semibold text-mm-muted uppercase tracking-wider">
              Weak areas
            </p>
            <p className="text-2xl font-black text-ink" data-testid="parent-weak-areas">
              {summary.weakTopics.length > 0 ? summary.weakTopics.join(", ") : "None yet"}
            </p>
            <p className="mt-1 text-xs text-mm-muted">
              {summary.weakTopics.length > 0
                ? "Accuracy below 70% (5+ distinct items)"
                : "Complete practice to identify"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-ink mb-4">Subject performance</h2>
        <div className="space-y-3">
          {summary.subjects.map((subjectRow) => {
            const isWriting = subjectRow.subject === "writing";
            const barWidth = subjectRow.accuracyPercent ?? 0;
            const subtitle =
              isWriting
                ? subjectRow.attempted === 0
                  ? "0 attempts recorded"
                  : subjectRow.pendingManualReview > 0
                    ? `${subjectRow.attempted} ${subjectRow.attempted === 1 ? "submission" : "submissions"} recorded (${subjectRow.pendingManualReview} pending rubric review)`
                    : `${subjectRow.attempted} ${subjectRow.attempted === 1 ? "submission" : "submissions"} recorded`
                : subjectRow.attempted === 0
                  ? "0 attempts recorded"
                  : `${subjectRow.correct}/${subjectRow.attempted} correct (${subjectRow.attempted} ${subjectRow.attempted === 1 ? "attempt" : "attempts"})`;
            const rightValue =
              isWriting && subjectRow.pendingManualReview > 0
                ? "Pending"
                : subjectRow.accuracyPercent === null
                  ? "0%"
                  : `${subjectRow.accuracyPercent}%`;

            return (
              <div
                key={subjectRow.subject}
                data-testid={`subject-row-${subjectRow.subject}`}
                className="flex items-center justify-between rounded-xl border border-mm-line bg-mm-page/50 p-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-ink">{subjectRow.label}</h3>
                  <p className="mt-1 text-xs text-mm-muted">{subtitle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-mm-line-soft">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-ink">{rightValue}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-ink">Recommended next steps</h2>
          <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-tint/40 text-[10px] font-semibold text-mm-muted">
            Based on recorded results
          </span>
        </div>
        {!hasAnyRecordedData ? (
          <div className="rounded-lg border border-mm-line/40 bg-mm-tint/40 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-mm-coral" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">No data available yet</p>
                <p className="text-xs text-mm-muted">
                  Complete some practice activities to generate personalised recommendations for{" "}
                  {childName}.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-mm-line/40 bg-mm-tint/40 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {summary.weakTopics.length > 0
                    ? `Focus next on ${nextFocusLabel}`
                    : `Continue ${nextFocusLabel} practice`}
                </p>
                <p className="mt-1 text-xs text-mm-muted">
                  {summary.weakTopics.length > 0
                    ? `Recorded evidence highlights ${summary.weakTopics.join(", ")} for targeted revision before moving ahead.`
                    : summary.pendingWriting > 0 && summary.overallAccuracyPercent === null
                      ? `${summary.pendingWriting} writing ${summary.pendingWriting === 1 ? "task awaits" : "tasks await"} human rubric review. Objective items will refine subject recommendations for ${childName}.`
                      : `${childName} has recorded ${summary.recordedItemsCount} item ${summary.recordedItemsCount === 1 ? "attempt" : "attempts"} (${summary.overallAccuracyPercent ?? 0}% objective accuracy). Continue building 5+ distinct items per topic to identify weak areas.${summary.pendingWriting > 0 ? ` ${summary.pendingWriting} writing ${summary.pendingWriting === 1 ? "submission awaits" : "submissions await"} human rubric review.` : ""}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
