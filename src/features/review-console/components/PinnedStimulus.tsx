"use client";

import React, { memo } from "react";

export interface StimulusData {
  title?: string;
  body: string;
  attribution?: string;
}

export interface PinnedStimulusProps {
  stimulus: StimulusData | null | undefined;
  passageIndex?: number;
  totalPassages?: number;
  passageQuestionRange?: string;
}

export const PinnedStimulus = memo(function PinnedStimulus({
  stimulus,
  passageIndex,
  totalPassages,
  passageQuestionRange,
}: PinnedStimulusProps) {
  if (!stimulus) {
    return (
      <div
        data-testid="no-passage-placeholder"
        className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-royal/20 bg-sand-light/40 p-8 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-royal/10 text-royal">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-ink">No Passage Attached</h3>
        <p className="mt-1 max-w-xs text-xs text-muted">
          This question is standalone (e.g. spelling or direct language convention) and does not reference a reading passage.
        </p>
      </div>
    );
  }

  const wordCount = stimulus.body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <section
      data-testid="pinned-stimulus-card"
      aria-label="Pinned Reading Passage"
      className="flex h-full flex-col rounded-2xl border border-royal/15 bg-white shadow-sm"
    >
      {/* Passage Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-royal/10 bg-sand-light/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-royal/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-royal">
            {passageIndex && totalPassages ? `Passage ${passageIndex} of ${totalPassages}` : "Reading Passage"}
          </span>
          {passageQuestionRange ? (
            <span className="text-xs font-medium text-muted">· {passageQuestionRange}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <span className="rounded bg-white px-2 py-0.5 border border-royal/10">{wordCount} words</span>
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Pinned (no re-reading)
          </span>
        </div>
      </div>

      {/* Passage Content Container */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-7">
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {stimulus.title ?? "Reading Passage"}
        </h2>

        <div className="prose prose-slate mt-4 max-w-none">
          <p className="whitespace-pre-wrap text-base font-normal leading-relaxed text-slate-800 sm:text-lg sm:leading-8">
            {stimulus.body}
          </p>
        </div>

        {stimulus.attribution ? (
          <p className="mt-6 border-t border-royal/10 pt-3 text-xs italic text-muted">
            {stimulus.attribution}
          </p>
        ) : null}
      </div>
    </section>
  );
});
