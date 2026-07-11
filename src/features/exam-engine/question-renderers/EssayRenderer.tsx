"use client";

import { ClipboardCheck } from "lucide-react";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { countWords, toDomId } from "./renderer-utils";

export function EssayRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const inputId = `${toDomId(question.id)}-essay`;
  const instructionsId = question.instructions ? `${inputId}-instructions` : undefined;
  const countId = `${inputId}-count`;
  const value = typeof answer === "string" ? answer : "";
  const words = countWords(value);
  const { minWords, maxWords } = question;

  const rangeLabel =
    minWords && maxWords
      ? `Aim for ${minWords}–${maxWords} words.`
      : minWords
        ? `Write at least ${minWords} words.`
        : maxWords
          ? `Write up to ${maxWords} words.`
          : null;

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
      {rangeLabel ? <p className="text-sm text-slate-600">{rangeLabel}</p> : null}
      <textarea
        id={inputId}
        rows={10}
        value={value}
        disabled={disabled}
        aria-describedby={[instructionsId, countId].filter(Boolean).join(" ") || undefined}
        onChange={(event) => onAnswerChange?.(event.currentTarget.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-900 outline-none focus-visible:border-[#4B2E83] focus-visible:ring-2 focus-visible:ring-[#4B2E83]/30 disabled:cursor-not-allowed disabled:bg-slate-100"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id={countId} className="text-sm font-medium text-slate-600" aria-live="polite">
          {words} {words === 1 ? "word" : "words"}
        </p>
        <p className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900">
          <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
          Marked by a teacher
        </p>
      </div>
    </div>
  );
}
