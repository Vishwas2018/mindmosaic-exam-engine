"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { toDomId } from "./renderer-utils";

const CHOICES: ReadonlyArray<{ value: boolean; label: string }> = [
  { value: true, label: "True" },
  { value: false, label: "False" },
];

export function TrueFalseRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const questionId = toDomId(question.id);
  const instructionsId = question.instructions
    ? `${questionId}-instructions`
    : undefined;
  const selected = typeof answer === "boolean" ? answer : undefined;

  return (
    <fieldset className="space-y-4" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-slate-900">{question.prompt}</legend>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}
      <div className="grid gap-3 sm:max-w-sm">
        {CHOICES.map((choice) => {
          const id = `${questionId}-${choice.label.toLowerCase()}`;
          return (
            <label
              key={choice.label}
              htmlFor={id}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 transition-colors has-[:checked]:border-[#4B2E83] has-[:checked]:bg-[#F7F4FF] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#4B2E83]"
            >
              <input
                id={id}
                type="radio"
                name={`${questionId}-answer`}
                checked={selected === choice.value}
                onChange={() => onAnswerChange?.(choice.value)}
                className="size-5 shrink-0 accent-[#4B2E83]"
              />
              <span>{choice.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
