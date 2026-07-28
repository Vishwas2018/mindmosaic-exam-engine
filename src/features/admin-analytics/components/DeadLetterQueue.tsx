"use client";

import { AlertOctagon, RotateCw } from "lucide-react";

import { Button, EmptyState } from "@/components/ui";
import { JOB_TYPE_LABELS, deadLetterJobs, formatJobTimestamp } from "../job-utils";
import type { BackgroundJob } from "../types";

/**
 * Dead-letter view: jobs that exhausted their retries and need a human
 * decision. Filtered from the same job list the main table uses, so the two
 * never drift out of sync with a second data source.
 */
export function DeadLetterQueue({
  jobs,
  onRetry,
}: {
  jobs: readonly BackgroundJob[];
  onRetry: (jobId: string) => void;
}) {
  const rows = deadLetterJobs(jobs);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No dead-letter jobs"
        description="Jobs land here once they exhaust their retries. Nothing needs attention right now."
        icon={<AlertOctagon aria-hidden="true" className="h-6 w-6" />}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((job) => (
        <li
          key={job.id}
          data-testid="dead-letter-row"
          className="rounded-2xl border border-error/15 bg-error/5 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-muted">{job.id}</p>
              <p className="mt-0.5 font-bold text-ink">{JOB_TYPE_LABELS[job.type]}</p>
              <p className="mt-1 text-xs text-muted">
                {job.attempts} attempts · failed {formatJobTimestamp(job.completedAt)}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onRetry(job.id)}
              data-testid={`dead-letter-retry-${job.id}`}
            >
              <RotateCw aria-hidden="true" className="h-4 w-4" />
              Retry
            </Button>
          </div>
          {job.lastError && (
            <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm leading-6 text-ink">
              {job.lastError}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
