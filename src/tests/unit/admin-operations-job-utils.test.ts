import { describe, expect, it } from "vitest";

import {
  deadLetterJobs,
  filterJobs,
  formatJobTimestamp,
  isRetryable,
  type BackgroundJob,
} from "@/features/admin-analytics";

const JOBS: BackgroundJob[] = [
  {
    id: "job_1",
    type: "pdf_export",
    status: "succeeded",
    createdAt: "2026-07-28T02:10:00Z",
    startedAt: "2026-07-28T02:10:04Z",
    completedAt: "2026-07-28T02:10:22Z",
    attempts: 1,
    lastError: null,
  },
  {
    id: "job_2",
    type: "email_digest",
    status: "failed",
    createdAt: "2026-07-28T05:00:00Z",
    startedAt: "2026-07-28T05:00:01Z",
    completedAt: "2026-07-28T05:00:30Z",
    attempts: 2,
    lastError: "SMTP timeout.",
  },
  {
    id: "job_3",
    type: "pdf_export",
    status: "dead_letter",
    createdAt: "2026-07-27T18:00:00Z",
    startedAt: "2026-07-27T18:00:02Z",
    completedAt: "2026-07-27T18:03:44Z",
    attempts: 5,
    lastError: "Out of memory.",
  },
  {
    id: "job_4",
    type: "billing_sync",
    status: "queued",
    createdAt: "2026-07-28T05:12:00Z",
    startedAt: null,
    completedAt: null,
    attempts: 0,
    lastError: null,
  },
];

describe("isRetryable", () => {
  it("is retryable when failed or dead-lettered", () => {
    expect(isRetryable(JOBS[1])).toBe(true);
    expect(isRetryable(JOBS[2])).toBe(true);
  });

  it("is not retryable when queued, running or succeeded", () => {
    expect(isRetryable(JOBS[0])).toBe(false);
    expect(isRetryable(JOBS[3])).toBe(false);
  });
});

describe("filterJobs", () => {
  it("returns every job when both filters are 'all'", () => {
    expect(filterJobs(JOBS, "all", "all")).toHaveLength(4);
  });

  it("filters by status alone", () => {
    const result = filterJobs(JOBS, "dead_letter", "all");
    expect(result.map((job) => job.id)).toEqual(["job_3"]);
  });

  it("filters by type alone", () => {
    const result = filterJobs(JOBS, "all", "pdf_export");
    expect(result.map((job) => job.id)).toEqual(["job_1", "job_3"]);
  });

  it("combines status and type filters", () => {
    const result = filterJobs(JOBS, "dead_letter", "pdf_export");
    expect(result.map((job) => job.id)).toEqual(["job_3"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterJobs(JOBS, "running", "all")).toEqual([]);
  });
});

describe("deadLetterJobs", () => {
  it("returns only dead-letter jobs", () => {
    expect(deadLetterJobs(JOBS).map((job) => job.id)).toEqual(["job_3"]);
  });

  it("is empty when nothing has dead-lettered", () => {
    expect(deadLetterJobs(JOBS.filter((job) => job.status !== "dead_letter"))).toEqual([]);
  });
});

describe("formatJobTimestamp", () => {
  it("formats a valid ISO timestamp", () => {
    expect(formatJobTimestamp("2026-07-28T02:10:00Z")).not.toBe("—");
  });

  it("is an em dash for null", () => {
    expect(formatJobTimestamp(null)).toBe("—");
  });

  it("is an em dash for an unparsable string", () => {
    expect(formatJobTimestamp("not-a-date")).toBe("—");
  });
});
