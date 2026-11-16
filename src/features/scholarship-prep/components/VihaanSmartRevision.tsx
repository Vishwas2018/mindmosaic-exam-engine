"use client";

import { RotateCcw } from "lucide-react";

import { summariseProgress, type RecordedOutcome } from "../lib/practice";

export function VihaanSmartRevision({
  outcomes = [],
  onReviseTopic,
}: {
  outcomes?: readonly RecordedOutcome[];
  onReviseTopic?: (topic: { readonly subject: string; readonly topic: string }) => void;
}) {
  const progress = summariseProgress(outcomes);
  const hasData = progress.topics.length > 0 || progress.pendingWriting > 0;
  const focusTopics = progress.topics
    .filter((t) => t.accuracyPercent < 70)
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent);

  return (
    <section
      data-testid="vihaan-smart-revision"
      className="rounded-2xl border border-mm-line bg-white p-6 space-y-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink">Smart weak-topic revision</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {progress.pendingWriting > 0 && (
            <span className="rounded border border-mm-line bg-mm-tint/40 px-2 py-0.5 text-[11px] font-semibold text-mm-muted">
              {progress.pendingWriting} writing task{progress.pendingWriting === 1 ? "" : "s"} pending rubric review
            </span>
          )}
          {onReviseTopic && focusTopics.length > 0 && (
            <button
              type="button"
              data-testid="vihaan-start-weak-revision"
              onClick={() => onReviseTopic({ subject: focusTopics[0]!.subject, topic: focusTopics[0]!.topic })}
              className="rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
            >
              Revise weak topics
            </button>
          )}
        </div>
      </div>

      {!hasData ? (
        <p className="text-sm text-mm-muted">
          No recorded scholarship revision data yet. Complete adaptive practice or the diagnostic
          assessment to unlock targeted topic recommendations.
        </p>
      ) : (
        <div className="space-y-3">
          {progress.weakTopics.length > 0 ? (
            <p className="text-xs font-semibold text-amber-800">
              Confirmed weak topics (&lt;70% across 5+ distinct items): {progress.weakTopics.join(", ")}
            </p>
          ) : focusTopics.length > 0 ? (
            <p className="text-xs font-semibold text-amber-800">
              Early revision focus (&lt;70% accuracy): {focusTopics.map((t) => t.topic).join(", ")}
            </p>
          ) : (
            <p className="text-xs font-semibold text-emerald-700">
              All attempted topics are currently at or above 70% accuracy. Practise any topic below to reinforce mastery.
            </p>
          )}

          {progress.topics.length > 0 && (
            <ul className="divide-y divide-mm-line">
              {progress.topics
                .slice()
                .sort((a, b) => a.accuracyPercent - b.accuracyPercent)
                .map((topic) => (
                  <li
                    key={`${topic.subject}:${topic.topic}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <div>
                      <span className="font-semibold text-ink">{topic.topic}</span>
                      <span className="ml-2 text-xs text-mm-muted">
                        ({topic.subject.replace(/_/g, " ")})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold ${
                          topic.accuracyPercent < 70 ? "text-amber-800" : "text-ink"
                        }`}
                      >
                        {topic.accuracyPercent}% ({topic.attempted} attempted)
                      </span>
                      {onReviseTopic && (
                        <button
                          type="button"
                          data-testid={`revise-topic-${topic.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          onClick={() =>
                            onReviseTopic({ subject: topic.subject, topic: topic.topic })
                          }
                          className="rounded-btn border border-mm-line bg-mm-page/60 px-2.5 py-1 text-[11px] font-semibold text-ink hover:border-primary/40 hover:bg-mm-tint"
                        >
                          Revise
                        </button>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
