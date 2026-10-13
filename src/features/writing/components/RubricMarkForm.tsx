"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { buttonClasses } from "@/components/ui";

import { rubricIsComplete, rubricLevels, rubricMaxMarks, rubricTotal, type RubricScores, type WritingRubric } from "../rubric";

interface Props {
  rubric: WritingRubric;
  attemptId: string;
  /** Existing marks, when re-marking. */
  initial?: { scores: RubricScores; comments: Record<string, string>; feedback: string | null } | null;
  backHref: string;
}

/**
 * The parent marking screen. One page, no wizard: a row of 1-5 buttons per
 * criterion with the anchor for the chosen level underneath, an optional comment
 * behind a disclosure, and a running total pinned to the bottom edge. Marking
 * is meant to take under three minutes, so nothing but the six scores is
 * required.
 *
 * The total shown here is a convenience. The one that is stored is computed by
 * the database from the stored rubric (mark_writing_attempt), and the ceiling is
 * never sent.
 */
export function RubricMarkForm({ rubric, attemptId, initial = null, backHref }: Props) {
  const [scores, setScores] = useState<Partial<RubricScores>>(initial?.scores ?? {});
  const [comments, setComments] = useState<Record<string, string>>(initial?.comments ?? {});
  const [feedback, setFeedback] = useState(initial?.feedback ?? "");
  const [state, setState] = useState<"editing" | "saving" | "saved" | "error">("editing");

  const levels = rubricLevels(rubric);
  const midLevel = Math.round((rubric.scaleMin + rubric.scaleMax) / 2);
  const complete = rubricIsComplete(rubric, scores);
  const total = rubricTotal(rubric, scores);
  const max = rubricMaxMarks(rubric);

  async function save() {
    setState("saving");
    try {
      const response = await fetch(`/api/writing/attempts/${attemptId}/mark`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rubricId: rubric.id,
          rubricVersion: rubric.version,
          scores,
          comments: Object.fromEntries(Object.entries(comments).filter(([, value]) => value.trim() !== "")),
          feedback: feedback.trim() === "" ? undefined : feedback,
        }),
      });
      if (!response.ok) throw new Error("mark_failed");
      setState("saved");
    } catch {
      setState("error");
    }
  }

  if (state === "saved") {
    return (
      <div data-testid="mark-saved" className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="flex items-center gap-2 text-lg font-extrabold text-emerald-900">
          <CheckCircle2 aria-hidden="true" className="h-5 w-5" /> Marks saved: {total} out of {max}
        </p>
        <Link href={backHref} className={buttonClasses({ variant: "secondary" })}>
          Back to writing
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (complete) void save();
      }}
      className="space-y-5 pb-28"
    >
      {rubric.criteria.map((criterion) => {
        const chosen = scores[criterion.id];
        const anchorKey = chosen === undefined ? null : criterion.anchors[String(chosen)] ? String(chosen) : null;
        const groupId = `criterion-${criterion.id}`;
        return (
          <fieldset key={criterion.id} className="rounded-2xl border border-royal/10 bg-white p-4">
            <legend className="px-1 text-lg font-extrabold text-ink">{criterion.label}</legend>
            <p className="mb-3 text-sm text-muted" id={`${groupId}-help`}>
              {criterion.lookFor}
            </p>

            <div role="radiogroup" aria-describedby={`${groupId}-help`} aria-label={`${criterion.label} score`} className="grid grid-cols-5 gap-2">
              {levels.map((level) => {
                const selected = chosen === level;
                return (
                  <label
                    key={level}
                    className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border text-lg font-extrabold transition-colors focus-within:ring-4 focus-within:ring-royal/20 ${
                      selected ? "border-royal bg-royal text-white" : "border-royal/20 bg-white text-ink hover:border-royal"
                    }`}
                  >
                    <input
                      type="radio"
                      name={groupId}
                      value={level}
                      checked={selected}
                      onChange={() => setScores((current) => ({ ...current, [criterion.id]: level }))}
                      className="sr-only"
                      data-testid={`score-${criterion.id}-${level}`}
                    />
                    {level}
                  </label>
                );
              })}
            </div>

            <p className="mt-3 min-h-10 text-sm text-ink" aria-live="polite">
              {chosen === undefined
                ? `Pick 1 to ${rubric.scaleMax}. A ${rubric.scaleMin}, a ${midLevel} and a ${rubric.scaleMax} are described below.`
                : anchorKey
                  ? criterion.anchors[anchorKey]
                  : `Between the descriptions for ${chosen - 1} and ${chosen + 1}.`}
            </p>

            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-bold text-royal">
                {comments[criterion.id]?.trim() ? "Edit comment" : "Add a comment (optional)"}
              </summary>
              <label htmlFor={`${groupId}-comment`} className="sr-only">
                Comment on {criterion.label}
              </label>
              <textarea
                id={`${groupId}-comment`}
                rows={2}
                maxLength={500}
                value={comments[criterion.id] ?? ""}
                onChange={(event) => setComments((current) => ({ ...current, [criterion.id]: event.currentTarget.value }))}
                className="mt-2 w-full rounded-xl border border-royal/20 px-3 py-2 text-base"
              />
            </details>
          </fieldset>
        );
      })}

      <div className="rounded-2xl border border-royal/10 bg-white p-4">
        <label htmlFor="mark-feedback" className="text-lg font-extrabold text-ink">
          One thing to say to your child (optional)
        </label>
        <textarea
          id="mark-feedback"
          rows={3}
          maxLength={2000}
          value={feedback}
          onChange={(event) => setFeedback(event.currentTarget.value)}
          className="mt-2 w-full rounded-xl border border-royal/20 px-3 py-2 text-base"
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-royal/10 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-lg font-extrabold tabular-nums text-ink" data-testid="mark-total" aria-live="polite">
            {total} / {max}
          </p>
          {state === "error" ? (
            <p role="alert" className="text-sm font-semibold text-red-700">
              Couldn&apos;t save. Please try again.
            </p>
          ) : null}
          <button
            type="submit"
            data-testid="mark-save"
            disabled={!complete || state === "saving"}
            className={buttonClasses({ variant: "primary" })}
          >
            {complete ? (state === "saving" ? "Saving…" : "Save marks") : `Score all ${rubric.criteria.length} to save`}
          </button>
        </div>
      </div>
    </form>
  );
}
