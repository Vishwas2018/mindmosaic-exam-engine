"use client";

import { useState } from "react";
import type { QuestionRendererProps } from "@/features/exam-engine/types";
import { VisualRenderer } from "@/features/exam-engine/visual-renderers";

import { regionPosition } from "./region-position";
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
  const directPlacement = interaction?.presentation === "direct_placement";
  const directVisualId = interaction?.targets[0]?.visualId;
  const directVisual = directPlacement
    ? question.visuals.find((visual) => visual.id === directVisualId)
    : undefined;
  const diagram = directPlacement
    ? (directVisual?.type === "hotspot_svg" ? directVisual : undefined)
    : question.visuals.find(
        (visual) => visual.type === "labelled_svg" || visual.type === "hotspot_svg",
      );
  const current: Record<string, string> =
    answer && typeof answer === "object" && !Array.isArray(answer)
      ? { ...(answer as Record<string, string>) }
      : {};
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

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
      {diagram && !directPlacement ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <VisualRenderer visual={diagram} />
        </div>
      ) : null}
      {directPlacement && diagram?.type === "hotspot_svg" ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4" role="group" aria-label="Place diagram labels">
          <div>
            <h3 className="mb-2 text-sm font-bold">Labels</h3>
            <div className="flex flex-wrap gap-2">
              {interaction.labels.map((label) => (
                <button
                  type="button"
                  key={label.id}
                  disabled={disabled}
                  aria-pressed={activeLabel === label.id}
                  onClick={() => setActiveLabel(label.id)}
                  className="min-h-11 rounded-xl border border-slate-300 p-2 text-left outline-none aria-pressed:border-royal aria-pressed:bg-royal/10 focus-visible:ring-2 focus-visible:ring-royal/40"
                >
                  {label.text}
                </button>
              ))}
            </div>
          </div>
          <div
            className="relative mx-auto w-full max-w-xl"
            style={{ aspectRatio: `${diagram.data.width} / ${diagram.data.height}` }}
          >
            <VisualRenderer visual={diagram} />
            {interaction.targets.map((target) => {
              const position = target.regionId
                ? regionPosition(diagram, target.regionId)
                : undefined;
              const placedLabels = interaction.labels.filter((label) => current[label.id] === target.id);
              if (!position) return null;
              return (
                <button
                  type="button"
                  key={target.id}
                  disabled={disabled || !activeLabel}
                  aria-label={target.label}
                  onClick={() => {
                    if (activeLabel) update(activeLabel, target.id);
                    setActiveLabel(null);
                  }}
                  className="absolute min-h-11 min-w-24 max-w-40 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-dashed border-royal bg-white/95 px-3 py-2 text-sm shadow-md outline-none focus-visible:ring-2 focus-visible:ring-royal/40 disabled:opacity-70"
                  style={{ left: `${position.leftPercent}%`, top: `${position.topPercent}%` }}
                >
                  <span className="font-semibold">{target.label}</span>
                  {placedLabels.length > 0 ? (
                    <span className="mt-1 block text-xs text-slate-600">
                      {placedLabels.map((label) => label.text).join(", ")}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className={directPlacement ? "rounded-2xl border border-slate-200 bg-slate-50 p-4" : ""}>
      {directPlacement ? <h3 className="mb-3 text-sm font-bold">Keyboard and screen-reader alternative</h3> : null}
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
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus-visible:border-royal focus-visible:ring-2 focus-visible:ring-royal/30 disabled:cursor-not-allowed disabled:bg-slate-100 sm:w-64"
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
      </div>
    </fieldset>
  );
}
