import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ResultsHistoryOutcome } from "@/app/results/history-fetch";

const mockFetchResultsHistory = vi.fn<() => Promise<ResultsHistoryOutcome>>();
vi.mock("@/app/results/history-fetch", () => ({
  fetchResultsHistory: (...args: unknown[]) => mockFetchResultsHistory(...args),
}));

import { ResultsHistoryPanel } from "@/app/results/ResultsHistoryPanel";

describe("ResultsHistoryPanel", () => {
  it("shows a sign-in prompt for a guest, without crashing", async () => {
    mockFetchResultsHistory.mockResolvedValue({ kind: "guest" });

    render(
      <ResultsHistoryPanel subject="numeracy" sessionId="session-1" currentScorePercent={80} />,
    );

    expect(screen.getByTestId("history-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("history-guest-state")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "Sign in to track your progress" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in/ })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.queryByTestId("history-comparison")).not.toBeInTheDocument();
  });

  it("shows a first-attempt message for a signed-in student with no prior attempts in this subject", async () => {
    mockFetchResultsHistory.mockResolvedValue({
      kind: "ready",
      stats: { subjectAttemptCount: 0, personalBestPercent: null, previousAttempt: null },
    });

    render(
      <ResultsHistoryPanel subject="reading" sessionId="session-1" currentScorePercent={70} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("history-first-attempt")).toBeInTheDocument();
    });
    expect(screen.getByTestId("history-first-attempt")).toHaveTextContent(
      "This was your first Reading attempt",
    );
    expect(screen.queryByTestId("history-guest-state")).not.toBeInTheDocument();
  });

  it("compares against the personal best and previous attempt when history exists", async () => {
    mockFetchResultsHistory.mockResolvedValue({
      kind: "ready",
      stats: {
        subjectAttemptCount: 3,
        personalBestPercent: 70,
        previousAttempt: { scorePercent: 60, submittedAt: "2026-07-18T09:00:00.000Z" },
      },
    });

    render(
      <ResultsHistoryPanel subject="numeracy" sessionId="session-1" currentScorePercent={90} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("history-comparison")).toBeInTheDocument();
    });
    expect(screen.getByTestId("history-personal-best")).toHaveTextContent("70%");
    expect(screen.getByTestId("history-delta")).toHaveTextContent("+30 points");
    // 90 beats the prior best of 70.
    expect(screen.getByTestId("history-new-best-badge")).toBeInTheDocument();
  });

  it("does not flag a new personal best when the current score falls short", async () => {
    mockFetchResultsHistory.mockResolvedValue({
      kind: "ready",
      stats: {
        subjectAttemptCount: 1,
        personalBestPercent: 95,
        previousAttempt: { scorePercent: 95, submittedAt: "2026-07-18T09:00:00.000Z" },
      },
    });

    render(
      <ResultsHistoryPanel subject="numeracy" sessionId="session-1" currentScorePercent={50} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("history-comparison")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("history-new-best-badge")).not.toBeInTheDocument();
    expect(screen.getByTestId("history-delta")).toHaveTextContent("-45 points");
  });
});
