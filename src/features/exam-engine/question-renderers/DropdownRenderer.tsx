"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { elementStateClasses, FOCUS_RING_CLASSES, stateSignal } from "./element-state";
import { resolveDropdownFieldState } from "./reveal-resolvers";
import { toDomId } from "./renderer-utils";

export function DropdownRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
  reveal,
}: QuestionRendererProps) {
  const questionId = toDomId(question.id);
  const instructionsId = question.instructions
    ? `${questionId}-instructions`
    : undefined;
  const interaction =
    question.interaction?.type === "dropdown" ? question.interaction : undefined;
  const current: Record<string, string> =
    answer && typeof answer === "object" && !Array.isArray(answer)
      ? { ...(answer as Record<string, string>) }
      : {};

  if (!interaction) {
    return (
      <p role="alert" className="text-sm text-red-700">
        This dropdown question is missing its field configuration.
      </p>
    );
  }

  const update = (fieldId: string, value: string) => {
    if (disabled) return;
    const next = { ...current };
    if (value === "") {
      delete next[fieldId];
    } else {
      next[fieldId] = value;
    }
    onAnswerChange?.(next);
  };

  return (
    <fieldset className="space-y-4" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-slate-900">{question.prompt}</legend>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}
      <div className="grid gap-4 sm:max-w-lg">
        {interaction.fields.map((field) => {
          const selectId = `${questionId}-field-${toDomId(field.id)}`;
          const chosen = current[field.id];
          const state = reveal ? resolveDropdownFieldState(reveal, field.id, chosen) : undefined;
          const signal = state ? stateSignal(state) : undefined;
          const correctOptionId =
            reveal && state !== "correct" && reveal.answerKey.kind === "dropdown"
              ? reveal.answerKey.fields.find((entry) => entry.id === field.id)?.correctOptionId
              : undefined;
          const correctOptionText = correctOptionId
            ? field.options.find((option) => option.id === correctOptionId)?.text
            : undefined;
          return (
            <div key={field.id} className="grid gap-1.5">
              <label htmlFor={selectId} className="text-sm font-semibold text-slate-800">
                {field.label}
              </label>
              <select
                id={selectId}
                value={chosen ?? ""}
                disabled={disabled}
                aria-invalid={state === "incorrect" ? "true" : undefined}
                onChange={(event) => update(field.id, event.currentTarget.value)}
                className={
                  state
                    ? `min-h-12 w-full rounded-xl px-4 py-3 text-base text-slate-900 outline-none transition-colors disabled:cursor-not-allowed ${elementStateClasses(state)} ${FOCUS_RING_CLASSES}`
                    : "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus-visible:border-royal focus-visible:ring-2 focus-visible:ring-royal/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                }
              >
                <option value="">Choose…</option>
                {field.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.text}
                  </option>
                ))}
              </select>
              {signal ? (
                <span className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${signal.textClass}`}>
                  <signal.icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {signal.label}
                  {correctOptionText ? `: ${correctOptionText}` : ""}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
