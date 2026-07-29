"use client";

import { useMemo, useState } from "react";
import { Eye, RotateCw } from "lucide-react";
import { clsx } from "clsx";

import { Badge, Button, Modal, Select } from "@/components/ui";
import {
  JOB_STATUS_BADGE_VARIANT,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  filterJobs,
  formatJobTimestamp,
  isRetryable,
} from "../job-utils";
import type { BackgroundJob, JobStatus, JobType } from "../types";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge variant={JOB_STATUS_BADGE_VARIANT[status]}>
      {JOB_STATUS_LABELS[status]}
    </Badge>
  );
}

const headCell =
  "px-4 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wider text-muted";
const bodyCell = "border-t border-royal/8 px-4 py-3 text-sm";

/**
 * Background jobs table with status/type filters and a detail modal
 * (mock/prop-driven — see mock-operations-data.ts). Retrying a job never
 * calls a backend directly; it always goes through the injected `onRetry`.
 */
export function BackgroundJobsTable({
  jobs,
  onRetry,
}: {
  jobs: readonly BackgroundJob[];
  onRetry: (jobId: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<JobType | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(
    () => filterJobs(jobs, statusFilter, typeFilter),
    [jobs, statusFilter, typeFilter],
  );

  const open = openId ? (jobs.find((job) => job.id === openId) ?? null) : null;

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Select
          id="jobs-status-filter"
          label="Status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.currentTarget.value as JobStatus | "all")
          }
        >
          <option value="all">All statuses</option>
          {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          id="jobs-type-filter"
          label="Job type"
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.currentTarget.value as JobType | "all")
          }
        >
          <option value="all">All types</option>
          {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-royal/15 bg-white">
        <table className="w-full border-collapse">
          <caption className="sr-only">Background jobs</caption>
          <thead>
            <tr>
              <th scope="col" className={headCell}>
                Job
              </th>
              <th scope="col" className={headCell}>
                Type
              </th>
              <th scope="col" className={headCell}>
                Status
              </th>
              <th scope="col" className={headCell}>
                Created
              </th>
              <th scope="col" className={headCell}>
                Completed
              </th>
              <th scope="col" className={headCell}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((job) => (
              <tr key={job.id} className="hover:bg-royal/3" data-testid="job-row">
                <td className={clsx(bodyCell, "font-mono text-xs text-muted")}>
                  {job.id}
                </td>
                <td className={bodyCell}>{JOB_TYPE_LABELS[job.type]}</td>
                <td className={bodyCell}>
                  <JobStatusBadge status={job.status} />
                </td>
                <td className={clsx(bodyCell, "tabular-nums text-muted")}>
                  {formatJobTimestamp(job.createdAt)}
                </td>
                <td className={clsx(bodyCell, "tabular-nums text-muted")}>
                  {formatJobTimestamp(job.completedAt)}
                </td>
                <td className={bodyCell}>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setOpenId(job.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-royal transition hover:bg-royal/8"
                    >
                      <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                      View
                    </button>
                    {isRetryable(job) && (
                      <button
                        type="button"
                        onClick={() => onRetry(job.id)}
                        data-testid={`retry-${job.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-royal transition hover:bg-royal/8"
                      >
                        <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
                        Retry
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td className={clsx(bodyCell, "text-muted")} colSpan={6}>
                  No jobs match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open !== null}
        onClose={() => setOpenId(null)}
        title={open ? open.id : "Job detail"}
        description={open ? JOB_TYPE_LABELS[open.type] : undefined}
      >
        {open && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Status", JOB_STATUS_LABELS[open.status]],
                ["Attempts", String(open.attempts)],
                ["Created", formatJobTimestamp(open.createdAt)],
                ["Started", formatJobTimestamp(open.startedAt)],
                ["Completed", formatJobTimestamp(open.completedAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-royal/10 bg-page px-3 py-2.5"
                >
                  <dt className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            {open.lastError && (
              <div className="rounded-xl border border-error/15 bg-error/5 p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-error">
                  Last error
                </p>
                <p className="mt-1 text-sm leading-6 text-ink">{open.lastError}</p>
              </div>
            )}
            {isRetryable(open) && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onRetry(open.id);
                  setOpenId(null);
                }}
              >
                <RotateCw aria-hidden="true" className="h-4 w-4" />
                Retry job
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
