"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { toDomId } from "./renderer-utils";

export function OrderingRenderer({
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
    question.interaction?.type === "ordering" ? question.interaction : undefined;

  if (!interaction) {
    return (
      <p role="alert" className="text-sm text-red-700">
        This ordering question is missing its item configuration.
      </p>
    );
  }

  const itemsById = new Map(interaction.items.map((item) => [item.id, item]));
  const defaultOrder = interaction.items.map((item) => item.id);
  const providedOrder = Array.isArray(answer) ? (answer as readonly string[]) : [];
  const order =
    providedOrder.length === defaultOrder.length &&
    providedOrder.every((id) => itemsById.has(id))
      ? [...providedOrder]
      : defaultOrder;

  const move = (index: number, direction: -1 | 1) => {
    if (disabled) return;
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    onAnswerChange?.(next);
  };

  return (
    <fieldset className="space-y-4" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-slate-900">{question.prompt}</legend>
      <p className="text-sm text-slate-600">
        Use the move buttons to put the items in the correct order.
      </p>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}
      <ol className="grid gap-2">
        {order.map((id, index) => {
          const item = itemsById.get(id);
          if (!item) return null;
          return (
            <li
              key={id}
              className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F4FF] text-sm font-bold text-[#4B2E83]"
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 text-slate-800">{item.text}</span>
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={disabled || index === 0}
                  aria-label={`Move ${item.text} up`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B2E83] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={disabled || index === order.length - 1}
                  aria-label={`Move ${item.text} down`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B2E83] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowDown aria-hidden="true" className="h-4 w-4" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </fieldset>
  );
}
