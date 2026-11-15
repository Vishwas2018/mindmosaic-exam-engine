import { summariseProgress, type RecordedOutcome } from "../lib/practice";

export function VihaanSmartRevision({
  outcomes = [],
}: {
  outcomes?: readonly RecordedOutcome[];
}) {
  const progress = summariseProgress(outcomes);
  const hasData = progress.topics.length > 0 || progress.pendingWriting > 0;

  return (
    <section className="rounded-2xl border border-mm-line bg-white p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-ink">Smart revision</h2>
        {progress.pendingWriting > 0 && (
          <span className="rounded border border-mm-line bg-mm-tint/40 px-2 py-0.5 text-[11px] font-semibold text-mm-muted">
            {progress.pendingWriting} writing task{progress.pendingWriting === 1 ? "" : "s"} pending rubric review
          </span>
        )}
      </div>
      {!hasData ? (
        <p className="text-sm text-mm-muted">
          No recorded scholarship revision data yet. Complete a practice topic or the diagnostic
          assessment to unlock targeted topic recommendations.
        </p>
      ) : (
        <div className="space-y-3">
          {progress.weakTopics.length > 0 && (
            <p className="text-xs font-semibold text-amber-800">
              Recommended revision topics: {progress.weakTopics.join(", ")}
            </p>
          )}
          {progress.topics.length > 0 && (
            <ul className="divide-y divide-mm-line">
              {progress.topics.map((topic) => (
                <li
                  key={`${topic.subject}:${topic.topic}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-semibold text-ink">{topic.topic}</span>
                    <span className="ml-2 text-xs text-mm-muted">
                      ({topic.subject.replace(/_/g, " ")})
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-ink">
                    {topic.accuracyPercent}% ({topic.attempted} attempted)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
