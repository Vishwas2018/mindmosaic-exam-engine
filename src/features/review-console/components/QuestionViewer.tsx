"use client";

import React, { useRef } from "react";
import { VisualRenderer } from "@/features/exam-engine/visual-renderers";
import type { ReviewDecision, ReviewItem } from "../types";

export interface QuestionViewerProps {
  item: ReviewItem;
  totalItems: number;
  timeOnItemSeconds: number;
  averageTimeSeconds: number;
  onDecisionChange: (id: string, decision: ReviewDecision) => void;
  onNotesChange: (id: string, notes: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function QuestionViewer({
  item,
  totalItems,
  timeOnItemSeconds,
  averageTimeSeconds,
  onDecisionChange,
  onNotesChange,
  onNext,
  onPrev,
}: QuestionViewerProps) {
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const q = item.question;

  const isApproved = item.decision === "approve";
  const isRejected = item.decision === "reject";
  const isRevised = item.decision === "revise";
  const isUndecided = !item.decision;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}s`;
  };

  const isUnderTarget = timeOnItemSeconds < 60;

  return (
    <article
      data-testid="question-viewer"
      data-item-id={item.id}
      className="flex flex-col rounded-2xl border border-royal/15 bg-white shadow-sm"
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-royal/10 bg-sand-light/50 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-ink">
            Item {item.index + 1} of {totalItems}
          </span>
          <span className="rounded bg-royal/10 px-2 py-0.5 font-mono text-xs font-semibold text-royal">
            {item.id}
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            Year {q.yearLevel}
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
            {q.metadata.subject?.replace(/_/g, " ")}
          </span>
        </div>

        {/* Live Timing Indicator */}
        <div className="flex items-center gap-3">
          <div
            data-testid="item-timer"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isUnderTarget
                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                : "bg-amber-50 text-amber-800 border border-amber-300"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>This item: {formatSeconds(timeOnItemSeconds)}</span>
            <span className="text-slate-400">·</span>
            <span className="font-normal text-slate-600">Avg: {formatSeconds(Math.round(averageTimeSeconds))}</span>
            <span className="text-slate-400">·</span>
            <span className="font-normal text-slate-500">Target &lt;1m</span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-7">
        {/* Meta details bar: Skill, Difficulty, Marks */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Skill:</span>
          <span className="rounded-md border border-royal/15 bg-white px-2 py-1 font-medium text-royal">
            {q.metadata.skill ?? q.metadata.strand ?? "Unspecified"}
          </span>

          <span className="ml-2 font-semibold text-slate-500">Difficulty:</span>
          <span
            className={`rounded-md px-2 py-1 font-semibold uppercase tracking-wide text-[11px] ${
              q.metadata.difficulty === "easy"
                ? "bg-emerald-100 text-emerald-900"
                : q.metadata.difficulty === "medium"
                ? "bg-amber-100 text-amber-900"
                : "bg-purple-100 text-purple-900"
            }`}
          >
            {q.metadata.difficulty ?? "unspecified"}
          </span>

          <span className="ml-2 font-semibold text-slate-500">Style:</span>
          <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
            {q.examStyle.replace("_style", "")}
          </span>
        </div>

        {/* Prompt Section */}
        <div className="rounded-xl border border-royal/10 bg-sand-light/20 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Question Prompt</h3>
          <p className="mt-2 text-lg font-semibold leading-relaxed text-ink">
            {q.prompt}
          </p>
        </div>

        {/* Visuals (if present) */}
        {q.visuals && q.visuals.length > 0 ? (
          <div className="rounded-xl border border-royal/15 bg-white p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Attached Visual
            </h4>
            {q.visuals.map((visual, idx) => (
              <VisualRenderer key={idx} visual={visual} />
            ))}
          </div>
        ) : null}

        {/* Options with Answer Key Marked */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Options (Answer Key Highlighted)
            </h3>
            <span className="text-xs text-muted">Key marked in green</span>
          </div>

          {q.options && q.options.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {q.options.map((opt) => {
                const isKey =
                  (q.answerKey.kind === "single_option" && q.answerKey.optionId === opt.id) ||
                  (q.answerKey.kind === "multiple_options" && q.answerKey.optionIds.includes(opt.id));

                return (
                  <div
                    key={opt.id}
                    data-testid={`option-${opt.id}`}
                    data-is-key={isKey}
                    className={`relative flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                      isKey
                        ? "border-emerald-500 bg-emerald-50/70 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${
                        isKey ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {opt.id}
                    </span>

                    <div className="flex-1 text-sm font-medium text-ink">
                      <span>{opt.text}</span>
                    </div>

                    {isKey ? (
                      <span
                        data-testid="key-badge"
                        className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs"
                      >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        KEY
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Declared Key:</span>
              <p className="mt-1 font-mono text-base font-bold text-emerald-950">
                {JSON.stringify(q.answerKey)}
              </p>
            </div>
          )}
        </div>

        {/* Authoring Explanation / Worked Solution */}
        {q.explanation ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Authoring Explanation / Worked Solution
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
              {q.explanation}
            </p>
          </div>
        ) : null}

        {/* Validation Evidence & Diagnostics Panel */}
        <div className="rounded-xl border border-dashed border-royal/20 bg-sand-light/30 p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-royal/10 pb-2">
            <span className="font-bold uppercase tracking-wider text-royal">
              Evidence & Machine Diagnostics
            </span>
            <span
              data-testid="evidence-badge"
              className={`rounded px-2 py-0.5 font-semibold ${
                item.isMachineVerifiable
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {item.isMachineVerifiable ? "Machine-Verifiable Answer" : "Requires Semantic Judgement"}
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <span className="text-slate-500">Content Hash: </span>
              <code className="font-mono text-[11px] text-slate-700">
                {item.contentHash ? `${item.contentHash.slice(0, 16)}...` : "none"}
              </code>
            </div>
            <div>
              <span className="text-slate-500">Revision: </span>
              <code className="font-mono text-[11px] text-slate-700">r{item.revision}</code>
            </div>
          </div>

          {/* Attached Semantic Review Evidence (if present) */}
          {item.externalReview ? (
            <div className="mt-3 rounded-lg border border-royal/15 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-royal">
                  Attached Review: {item.externalReview.reviewerModel ?? "External Reviewer"}
                </span>
                {item.externalReview.confidence !== undefined ? (
                  <span className="font-medium text-slate-600">
                    Confidence: {(item.externalReview.confidence * 100).toFixed(0)}%
                  </span>
                ) : null}
              </div>
              {item.externalReview.findings && item.externalReview.findings.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-700">
                  {item.externalReview.findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              ) : null}
              {item.externalReview.recommendedCorrections && item.externalReview.recommendedCorrections.length > 0 ? (
                <div className="mt-2 text-amber-800">
                  <strong>Notes / Suggested Fixes:</strong>
                  <ul className="list-disc pl-4">
                    {item.externalReview.recommendedCorrections.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Reviewer Decision & Notes Action Bar */}
      <div className="border-t border-royal/15 bg-sand-light/40 p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Decision:
              </span>

              {/* [A] Approve */}
              <button
                type="button"
                data-testid="btn-approve"
                onClick={() => onDecisionChange(item.id, "approve")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold shadow-xs transition-colors ${
                  isApproved
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2"
                    : "bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <kbd className="rounded bg-black/10 px-1 py-0.5 text-xs font-mono">A</kbd>
                <span>Approve</span>
              </button>

              {/* [R] Reject */}
              <button
                type="button"
                data-testid="btn-reject"
                onClick={() => onDecisionChange(item.id, "reject")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold shadow-xs transition-colors ${
                  isRejected
                    ? "bg-rose-600 text-white ring-2 ring-rose-600 ring-offset-2"
                    : "bg-white text-rose-800 border border-rose-300 hover:bg-rose-50"
                }`}
              >
                <kbd className="rounded bg-black/10 px-1 py-0.5 text-xs font-mono">R</kbd>
                <span>Reject</span>
              </button>

              {/* [V] Needs Revision */}
              <button
                type="button"
                data-testid="btn-revise"
                onClick={() => onDecisionChange(item.id, "revise")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold shadow-xs transition-colors ${
                  isRevised
                    ? "bg-amber-600 text-white ring-2 ring-amber-600 ring-offset-2"
                    : "bg-white text-amber-800 border border-amber-300 hover:bg-amber-50"
                }`}
              >
                <kbd className="rounded bg-black/10 px-1 py-0.5 text-xs font-mono">V</kbd>
                <span>Revision</span>
              </button>

              {/* [U] Clear */}
              <button
                type="button"
                data-testid="btn-clear"
                onClick={() => onDecisionChange(item.id, "")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 ${
                  isUndecided ? "bg-slate-200/50" : "bg-transparent"
                }`}
              >
                <kbd className="rounded bg-black/10 px-1 py-0.5 font-mono">U</kbd>
                <span>Clear</span>
              </button>
            </div>

            {/* Current Decision Pill */}
            <div>
              <span
                data-testid="current-decision-badge"
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : isRejected
                    ? "bg-rose-100 text-rose-900 border border-rose-300"
                    : isRevised
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-slate-100 text-slate-600 border border-slate-300"
                }`}
              >
                {item.decision ? item.decision : "Undecided (Exports Blank)"}
              </span>
            </div>
          </div>

          {/* Notes Input Field (Keyboard First: [E] or [/] to focus, [Esc] to blur) */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <label htmlFor="reviewer-notes" className="font-semibold text-slate-700">
                Reviewer Notes / Feedback:
              </label>
              <span>
                Press <kbd className="rounded bg-slate-200 px-1 font-mono">E</kbd> or{" "}
                <kbd className="rounded bg-slate-200 px-1 font-mono">/</kbd> to edit ·{" "}
                <kbd className="rounded bg-slate-200 px-1 font-mono">Esc</kbd> to return to shortcuts
              </span>
            </div>
            <textarea
              id="reviewer-notes"
              ref={noteRef}
              data-testid="input-notes"
              value={item.notes}
              onChange={(e) => onNotesChange(item.id, e.target.value)}
              placeholder="Add optional notes, rationale, or required revision fixes..."
              rows={2}
              className="w-full rounded-xl border border-royal/20 bg-white p-2.5 text-sm text-ink placeholder:text-muted focus:border-royal focus:outline-hidden focus:ring-1 focus:ring-royal"
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              data-testid="btn-prev"
              onClick={onPrev}
              disabled={item.index === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <kbd className="rounded bg-slate-100 px-1 font-mono">P</kbd>
              <span>Previous</span>
            </button>

            <span className="text-xs text-muted">
              Hotkeys: <kbd className="rounded bg-slate-200 px-1 font-mono">A</kbd> Approve ·{" "}
              <kbd className="rounded bg-slate-200 px-1 font-mono">R</kbd> Reject ·{" "}
              <kbd className="rounded bg-slate-200 px-1 font-mono">V</kbd> Revise ·{" "}
              <kbd className="rounded bg-slate-200 px-1 font-mono">N</kbd> Next
            </span>

            <button
              type="button"
              data-testid="btn-next"
              onClick={onNext}
              disabled={item.index === totalItems - 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <span>Next</span>
              <kbd className="rounded bg-slate-100 px-1 font-mono">N</kbd>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
