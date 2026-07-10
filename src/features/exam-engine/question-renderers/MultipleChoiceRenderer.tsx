"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

function toDomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function MultipleChoiceRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const questionId = toDomId(question.id);
  const instructionsId = question.instructions
    ? `${questionId}-instructions`
    : undefined;
  const selectedOptionId = typeof answer === "string" ? answer : undefined;

  return (
    <fieldset
      className="space-y-4"
      disabled={disabled}
      aria-describedby={instructionsId}
    >
      <legend className="text-lg font-semibold text-slate-900">
        {question.prompt}
      </legend>

      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}

      <div className="grid gap-3">
        {question.options.map((option) => {
          const optionId = `${questionId}-option-${toDomId(option.id)}`;

          return (
            <label
              key={option.id}
              htmlFor={optionId}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 transition-colors has-[:checked]:border-[#4B2E83] has-[:checked]:bg-[#F7F4FF] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#4B2E83]"
            >
              <input
                id={optionId}
                type="radio"
                name={`${questionId}-answer`}
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => onAnswerChange?.(option.id)}
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
