"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { elementStateClasses, FOCUS_RING_CLASSES, stateSignal } from "./element-state";
import { resolveNumberEntryState } from "./reveal-resolvers";

function toDomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function NumberEntryRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
  reveal,
}: QuestionRendererProps) {
  const inputId = `${toDomId(question.id)}-number-answer`;
  const instructionsId = question.instructions
    ? `${inputId}-instructions`
    : undefined;
  const inputValue =
    typeof answer === "number" || typeof answer === "string" ? answer : "";
  const numericAnswer = typeof answer === "number" ? answer : undefined;
  const state = reveal ? resolveNumberEntryState(reveal, numericAnswer) : undefined;
  const signal = state ? stateSignal(state) : undefined;
  const correctAnswer =
    reveal && state !== "correct" && reveal.answerKey.kind === "number"
      ? `${reveal.answerKey.value}${reveal.answerKey.unit ? ` ${reveal.answerKey.unit}` : ""}`
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
        type="number"
        inputMode="decimal"
        step="any"
        value={inputValue}
        disabled={disabled}
        aria-describedby={instructionsId}
        aria-invalid={state === "incorrect" ? "true" : undefined}
        onChange={(event) => {
          onAnswerChange?.(
            event.currentTarget.value === ""
              ? null
              : event.currentTarget.valueAsNumber,
          );
        }}
        className={
          state
            ? `min-h-12 w-full max-w-xs rounded-xl px-4 py-3 text-lg text-slate-900 outline-none transition-colors disabled:cursor-not-allowed ${elementStateClasses(state)} ${FOCUS_RING_CLASSES}`
            : "min-h-12 w-full max-w-xs rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none focus-visible:border-royal focus-visible:ring-2 focus-visible:ring-royal/30 disabled:cursor-not-allowed disabled:bg-slate-100"
        }
      />
      {signal ? (
        <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${signal.textClass}`}>
          <signal.icon aria-hidden="true" className="h-4 w-4" />
          {signal.label}
          {correctAnswer ? `: ${correctAnswer}` : ""}
        </span>
      ) : null}
    </div>
  );
}
