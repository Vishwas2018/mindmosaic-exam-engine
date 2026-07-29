import type { BackgroundJob } from "./types";

/**
 * Deterministic sample rows for the operations screen — there is no live
 * job-queue backend yet (see the type doc in ./types.ts). Swap this for a
 * real loader once one exists; every consumer already takes jobs as a prop.
 */
export function getMockBackgroundJobs(): BackgroundJob[] {
  return [
    {
      id: "job_7f3a1c",
      type: "pdf_export",
      status: "succeeded",
      createdAt: "2026-07-28T02:10:00Z",
      startedAt: "2026-07-28T02:10:04Z",
      completedAt: "2026-07-28T02:10:22Z",
      attempts: 1,
      lastError: null,
    },
    {
      id: "job_9b2e44",
      type: "email_digest",
      status: "running",
      createdAt: "2026-07-28T05:00:00Z",
      startedAt: "2026-07-28T05:00:01Z",
      completedAt: null,
      attempts: 1,
      lastError: null,
    },
    {
      id: "job_1c88af",
      type: "content_reindex",
      status: "queued",
      createdAt: "2026-07-28T05:12:00Z",
      startedAt: null,
      completedAt: null,
      attempts: 0,
      lastError: null,
    },
    {
      id: "job_44d0e9",
      type: "billing_sync",
      status: "failed",
      createdAt: "2026-07-27T22:40:00Z",
      startedAt: "2026-07-27T22:40:05Z",
      completedAt: "2026-07-27T22:41:10Z",
      attempts: 2,
      lastError: "Stripe webhook timeout after 30s.",
    },
    {
      id: "job_ae0912",
      type: "report_generation",
      status: "dead_letter",
      createdAt: "2026-07-27T18:00:00Z",
      startedAt: "2026-07-27T18:00:02Z",
      completedAt: "2026-07-27T18:03:44Z",
      attempts: 5,
      lastError:
        "Aggregate view admin_subject_performance returned no rows for the requested week.",
    },
    {
      id: "job_bb771a",
      type: "pdf_export",
      status: "dead_letter",
      createdAt: "2026-07-27T14:20:00Z",
      startedAt: "2026-07-27T14:20:03Z",
      completedAt: "2026-07-27T14:22:18Z",
      attempts: 3,
      lastError: "Rendering worker ran out of memory on a 40-page exam.",
    },
    {
      id: "job_02fbe5",
      type: "content_reindex",
      status: "succeeded",
      createdAt: "2026-07-27T09:00:00Z",
      startedAt: "2026-07-27T09:00:02Z",
      completedAt: "2026-07-27T09:04:51Z",
      attempts: 1,
      lastError: null,
    },
  ];
}
