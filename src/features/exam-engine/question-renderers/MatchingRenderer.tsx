"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { elementStateClasses, FOCUS_RING_CLASSES, stateSignal } from "./element-state";
import { resolvePairState } from "./reveal-resolvers";
import { toDomId } from "./renderer-utils";

export function MatchingRenderer({
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
          const chosen = current[source.id];
          const state = reveal ? resolvePairState(reveal, source.id, chosen) : undefined;
          const signal = state ? stateSignal(state) : undefined;
          const correctTargetId =
            reveal && state !== "correct" && reveal.answerKey.kind === "matching"
              ? reveal.answerKey.pairs.find((pair) => pair.sourceId === source.id)?.targetId
              : undefined;
          const correctTargetText = correctTargetId
            ? interaction.targets.find((target) => target.id === correctTargetId)?.text
            : undefined;
          return (
            <li
              key={source.id}
              className={
                state
                  ? `grid gap-2 rounded-xl p-4 transition-colors sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 ${elementStateClasses(state)}`
                  : "grid gap-2 rounded-xl border border-slate-300 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
              }
            >
              <label htmlFor={selectId} className="font-medium text-slate-800">
                {source.text}
              </label>
              <select
                id={selectId}
                value={chosen ?? ""}
                disabled={disabled}
                aria-invalid={state === "incorrect" ? "true" : undefined}
                onChange={(event) => update(source.id, event.currentTarget.value)}
                className={
                  state
                    ? `min-h-12 w-full rounded-xl border border-white/60 bg-white px-4 py-3 text-base text-slate-900 outline-none disabled:cursor-not-allowed sm:w-64 ${FOCUS_RING_CLASSES}`
                    : "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus-visible:border-royal focus-visible:ring-2 focus-visible:ring-royal/30 disabled:cursor-not-allowed disabled:bg-slate-100 sm:w-64"
                }
              >
                <option value="">Choose a match…</option>
                {interaction.targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.text}
                  </option>
                ))}
              </select>
              {signal ? (
                <span className={`flex items-center gap-1.5 text-[12.5px] font-semibold sm:col-span-2 ${signal.textClass}`}>
                  <signal.icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {signal.label}
                  {correctTargetText ? `: ${correctTargetText}` : ""}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
