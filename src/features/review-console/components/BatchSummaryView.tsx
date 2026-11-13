"use client";

import React from "react";
import type { BatchSummary } from "../types";

export interface BatchSummaryViewProps {
  summary: BatchSummary;
  onClose: () => void;
  onSelectItem?: (id: string) => void;
}

export function BatchSummaryView({ summary, onClose }: BatchSummaryViewProps) {
  const targetTimeMinutes = Math.round(summary.totalItems * 1.0); // 1 min per item target

  return (
    <div
      data-testid="batch-summary-modal"
      className="rounded-2xl border border-royal/15 bg-white p-6 shadow-md sm:p-8"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-royal/10 pb-5">
        <div>
          <span className="rounded bg-royal/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-royal">
            Pre-Review Briefing
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            {summary.batchTitle}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Executive one-page orientation: review distribution, key balance, and cognitive attention guide.
          </p>
        </div>

        <button
          type="button"
          data-testid="btn-close-summary"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-royal-dark"
        >
          <span>Start Review</span>
          <kbd className="rounded bg-white/20 px-1 py-0.5 text-xs font-mono">S</kbd>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-royal/15 bg-sand-light/40 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Questions</span>
          <div className="mt-1 text-3xl font-extrabold text-ink">{summary.totalItems}</div>
          <span className="mt-1 block text-xs text-muted">100% of batch</span>
        </div>

        <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Solver-Backed
          </span>
          <div className="mt-1 text-3xl font-extrabold text-emerald-950">{summary.solverBackedCount}</div>
          <span className="mt-1 block text-xs text-emerald-700">
            {summary.totalItems ? ((summary.solverBackedCount / summary.totalItems) * 100).toFixed(0) : 0}% automated check
          </span>
        </div>

        <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Semantic Review Required
          </span>
          <div className="mt-1 text-3xl font-extrabold text-amber-950">{summary.semanticReviewCount}</div>
          <span className="mt-1 block text-xs text-amber-700">
            {summary.totalItems ? ((summary.semanticReviewCount / summary.totalItems) * 100).toFixed(0) : 0}% human judgement
          </span>
        </div>

        <div className="rounded-xl border border-royal/15 bg-sand-light/40 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Target Batch Time</span>
          <div className="mt-1 text-3xl font-extrabold text-ink">~{targetTimeMinutes}m</div>
          <span className="mt-1 block text-xs text-royal font-medium">Target &lt;1 min / item</span>
        </div>
      </div>

      {/* Middle Grid: Skills, Difficulty, and Answer Distribution */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Answer-Position Distribution */}
        <div className="rounded-xl border border-royal/15 bg-white p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Answer-Position Distribution
          </h3>
          <p className="mt-0.5 text-xs text-muted">Key balance across options (A, B, C, D)</p>

          <div className="mt-4 space-y-3">
            {["a", "b", "c", "d"].map((pos) => {
              const count = summary.answerPositionCounts[pos] ?? 0;
              const pct = summary.totalItems ? (count / summary.totalItems) * 100 : 0;
              return (
                <div key={pos} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="uppercase font-bold text-slate-800">Option [{pos}]</span>
                    <span className="text-slate-600">
                      {count} items ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-royal"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Non-multiple-choice keys if any */}
          {Object.entries(summary.answerPositionCounts).filter(([k]) => !["a", "b", "c", "d"].includes(k)).length > 0 ? (
            <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
              <span className="font-semibold">Other answer kinds: </span>
              {Object.entries(summary.answerPositionCounts)
                .filter(([k]) => !["a", "b", "c", "d"].includes(k))
                .map(([k, c]) => `${k} (${c})`)
                .join(", ")}
            </div>
          ) : null}
        </div>

        {/* Difficulty Breakdown */}
        <div className="rounded-xl border border-royal/15 bg-white p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Difficulty Progression
          </h3>
          <p className="mt-0.5 text-xs text-muted">Cognitive tier distribution</p>

          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {Object.entries(summary.difficultyCounts).map(([diff, count]) => {
              const pct = summary.totalItems ? ((count / summary.totalItems) * 100).toFixed(0) : "0";
              const colorClass =
                diff === "easy"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                  : diff === "medium"
                  ? "border-amber-300 bg-amber-50 text-amber-950"
                  : "border-purple-300 bg-purple-50 text-purple-950";

              return (
                <div
                  key={diff}
                  className={`flex items-center justify-between rounded-lg border p-3 ${colorClass}`}
                >
                  <span className="text-sm font-bold capitalize">{diff}</span>
                  <div className="text-right">
                    <span className="text-lg font-extrabold">{count}</span>
                    <span className="text-xs opacity-80"> ({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attention Guide / Where to spend focus */}
        <div className="rounded-xl border border-royal/15 bg-white p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Reviewer Attention Guide
          </h3>
          <p className="mt-0.5 text-xs text-muted">Where to concentrate your cognitive budget</p>

          <div className="mt-3 space-y-3 text-xs text-slate-700 leading-relaxed">
            <div className="rounded-lg bg-amber-50/70 p-3 border border-amber-200">
              <strong className="text-amber-900 block font-semibold mb-1">
                High Attention: {summary.semanticReviewCount} Semantic Items
              </strong>
              <span>
                Reading passages and literal/inferential comprehension require human semantic judgement. Check that answer keys are unambiguously grounded in text.
              </span>
            </div>

            <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200">
              <strong className="text-emerald-900 block font-semibold mb-1">
                Fast Pass: {summary.solverBackedCount} Solver-Backed Items
              </strong>
              <span>
                Spelling patterns and deterministic questions carry rule-based verification. Focus on natural sentence context and age-appropriateness.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Table */}
      <div className="mt-6 rounded-xl border border-royal/15 bg-white p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Curriculum Skills Coverage ({Object.keys(summary.skillCounts).length} unique skills)
        </h3>

        <div className="mt-3 max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-sand-light/90 text-slate-600">
              <tr>
                <th className="p-2 font-semibold">Skill / Strand</th>
                <th className="p-2 text-right font-semibold">Question Count</th>
                <th className="p-2 text-right font-semibold">% of Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(summary.skillCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([skill, count]) => {
                  const pct = summary.totalItems ? ((count / summary.totalItems) * 100).toFixed(1) : "0";
                  return (
                    <tr key={skill} className="hover:bg-slate-50">
                      <td className="p-2 font-medium text-ink">{skill}</td>
                      <td className="p-2 text-right font-bold text-slate-800">{count}</td>
                      <td className="p-2 text-right text-muted">{pct}%</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Start Review Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl bg-royal px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-royal-dark"
        >
          <span>Begin Review Pass</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
