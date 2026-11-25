"use client";

import { Badge, Card } from "@/components/ui";
import { scholarshipWrittenExpressionRubric } from "@/features/writing/rubrics/scholarship-written-expression";
import type { ReviewEntry } from "../contracts";

export function WritingPromptPreview({ entry }: { readonly entry: ReviewEntry }) {
  const { question, writingTask, writingGuidance } = entry;
  const rubric = scholarshipWrittenExpressionRubric;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="purple">Written Expression — Human Rubric Only</Badge>
        {writingTask && (
          <>
            <Badge variant="neutral">Form: {writingTask.form}</Badge>
            <Badge variant="neutral">{writingTask.timeLimitMinutes} min</Badge>
            {writingTask.suggestedWords && (
              <Badge variant="neutral">
                Guide: {writingTask.suggestedWords.min}–
                {writingTask.suggestedWords.max} words
              </Badge>
            )}
          </>
        )}
      </div>

      <Card variant="outlined" className="border-royal/15 bg-page p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Child-facing writing task preview
        </p>
        {writingTask && (
          <h3 className="mt-1 font-[family-name:var(--font-instrument-sans)] text-lg font-bold text-ink">
            {writingTask.title}
          </h3>
        )}
        <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-ink">
          {writingTask?.prompt ?? question.prompt}
        </p>
        <p className="mt-4 text-xs text-muted">
          No single model answer exists. Approved writing prompts flow through
          MindMosaic&apos;s governed writing-prompt approval pipeline (
          <code className="font-mono">
            content/publication-approvals/writing-prompts/
          </code>
          ) using the existing 6-criterion{" "}
          <strong>{rubric.title}</strong> rubric — no new writing taxonomy is
          created.
        </p>
      </Card>

      {writingGuidance && writingGuidance.successCriteria.length > 0 && (
        <section
          aria-label="Writing task success criteria"
          className="rounded-xl border border-royal/12 bg-white p-4"
        >
          <h3 className="text-sm font-bold text-ink">
            Reviewer task success criteria ({writingGuidance.rubricId} v
            {writingGuidance.rubricVersion})
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-soft">
            {writingGuidance.successCriteria.map((criterion, index) => (
              <li key={index}>{criterion}</li>
            ))}
          </ul>
        </section>
      )}

      <details className="rounded-xl border border-royal/12 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-ink">
          Inspect existing 6-criterion human marking rubric ({rubric.title} v
          {rubric.version})
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {rubric.criteria.map((criterion) => (
            <div
              key={criterion.id}
              className="rounded-xl border border-royal/10 bg-page p-3"
            >
              <p className="font-bold text-ink">{criterion.label}</p>
              <p className="mt-1 text-xs text-muted">{criterion.lookFor}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
