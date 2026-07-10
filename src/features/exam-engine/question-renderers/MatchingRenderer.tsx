"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { toDomId } from "./renderer-utils";

export function MatchingRenderer({
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
    question.interaction?.type === "matching" ? question.interaction : undefined;
  const current: Record<string, string> =
    answer && typeof answer === "object" && !Array.isArray(answer)
      ? { ...(answer as Record<string, string>) }
      : {};

  if (!interaction) {
    return (
      <p role="alert" className="text-sm text-red-700">
        This matching question is missing its item configuration.
      </p>
    );
  }

  const update = (sourceId: string, value: string) => {
    if (disabled) return;
    const next = { ...current };
    if (value === "") {
      delete next[sourceId];
    } else {
      next[sourceId] = value;
    }
    onAnswerChange?.(next);
  };

  return (
    <fieldset className="space-y-4" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-slate-900">{question.prompt}</legend>
      <p className="text-sm text-slate-600">
        Choose the matching answer for each item.
      </p>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}
      <ul className="grid gap-3">
        {interaction.sources.map((source) => {
          const selectId = `${questionId}-match-${toDomId(source.id)}`;
          return (
            <li
              key={source.id}
              className="grid gap-2 rounded-xl border border-slate-300 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
            >
              <label htmlFor={selectId} className="font-medium text-slate-800">
                {source.text}
              </label>
              <select
                id={selectId}
                value={current[source.id] ?? ""}
                disabled={disabled}
                onChange={(event) => update(source.id, event.currentTarget.value)}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus-visible:border-[#4B2E83] focus-visible:ring-2 focus-visible:ring-[#4B2E83]/30 disabled:cursor-not-allowed disabled:bg-slate-100 sm:w-64"
              >
                <option value="">Choose a match…</option>
                {interaction.targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.text}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
