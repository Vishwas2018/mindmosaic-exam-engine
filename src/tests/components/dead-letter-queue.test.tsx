import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeadLetterQueue } from "@/features/admin-analytics/components/DeadLetterQueue";
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
    id: "job_3",
    type: "report_generation",
    status: "dead_letter",
    createdAt: "2026-07-27T18:00:00Z",
    startedAt: "2026-07-27T18:00:02Z",
    completedAt: "2026-07-27T18:03:44Z",
    attempts: 5,
    lastError: "Aggregate view returned no rows.",
  },
];

describe("DeadLetterQueue", () => {
  it("shows an empty state when nothing has dead-lettered", () => {
    render(<DeadLetterQueue jobs={[JOBS[0]]} onRetry={vi.fn()} />);
    expect(screen.getByText("No dead-letter jobs")).toBeInTheDocument();
    expect(screen.queryByTestId("dead-letter-row")).not.toBeInTheDocument();
  });

  it("lists only dead-letter jobs with their error", () => {
    render(<DeadLetterQueue jobs={JOBS} onRetry={vi.fn()} />);
    const rows = screen.getAllByTestId("dead-letter-row");
    expect(rows).toHaveLength(1);
    expect(screen.getByText("Aggregate view returned no rows.")).toBeInTheDocument();
    expect(screen.queryByText("job_1")).not.toBeInTheDocument();
  });

  it("calls onRetry with the dead-lettered job's id", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<DeadLetterQueue jobs={JOBS} onRetry={onRetry} />);
    await user.click(screen.getByTestId("dead-letter-retry-job_3"));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith("job_3");
  });
});
