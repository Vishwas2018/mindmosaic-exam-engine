"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

function toDomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function NumberEntryRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const inputId = `${toDomId(question.id)}-number-answer`;
  const instructionsId = question.instructions
    ? `${inputId}-instructions`
    : undefined;
  const inputValue =
    typeof answer === "number" || typeof answer === "string" ? answer : "";

  return (
    <div className="space-y-4">
      <label htmlFor={inputId} className="block text-lg font-semibold text-slate-900">
        {question.prompt}
      </label>

      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}

      <input
        id={inputId}
        type="number"
        inputMode="decimal"
        step="any"
        value={inputValue}
        disabled={disabled}
        aria-describedby={instructionsId}
        onChange={(event) => {
          onAnswerChange?.(
            event.currentTarget.value === ""
              ? null
              : event.currentTarget.valueAsNumber,
          );
        }}
        className="min-h-12 w-full max-w-xs rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none focus-visible:border-[#4B2E83] focus-visible:ring-2 focus-visible:ring-[#4B2E83]/30 disabled:cursor-not-allowed disabled:bg-slate-100"
      />
    </div>
  );
}
