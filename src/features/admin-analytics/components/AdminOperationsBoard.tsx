"use client";

import { useState } from "react";

import { ToastProvider, useToast } from "@/components/ui";
import { deadLetterJobs } from "../job-utils";
import type { BackgroundJob } from "../types";
import { BackgroundJobsTable } from "./BackgroundJobsTable";
import { ContentIntelligencePlaceholder } from "./ContentIntelligencePlaceholder";
import { DeadLetterQueue } from "./DeadLetterQueue";
import { RoadmapStubs } from "./RoadmapStubs";
import { StatCard } from "./StatCard";
import { TabbedSections } from "./TabbedSections";

function OperationsContent({
  initialJobs,
}: {
  initialJobs: readonly BackgroundJob[];
}) {
  const [jobs, setJobs] = useState<BackgroundJob[]>(() => [...initialJobs]);
  const { showToast } = useToast();

  /*
   * No real job-queue backend exists yet, so "retry" only requeues the job
   * in local mock state — this is the injected `onRetry` every child table
   * calls into. Swapping in a real mutation later only means changing this
   * function's body.
   */
  function handleRetry(jobId: string) {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;
    setJobs((current) =>
      current.map((item) =>
        item.id === jobId
          ? { ...item, status: "queued", attempts: item.attempts + 1, lastError: null }
          : item,
      ),
    );
    showToast({
      variant: "success",
      title: "Retry requested",
      description: `${jobId} has been requeued.`,
    });
  }

  const running = jobs.filter((job) => job.status === "running").length;
  const queued = jobs.filter((job) => job.status === "queued").length;
  const deadLetterCount = deadLetterJobs(jobs).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total jobs" value={String(jobs.length)} />
        <StatCard label="Queued" value={String(queued)} />
        <StatCard label="Running" value={String(running)} />
        <StatCard
          label="Dead letter"
          value={String(deadLetterCount)}
          detail="Needs attention"
        />
      </div>

      <TabbedSections
        sections={[
          {
            id: "jobs",
            label: "Background jobs",
            content: <BackgroundJobsTable jobs={jobs} onRetry={handleRetry} />,
          },
          {
            id: "dead-letter",
            label:
              deadLetterCount > 0 ? `Dead letter (${deadLetterCount})` : "Dead letter",
            content: <DeadLetterQueue jobs={jobs} onRetry={handleRetry} />,
          },
          {
            id: "intelligence",
            label: "Content intelligence",
            content: <ContentIntelligencePlaceholder />,
          },
          {
            id: "roadmap",
            label: "Coming soon",
            content: <RoadmapStubs />,
          },
        ]}
      />
    </div>
  );
}

/**
 * Owns the mock job-queue state for the operations screen (screen 23) and
 * provides its own ToastProvider — the root layout doesn't wrap the app in
 * one yet, and this lane only touches src/app/admin and
 * src/features/admin-analytics.
 */
export function AdminOperationsBoard({ jobs }: { jobs: readonly BackgroundJob[] }) {
  return (
    <ToastProvider>
      <OperationsContent initialJobs={jobs} />
    </ToastProvider>
  );
}
