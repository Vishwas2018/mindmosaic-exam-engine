"use client";

import { useState } from "react";
import { CheckCircle2, Edit } from "lucide-react";

import type { Question } from "@/schemas/question.schema";
import type { WritingHistoryItem } from "@/server/writing/queries";

const WRITING_MODES = [
  "all",
  "narrative",
  "persuasive",
  "descriptive",
  "expository",
  "informative",
  "creative",
] as const;

function modeForQuestion(question: Question): string {
  const known = ["narrative", "persuasive", "descriptive", "expository", "informative", "creative"];
  for (const tag of question.metadata.tags) {
    if (known.includes(tag)) return tag;
  }
  const topicLower = question.metadata.topic.toLowerCase();
  for (const k of known) {
    if (topicLower.includes(k)) return k;
  }
  return "narrative";
}

export function VihaanWritingPractice({
  writingPrompts = [],
  writingHistory = [],
  onStartWritingPrompt,
}: {
  writingPrompts?: readonly Question[];
  writingHistory?: readonly WritingHistoryItem[];
  onStartWritingPrompt?: (question: Question, minutes: number) => void;
}) {
  const [selectedMode, setSelectedMode] = useState<string>("all");

  const filtered =
    selectedMode === "all"
      ? writingPrompts
      : writingPrompts.filter((q) => modeForQuestion(q) === selectedMode);

  const markedMap = new Map<string, WritingHistoryItem>();
  for (const item of writingHistory) {
    if (!markedMap.has(item.attempt.taskId)) {
      markedMap.set(item.attempt.taskId, item);
    }
  }

  return (
    <section
      data-testid="vihaan-writing-practice"
      className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink">Writing practice & parent feedback</h2>
        </div>
        <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          {writingPrompts.length} approved prompts · 1–5 rubric
        </span>
      </div>

      <p className="text-sm text-mm-muted">
        Choose a Creative, Persuasive, Narrative, Descriptive, Expository, or Informative task.
        Responses save to your writing folder so your parent can mark all six criteria on the 1–5
        scale.
      </p>

      <div className="flex flex-wrap gap-2">
        {WRITING_MODES.map((mode) => {
          const active = selectedMode === mode;
          return (
            <button
              key={mode}
              type="button"
              data-testid={`writing-mode-${mode}`}
              onClick={() => setSelectedMode(mode)}
              className={`rounded-btn border px-3 py-1.5 text-xs font-semibold capitalize transition ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-mm-line bg-mm-page/50 text-ink hover:border-primary/40 hover:bg-mm-tint"
              }`}
            >
              {mode === "all" ? `All modes (${writingPrompts.length})` : mode}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.slice(0, 8).map((prompt) => {
          const mins = Math.max(15, Math.round(prompt.metadata.estimatedTimeSeconds / 60));
          const modeLabel = modeForQuestion(prompt);
          const historyEntry = markedMap.get(prompt.id);

          return (
            <div
              key={prompt.id}
              data-testid={`writing-card-${prompt.id}`}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-mm-line bg-mm-page/50 p-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-mm-line bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-mm-muted">
                    {modeLabel}
                  </span>
                  <span className="text-[11px] text-mm-muted">{mins}-minute timer</span>
                  {historyEntry?.mark && (
                    <span
                      data-testid={`writing-score-badge-${prompt.id}`}
                      className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                    >
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Marked: {historyEntry.mark.awardedMarks} / {historyEntry.mark.maxMarks}
                    </span>
                  )}
                  {historyEntry && !historyEntry.mark && (
                    <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      Submitted · awaiting parent mark
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-ink">{prompt.prompt}</p>
                {historyEntry?.mark?.feedback && (
                  <p className="text-xs text-mm-muted">
                    Parent feedback: {historyEntry.mark.feedback}
                  </p>
                )}
              </div>
              <button
                type="button"
                data-testid={`vihaan-writing-start-${prompt.id}`}
                disabled={!onStartWritingPrompt}
                onClick={() => onStartWritingPrompt?.(prompt, mins)}
                className="shrink-0 rounded-btn border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint disabled:opacity-50"
              >
                Write ({mins}m)
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length > 8 && (
        <p className="text-xs text-mm-muted">
          Showing 8 of {filtered.length} tasks in this mode (adaptive selection prioritises unseen
          prompts first).
        </p>
      )}
    </section>
  );
}
