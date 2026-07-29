import type { BadgeVariant } from "@/components/ui";

import type { BackgroundJob, JobStatus, JobType } from "./types";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
  dead_letter: "Dead letter",
};

export const JOB_STATUS_BADGE_VARIANT: Record<JobStatus, BadgeVariant> = {
  queued: "neutral",
  running: "purple",
  succeeded: "success",
  failed: "warning",
  dead_letter: "error",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  pdf_export: "PDF export",
  email_digest: "Email digest",
  content_reindex: "Content reindex",
  billing_sync: "Billing sync",
  report_generation: "Report generation",
};

/** A job can be requeued once it has failed outright or landed in the dead-letter queue. */
export function isRetryable(job: BackgroundJob): boolean {
  return job.status === "failed" || job.status === "dead_letter";
}

export function filterJobs(
  jobs: readonly BackgroundJob[],
  statusFilter: JobStatus | "all",
  typeFilter: JobType | "all",
): BackgroundJob[] {
  return jobs.filter(
    (job) =>
      (statusFilter === "all" || job.status === statusFilter) &&
      (typeFilter === "all" || job.type === typeFilter),
  );
}

/** Jobs that exhausted their retries and need a human decision. */
export function deadLetterJobs(jobs: readonly BackgroundJob[]): BackgroundJob[] {
  return jobs.filter((job) => job.status === "dead_letter");
}

export function formatJobTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
