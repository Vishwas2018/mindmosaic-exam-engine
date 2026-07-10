"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { toDomId } from "./renderer-utils";

export function MultipleSelectRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const questionId = toDomId(question.id);
  const instructionsId = question.instructions
    ? `${questionId}-instructions`
    : undefined;
  const selected = Array.isArray(answer)
    ? (answer as readonly string[])
    : [];

  const toggle = (optionId: string) => {
    if (disabled) return;
    const next = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    onAnswerChange?.(next);
  };

  return (
    <fieldset className="space-y-4" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-slate-900">{question.prompt}</legend>
      <p className="text-sm text-slate-600">Select all correct answers.</p>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}
      <div className="grid gap-3">
        {question.options.map((option) => {
          const optionId = `${questionId}-option-${toDomId(option.id)}`;
          const isChecked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              htmlFor={optionId}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 transition-colors has-[:checked]:border-[#4B2E83] has-[:checked]:bg-[#F7F4FF] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#4B2E83]"
            >
              <input
                id={optionId}
                type="checkbox"
                name={`${questionId}-answer`}
                value={option.id}
                checked={isChecked}
                onChange={() => toggle(option.id)}
                aria-label={option.accessibleLabel}
                className="size-5 shrink-0 accent-[#4B2E83]"
              />
              <span>{option.text}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
