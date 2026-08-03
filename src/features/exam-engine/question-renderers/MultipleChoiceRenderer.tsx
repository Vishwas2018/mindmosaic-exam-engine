"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { OPTION_LETTERS, optionLetterClasses } from "./renderer-utils";

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
      <legend className="text-lg font-semibold text-ink">
        {question.prompt}
      </legend>

      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-muted">
          {question.instructions}
        </p>
      ) : null}

      <div className="grid gap-3" role="radiogroup">
        {question.options.map((option, index) => {
          const optionId = `${questionId}-option-${toDomId(option.id)}`;

          return (
            <label
              key={option.id}
              htmlFor={optionId}
              className="flex min-h-12 cursor-pointer items-center gap-3.5 rounded-xl border border-royal/15 bg-white px-4 py-3.5 text-ink shadow-[0_2px_8px_rgba(49,32,86,0.04)] transition [transition-property:color,background-color,border-color,box-shadow,transform] has-[:not(:disabled):hover]:-translate-y-0.5 has-[:not(:disabled):hover]:border-brand-bright/50 has-[:not(:disabled):hover]:shadow-[0_4px_14px_rgba(49,32,86,0.08)] has-[:checked]:border-royal has-[:checked]:bg-page has-[:checked]:shadow-[0_0_0_3px_rgba(89,37,168,0.1)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--royal-purple)]"
            >
              <span aria-hidden="true" className={optionLetterClasses(selectedOptionId === option.id)}>
                {OPTION_LETTERS[index] ?? index + 1}
              </span>
              <input
                id={optionId}
                type="radio"
                name={`${questionId}-answer`}
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => onAnswerChange?.(option.id)}
                aria-label={option.accessibleLabel}
                className="size-5 shrink-0 accent-royal"
              />
              <span>{option.text}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
