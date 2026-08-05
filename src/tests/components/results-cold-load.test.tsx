import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchAttemptHistory = vi.fn();
vi.mock("@/app/results/history-fetch", () => ({
  fetchAttemptHistory: () => mockFetchAttemptHistory(),
}));

import { ResultsColdLoad } from "@/app/results/ResultsColdLoad";
import type { AttemptSummary } from "@/features/student/attempt-summary";

/**
 * Defect 3: /results reads the in-memory exam store, so a refresh — or the
 * Results nav item at any other moment — rendered "No results to show yet"
 * for a student whose dashboard was listing five finished sessions. The nav
 * item was a dead end after every refresh.
 *
 * The cold-load path now asks the server for the same history the dashboard
 * uses. Guests, and students with genuinely nothing finished, keep the
 * original empty state — they have no server-side attempts by design.
 */

function attempt(overrides: Partial<AttemptSummary> = {}): AttemptSummary {
  return {
    id: "attempt-1",
    submittedAt: "2026-08-03T12:09:42.683Z",
    title: "NAPLAN-style Numeracy",
    subjectLabel: "Numeracy",
    timing: "timed",
    totalQuestions: 10,
    scorePercent: 70,
    attemptedQuestions: 10,
    pendingManualReview: false,
    ...overrides,
  };
}

describe("ResultsColdLoad", () => {
  beforeEach(() => {
    mockFetchAttemptHistory.mockReset();
  });

  it("shows a signed-in student's finished sessions instead of the empty state", async () => {
    mockFetchAttemptHistory.mockResolvedValue({
      kind: "ready",
      attempts: [
        attempt({ id: "a", scorePercent: 70 }),
        attempt({ id: "b", scorePercent: 40, title: "ICAS-style Reading" }),
      ],
    });

    render(<ResultsColdLoad />);

    expect(
      await screen.findByRole("heading", { name: /finished sessions/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("attempt-history-row")).toHaveLength(2);
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("ICAS-style Reading")).toBeInTheDocument();
    expect(screen.queryByText(/no results to show yet/i)).not.toBeInTheDocument();
  });

  it("keeps the original empty state for a guest", async () => {
    mockFetchAttemptHistory.mockResolvedValue({ kind: "guest" });

    render(<ResultsColdLoad />);

    expect(await screen.findByText(/no results to show yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /set up an exam/i })).toHaveAttribute(
      "href",
      "/practice",
    );
    expect(screen.queryByTestId("attempt-history-row")).not.toBeInTheDocument();
  });

  it("keeps the original empty state for a signed-in student with no history", async () => {
    mockFetchAttemptHistory.mockResolvedValue({ kind: "ready", attempts: [] });

    render(<ResultsColdLoad />);

    expect(await screen.findByText(/no results to show yet/i)).toBeInTheDocument();
  });

  /*
   * A blank sitting must not read "0%" here either — same reason as the
   * dashboard fix in the previous commit. Showing a score for a paper
   * nobody answered is what made the aggregates look broken.
   */
  it("labels a sitting submitted without answers rather than scoring it", async () => {
    mockFetchAttemptHistory.mockResolvedValue({
      kind: "ready",
      attempts: [attempt({ scorePercent: 0, attemptedQuestions: 0 })],
    });

    render(<ResultsColdLoad />);

    expect(await screen.findByText(/no answers/i)).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("falls back to the empty state when the history read fails", async () => {
    mockFetchAttemptHistory.mockRejectedValue(new Error("network"));

    render(<ResultsColdLoad />);

    expect(await screen.findByText(/no results to show yet/i)).toBeInTheDocument();
  });
});
