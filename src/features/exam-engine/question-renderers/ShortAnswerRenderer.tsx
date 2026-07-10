"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { toDomId } from "./renderer-utils";

export function ShortAnswerRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const inputId = `${toDomId(question.id)}-short-answer`;
  const instructionsId = question.instructions ? `${inputId}-instructions` : undefined;
  const value = typeof answer === "string" ? answer : "";
  const requiresManualReview = question.answerKey.kind === "manual";

  return (
    <div className="space-y-4">
      <label htmlFor={inputId} className="block text-lg font-semibold text-slate-900">
        {question.prompt}
      </label>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}
      <input
        id={inputId}
        type="text"
        value={value}
        disabled={disabled}
        aria-describedby={instructionsId}
        autoComplete="off"
        onChange={(event) => onAnswerChange?.(event.currentTarget.value)}
        className="min-h-12 w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none focus-visible:border-[#4B2E83] focus-visible:ring-2 focus-visible:ring-[#4B2E83]/30 disabled:cursor-not-allowed disabled:bg-slate-100"
      />
      {requiresManualReview ? (
        <p className="text-sm font-medium text-slate-500">
          This answer will be reviewed by a marker.
        </p>
      ) : null}
    </div>
  );
}
