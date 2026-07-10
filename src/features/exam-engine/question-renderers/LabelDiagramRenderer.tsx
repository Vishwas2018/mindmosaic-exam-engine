"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";
import { VisualRenderer } from "@/features/exam-engine/visual-renderers";

import { toDomId } from "./renderer-utils";

export function LabelDiagramRenderer({
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
    question.interaction?.type === "label_diagram" ? question.interaction : undefined;
  const diagram = question.visuals.find(
    (visual) => visual.type === "labelled_svg" || visual.type === "hotspot_svg",
  );
  const current: Record<string, string> =
    answer && typeof answer === "object" && !Array.isArray(answer)
      ? { ...(answer as Record<string, string>) }
      : {};

  if (!interaction) {
    return (
      <p role="alert" className="text-sm text-red-700">
        This label-the-diagram question is missing its label configuration.
      </p>
    );
  }

  const update = (labelId: string, value: string) => {
    if (disabled) return;
    const next = { ...current };
    if (value === "") {
      delete next[labelId];
    } else {
      next[labelId] = value;
    }
    onAnswerChange?.(next);
  };

  return (
    <fieldset className="space-y-4" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-slate-900">{question.prompt}</legend>
      <p className="text-sm text-slate-600">
        Choose the target position on the diagram for each label.
      </p>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}
      {diagram ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <VisualRenderer visual={diagram} />
        </div>
      ) : null}
      <ul className="grid gap-3">
        {interaction.labels.map((label) => {
          const selectId = `${questionId}-label-${toDomId(label.id)}`;
          return (
            <li
              key={label.id}
              className="grid gap-2 rounded-xl border border-slate-300 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
            >
              <label htmlFor={selectId} className="font-medium text-slate-800">
                {label.text}
              </label>
              <select
                id={selectId}
                value={current[label.id] ?? ""}
                disabled={disabled}
                onChange={(event) => update(label.id, event.currentTarget.value)}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus-visible:border-[#4B2E83] focus-visible:ring-2 focus-visible:ring-[#4B2E83]/30 disabled:cursor-not-allowed disabled:bg-slate-100 sm:w-64"
              >
                <option value="">Choose a position…</option>
                {interaction.targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
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
