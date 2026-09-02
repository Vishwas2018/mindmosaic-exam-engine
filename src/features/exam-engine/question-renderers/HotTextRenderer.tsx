"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

export function HotTextRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const interaction =
    question.interaction?.type === "hot_text" ? question.interaction : undefined;
  const selected = Array.isArray(answer) ? [...answer] : [];
  if (!interaction) {
    return (
      <p role="alert" className="text-sm text-red-700">
        This hot-text question is missing its text regions.
      </p>
    );
  }

  const minimum = interaction.minSelections ?? 1;
  const maximum =
    interaction.selectionMode === "single"
      ? 1
      : (interaction.maxSelections ??
        interaction.segments.filter((segment) => segment.kind === "selectable").length);

  const toggle = (id: string) => {
    if (disabled) return;
    const next = selected.includes(id)
      ? selected.filter((value) => value !== id)
      : interaction.selectionMode === "single"
        ? [id]
        : selected.length < maximum
          ? [...selected, id]
          : selected;
    onAnswerChange?.(next);
  };

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="text-lg font-semibold text-ink">{question.prompt}</legend>
      <p className="text-sm text-muted">
        Select{" "}
        {interaction.selectionMode === "single"
          ? "one region"
          : `between ${minimum} and ${maximum} regions`}
        .
      </p>
      {question.instructions ? (
        <p className="text-sm text-muted">{question.instructions}</p>
      ) : null}
      <div
        className="rounded-2xl border border-royal/15 bg-white p-5 text-lg leading-9"
        role="group"
        aria-label="Selectable text"
      >
        {interaction.segments.map((segment, index) =>
          segment.kind === "text" ? (
            <span key={`text-${index}`}>{segment.text}</span>
          ) : (
            <button
              key={segment.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected.includes(segment.id)}
              aria-label={segment.accessibleLabel ?? segment.text}
              onClick={() => toggle(segment.id)}
              className="mx-0.5 rounded-md border border-slate-300 px-1.5 py-0.5 text-left outline-none aria-pressed:border-royal aria-pressed:bg-royal/15 focus-visible:ring-2 focus-visible:ring-royal/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {segment.text}
            </button>
          ),
        )}
      </div>
    </fieldset>
  );
}
