"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { toDomId } from "./renderer-utils";

export function FillBlankRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const questionId = toDomId(question.id);
  const instructionsId = question.instructions
    ? `${questionId}-instructions`
    : undefined;
  const interaction =
    question.interaction?.type === "fill_blank" ? question.interaction : undefined;
  const current: Record<string, string> =
    answer && typeof answer === "object" && !Array.isArray(answer)
      ? { ...(answer as Record<string, string>) }
      : {};

  if (!interaction) {
    return (
      <p role="alert" className="text-sm text-red-700">
        This fill-in-the-blank question is missing its blank configuration.
      </p>
    );
  }

  const update = (blankId: string, value: string) => {
    if (disabled) return;
    onAnswerChange?.({ ...current, [blankId]: value });
  };

  const { segments, blanks } = interaction;

  return (
    <fieldset className="space-y-4" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-slate-900">{question.prompt}</legend>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}
      <p className="flex flex-wrap items-center gap-x-1 gap-y-3 text-lg leading-relaxed text-slate-800">
        {blanks.map((blank, index) => {
          const inputId = `${questionId}-blank-${toDomId(blank.id)}`;
          return (
            <span key={blank.id} className="contents">
              {segments[index] ? <span>{segments[index]}</span> : null}
              <input
                id={inputId}
                type="text"
                autoComplete="off"
                value={current[blank.id] ?? ""}
                disabled={disabled}
                aria-label={blank.label}
                onChange={(event) => update(blank.id, event.currentTarget.value)}
                className="mx-1 inline-block min-h-11 w-40 rounded-lg border-b-2 border-slate-400 bg-slate-50 px-3 py-2 text-center text-base text-slate-900 outline-none focus-visible:border-[#4B2E83] focus-visible:ring-2 focus-visible:ring-[#4B2E83]/30 disabled:bg-slate-100"
              />
            </span>
          );
        })}
        {segments[blanks.length] ? <span>{segments[blanks.length]}</span> : null}
      </p>
    </fieldset>
  );
}
