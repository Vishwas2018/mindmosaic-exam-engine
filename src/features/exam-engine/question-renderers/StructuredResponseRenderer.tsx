"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";
import { toDomId } from "./renderer-utils";

export function StructuredResponseRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  if (question.interaction?.type !== "structured_response") return null;
  const interaction = question.interaction;

  const response =
    typeof answer === "object" && answer !== null && !Array.isArray(answer)
      ? (answer as Readonly<Record<string, string | number>>)
      : {};

  const change = (
    partId: string,
    value: string,
    responseKind?: "number" | "short_text",
  ) => {
    let resolved: string | number = value;
    if (responseKind === "number") {
      const trimmed = value.trim();
      if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
        resolved = Number(trimmed);
      }
    }
    onAnswerChange?.({ ...response, [partId]: resolved });
  };

  return (
    <fieldset className="space-y-5" disabled={disabled}>
      <legend className="text-lg font-semibold text-ink">{question.prompt}</legend>
      {question.instructions ? (
        <p className="text-sm text-muted">{question.instructions}</p>
      ) : null}
      {interaction.parts.map((part, index) => {
        const id = `${toDomId(question.id)}-${toDomId(part.id)}`;
        const rawValue = response[part.id];
        const displayValue =
          rawValue === undefined || rawValue === null ? "" : String(rawValue);

        return (
          <div
            key={part.id}
            className="space-y-2 rounded-xl border border-royal/15 bg-white p-4"
          >
            <label htmlFor={id} className="block font-medium text-ink">
              <span className="mr-2 text-royal">
                ({String.fromCharCode(97 + index)})
              </span>
              {part.label}
            </label>
            <input
              id={id}
              type={part.responseKind === "number" ? "number" : "text"}
              inputMode={part.responseKind === "number" ? "decimal" : undefined}
              value={displayValue}
              placeholder={part.placeholder}
              required={part.required}
              disabled={disabled}
              onChange={(event) =>
                change(part.id, event.target.value, part.responseKind)
              }
              className="min-h-12 w-full rounded-lg border border-slate-300 px-3 py-2 text-ink focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        );
      })}
      {interaction.workingArea.enabled ? (
        <div className="space-y-2">
          <label
            htmlFor={`${toDomId(question.id)}-working`}
            className="block font-medium text-ink"
          >
            {interaction.workingArea.label}
          </label>
          <textarea
            id={`${toDomId(question.id)}-working`}
            value={
              response.__working !== undefined && response.__working !== null
                ? String(response.__working)
                : ""
            }
            maxLength={interaction.workingArea.maxLength}
            disabled={disabled}
            onChange={(event) => change("__working", event.target.value)}
            className="min-h-32 w-full rounded-lg border border-slate-300 p-3 text-ink focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="text-xs text-muted">
            Working may require manual review and is not compared as an algebraic string.
          </p>
        </div>
      ) : null}
    </fieldset>
  );
}
