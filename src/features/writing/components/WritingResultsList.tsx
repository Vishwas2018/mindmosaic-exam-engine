import Link from "next/link";

import type { WritingAttemptDto, WritingMarkDto } from "../contracts";
import { resolveWritingRubric } from "../task";

export interface ResultsItem {
  attempt: WritingAttemptDto;
  mark: WritingMarkDto | null;
}

interface Props {
  /** Newest first, as loaded. Grouped here by task. */
  items: ResultsItem[];
  taskTitles: Record<string, string>;
  /** Parent view: link unmarked work to the marking screen. */
  markHref?: (attemptId: string) => string;
  emptyText: string;
}

const MODE_LABEL = { timed: "Timed, on screen", untimed: "Untimed, on screen", paper: "On paper" } as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * A simple list per writing task: each attempt's date, how it was sat, the
 * total and the score on every criterion, oldest to newest within the task so a
 * reader can see movement over time. Writing results are shown here only; they
 * never enter the numeracy or reading summaries.
 */
export function WritingResultsList({ items, taskTitles, markHref, emptyText }: Props) {
  const byTask = new Map<string, ResultsItem[]>();
  for (const item of items) {
    const list = byTask.get(item.attempt.taskId) ?? [];
    list.push(item);
    byTask.set(item.attempt.taskId, list);
  }

  if (byTask.size === 0) {
    return <p className="rounded-2xl border border-dashed border-royal/20 p-5 text-muted">{emptyText}</p>;
  }

  return (
    <div className="space-y-6">
      {[...byTask.entries()].map(([taskId, list]) => {
        const chronological = [...list].sort((a, b) => a.attempt.startedAt.localeCompare(b.attempt.startedAt));
        return (
          <section key={taskId} aria-labelledby={`task-${taskId}`} className="rounded-2xl border border-royal/10 bg-white p-5">
            <h3 id={`task-${taskId}`} className="text-lg font-extrabold text-ink">
              {taskTitles[taskId] ?? "Writing task"}
            </h3>
            <ol className="mt-3 divide-y divide-royal/10">
              {chronological.map(({ attempt, mark }) => {
                const rubric = mark ? resolveWritingRubric(mark.rubricId, mark.rubricVersion) : null;
                const labelFor = (id: string) => rubric?.criteria.find((criterion) => criterion.id === id)?.label ?? id;
                return (
                  <li key={attempt.id} className="py-3" data-testid="writing-result">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-ink">
                        {formatDate(attempt.startedAt)} · {MODE_LABEL[attempt.mode]}
                        {attempt.submissionReason === "timer_expired" ? " · handed in when time ran out" : ""}
                      </p>
                      {mark ? (
                        <p className="text-lg font-extrabold tabular-nums text-ink" data-testid="writing-result-total">
                          {mark.awardedMarks} / {mark.maxMarks}
                        </p>
                      ) : attempt.submittedAt ? (
                        <p className="text-sm font-semibold text-muted">Waiting for a parent to mark it</p>
                      ) : (
                        <p className="text-sm font-semibold text-muted">In progress</p>
                      )}
                    </div>

                    {mark ? (
                      <>
                        <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                          {mark.criteria.map((criterion) => (
                            <div key={criterion.criterionId} className="flex justify-between gap-2">
                              <dt className="text-muted">{labelFor(criterion.criterionId)}</dt>
                              <dd className="font-bold tabular-nums text-ink">{criterion.score}</dd>
                            </div>
                          ))}
                        </dl>
                        {mark.feedback ? <p className="mt-2 text-sm text-ink">&ldquo;{mark.feedback}&rdquo;</p> : null}
                      </>
                    ) : null}

                    {markHref && attempt.submittedAt ? (
                      <Link
                        href={markHref(attempt.id)}
                        className="mt-2 inline-block text-sm font-bold text-royal underline-offset-4 hover:underline"
                      >
                        {mark ? "Change marks" : "Mark this response"}
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
