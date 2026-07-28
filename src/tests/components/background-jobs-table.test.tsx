import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BackgroundJobsTable } from "@/features/admin-analytics/components/BackgroundJobsTable";
import type { BackgroundJob } from "@/features/admin-analytics";

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
];

describe("BackgroundJobsTable", () => {
  it("lists every job with no filters applied", () => {
    render(<BackgroundJobsTable jobs={JOBS} onRetry={vi.fn()} />);
    expect(screen.getAllByTestId("job-row")).toHaveLength(2);
  });

  it("filters by status", async () => {
    const user = userEvent.setup();
    render(<BackgroundJobsTable jobs={JOBS} onRetry={vi.fn()} />);
    await user.selectOptions(screen.getByLabelText("Status"), "failed");
    const rows = screen.getAllByTestId("job-row");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText("job_2")).toBeInTheDocument();
  });

  it("filters by job type", async () => {
    const user = userEvent.setup();
    render(<BackgroundJobsTable jobs={JOBS} onRetry={vi.fn()} />);
    await user.selectOptions(screen.getByLabelText("Job type"), "pdf_export");
    const rows = screen.getAllByTestId("job-row");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText("job_1")).toBeInTheDocument();
  });

  it("shows an empty message when no job matches the filters", async () => {
    const user = userEvent.setup();
    render(<BackgroundJobsTable jobs={JOBS} onRetry={vi.fn()} />);
    await user.selectOptions(screen.getByLabelText("Status"), "running");
    expect(
      screen.getByText("No jobs match the current filters."),
    ).toBeInTheDocument();
  });

  it("only shows a retry action for retryable jobs", () => {
    render(<BackgroundJobsTable jobs={JOBS} onRetry={vi.fn()} />);
    expect(screen.queryByTestId("retry-job_1")).not.toBeInTheDocument();
    expect(screen.getByTestId("retry-job_2")).toBeInTheDocument();
  });

  it("calls onRetry with the job id from the row action", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<BackgroundJobsTable jobs={JOBS} onRetry={onRetry} />);
    await user.click(screen.getByTestId("retry-job_2"));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith("job_2");
  });

  it("opens a detail modal showing the job's error and can retry from it", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<BackgroundJobsTable jobs={JOBS} onRetry={onRetry} />);
    const failedRow = screen.getAllByTestId("job-row")[1];
    await user.click(within(failedRow).getByRole("button", { name: /view/i }));

    const modal = screen.getByTestId("job-detail-modal");
    expect(within(modal).getByText("SMTP timeout.")).toBeInTheDocument();

    await user.click(within(modal).getByRole("button", { name: /retry job/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith("job_2");
  });
});
