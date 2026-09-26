"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { elementStateClasses, FOCUS_RING_CLASSES, stateSignal } from "./element-state";
import { resolveShortAnswerState } from "./reveal-resolvers";
import { toDomId } from "./renderer-utils";

export function ShortAnswerRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
  reveal,
}: QuestionRendererProps) {
  const inputId = `${toDomId(question.id)}-short-answer`;
  const instructionsId = question.instructions ? `${inputId}-instructions` : undefined;
  const value = typeof answer === "string" ? answer : "";
  const requiresManualReview = question.answerKind === "manual";
  // Manual (essay-graded) short answers never get ok/bad colouring — same treatment as EssayRenderer.
  const state = reveal && !requiresManualReview ? resolveShortAnswerState(reveal, value) : undefined;
  const signal = state ? stateSignal(state) : undefined;
  const correctAnswer =
    reveal && state !== "correct" && reveal.answerKey.kind === "text"
      ? reveal.answerKey.acceptableAnswers[0]
      : undefined;

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
        aria-invalid={state === "incorrect" ? "true" : undefined}
        autoComplete="off"
        onChange={(event) => onAnswerChange?.(event.currentTarget.value)}
        className={
          state
            ? `min-h-12 w-full max-w-md rounded-xl px-4 py-3 text-lg text-slate-900 outline-none transition-colors disabled:cursor-not-allowed ${elementStateClasses(state)} ${FOCUS_RING_CLASSES}`
            : "min-h-12 w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none focus-visible:border-royal focus-visible:ring-2 focus-visible:ring-royal/30 disabled:cursor-not-allowed disabled:bg-slate-100"
        }
      />
      {signal ? (
        <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${signal.textClass}`}>
          <signal.icon aria-hidden="true" className="h-4 w-4" />
          {signal.label}
          {correctAnswer ? `: ${correctAnswer}` : ""}
        </span>
      ) : null}
      {requiresManualReview ? (
        <p className="text-sm font-medium text-slate-500">
          This answer will be reviewed by a marker.
        </p>
      ) : null}
    </div>
  );
}
