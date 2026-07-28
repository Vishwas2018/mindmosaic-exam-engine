import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AdminOperationsBoard } from "@/features/admin-analytics/components/AdminOperationsBoard";
import type { BackgroundJob } from "@/features/admin-analytics";

const JOBS: BackgroundJob[] = [
  {
    id: "job_1",
    type: "pdf_export",
    status: "queued",
    createdAt: "2026-07-28T02:10:00Z",
    startedAt: null,
    completedAt: null,
    attempts: 0,
    lastError: null,
  },
  {
    id: "job_2",
    type: "report_generation",
    status: "dead_letter",
    createdAt: "2026-07-27T18:00:00Z",
    startedAt: "2026-07-27T18:00:02Z",
    completedAt: "2026-07-27T18:03:44Z",
    attempts: 5,
    lastError: "Aggregate view returned no rows.",
  },
];

describe("AdminOperationsBoard", () => {
  it("summarises jobs in the stat tiles", () => {
    render(<AdminOperationsBoard jobs={JOBS} />);
    expect(screen.getByText("Total jobs")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Dead letter (1)")).toBeInTheDocument();
  });

  it("switches between the background jobs and dead-letter tabs", async () => {
    const user = userEvent.setup();
    render(<AdminOperationsBoard jobs={JOBS} />);

    expect(screen.getAllByTestId("job-row")).toHaveLength(2);

    await user.click(screen.getByRole("tab", { name: "Dead letter (1)" }));
    expect(screen.getByTestId("dead-letter-row")).toBeInTheDocument();
  });

  it("shows the content intelligence and roadmap placeholder tabs", async () => {
    const user = userEvent.setup();
    render(<AdminOperationsBoard jobs={JOBS} />);

    await user.click(screen.getByRole("tab", { name: "Content intelligence" }));
    expect(
      screen.getByRole("link", { name: /open content intelligence/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Coming soon" }));
    expect(screen.getByText("Content quality")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Platform monitoring")).toBeInTheDocument();
  });

  it("requeues a job on retry, updates the tiles and shows a toast", async () => {
    const user = userEvent.setup();
    render(<AdminOperationsBoard jobs={JOBS} />);

    await user.click(screen.getByRole("tab", { name: "Dead letter (1)" }));
    await user.click(screen.getByTestId("dead-letter-retry-job_2"));

    const toast = await screen.findByTestId("toast");
    expect(toast).toHaveTextContent("Retry requested");
    expect(toast).toHaveTextContent("job_2");

    // The dead-letter tile drops to zero and its tab label loses the count.
    expect(screen.getByRole("tab", { name: "Dead letter" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Background jobs" }));
    const requeuedRow = screen
      .getAllByTestId("job-row")
      .find((row) => within(row).queryByText("job_2"));
    expect(requeuedRow).toBeDefined();
    expect(within(requeuedRow as HTMLElement).getByText("Queued")).toBeInTheDocument();
  });
});
