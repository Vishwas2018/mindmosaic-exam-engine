"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { elementStateClasses, FOCUS_RING_CLASSES, stateSignal } from "./element-state";
import { resolveBooleanOptionState } from "./reveal-resolvers";
import { optionLetterClasses, toDomId } from "./renderer-utils";

const CHOICES: ReadonlyArray<{ value: boolean; label: string }> = [
  { value: true, label: "True" },
  { value: false, label: "False" },
];

export function TrueFalseRenderer({
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
  const selected = typeof answer === "boolean" ? answer : undefined;

  return (
    <fieldset className="space-y-4" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-ink">{question.prompt}</legend>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-muted">
          {question.instructions}
        </p>
      ) : null}
      <div className="grid gap-3 sm:max-w-sm">
        {CHOICES.map((choice) => {
          const id = `${questionId}-${choice.label.toLowerCase()}`;
          const isSelected = selected === choice.value;
          const state = reveal ? resolveBooleanOptionState(reveal, choice.value, isSelected) : undefined;
          const signal = state ? stateSignal(state) : undefined;
          return (
            <label
              key={choice.label}
              htmlFor={id}
              className={
                state
                  ? `flex min-h-12 items-center gap-3.5 rounded-xl px-4 py-3.5 text-ink transition-colors ${elementStateClasses(state)} ${FOCUS_RING_CLASSES}`
                  : "flex min-h-12 cursor-pointer items-center gap-3.5 rounded-xl border border-royal/15 bg-white px-4 py-3.5 text-ink shadow-[0_2px_8px_rgba(49,32,86,0.04)] transition [transition-property:color,background-color,border-color,box-shadow,transform] has-[:not(:disabled):hover]:-translate-y-0.5 has-[:not(:disabled):hover]:border-brand-bright/50 has-[:not(:disabled):hover]:shadow-[0_4px_14px_rgba(49,32,86,0.08)] has-[:checked]:border-royal has-[:checked]:bg-page has-[:checked]:shadow-[0_0_0_3px_rgba(89,37,168,0.1)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--royal-purple)]"
              }
            >
              <span aria-hidden="true" className={optionLetterClasses(isSelected)}>
                {choice.label.charAt(0)}
              </span>
              <input
                id={id}
                type="radio"
                name={`${questionId}-answer`}
                checked={isSelected}
                onChange={() => onAnswerChange?.(choice.value)}
                className="size-5 shrink-0 accent-[var(--royal-purple)]"
              />
              <span className="min-w-0 flex-1">{choice.label}</span>
              {signal ? (
                <span className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${signal.textClass}`}>
                  <signal.icon aria-hidden="true" className="h-4 w-4" />
                  {signal.label}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
