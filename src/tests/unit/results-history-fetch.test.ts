import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockLimit = vi.fn();
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        order: () => ({
          limit: mockLimit,
        }),
      }),
    }),
  })),
}));

import { fetchResultsHistory } from "@/app/results/history-fetch";

function attemptRow(overrides: {
  id: string;
  submitted_at: string;
  session_id: string;
  subject: string;
  objectivePercentage: number | null;
}) {
  return {
    id: overrides.id,
    submitted_at: overrides.submitted_at,
    session_id: overrides.session_id,
    result:
      overrides.objectivePercentage === null
        ? { objectiveMarksAvailable: 0, objectivePercentage: 0, pendingManualMarks: 1 }
        : {
            objectiveMarksAvailable: 10,
            objectiveMarksEarned: overrides.objectivePercentage / 10,
            objectivePercentage: overrides.objectivePercentage,
            pendingManualMarks: 0,
          },
    session: { config: { subject: overrides.subject } },
  };
}

describe("fetchResultsHistory", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockLimit.mockReset();
  });

  it("returns guest for a signed-out visitor without querying attempts", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const outcome = await fetchResultsHistory({
      subject: "numeracy",
      excludeSessionId: null,
    });

    expect(outcome).toEqual({ kind: "guest" });
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it("fails soft to empty stats when the query errors for a signed-in student", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockLimit.mockResolvedValue({ data: null, error: new Error("boom") });

    const outcome = await fetchResultsHistory({
      subject: "numeracy",
      excludeSessionId: "session-current",
    });

    expect(outcome).toEqual({
      kind: "ready",
      stats: { subjectAttemptCount: 0, personalBestPercent: null, previousAttempt: null },
    });
  });

  it("excludes the current session and scopes personal-best/previous to the matching subject", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockLimit.mockResolvedValue({
      data: [
        // Newest first, as the real query orders it.
        attemptRow({
          id: "current",
          submitted_at: "2026-07-20T09:00:00.000Z",
          session_id: "session-current",
          subject: "numeracy",
          objectivePercentage: 40,
        }),
        attemptRow({
          id: "prev-numeracy",
          submitted_at: "2026-07-18T09:00:00.000Z",
          session_id: "session-2",
          subject: "numeracy",
          objectivePercentage: 60,
        }),
        attemptRow({
          id: "best-numeracy",
          submitted_at: "2026-07-10T09:00:00.000Z",
          session_id: "session-3",
          subject: "numeracy",
          objectivePercentage: 90,
        }),
        attemptRow({
          id: "reading-attempt",
          submitted_at: "2026-07-19T09:00:00.000Z",
          session_id: "session-4",
          subject: "reading",
          objectivePercentage: 100,
        }),
      ],
      error: null,
    });

    const outcome = await fetchResultsHistory({
      subject: "numeracy",
      excludeSessionId: "session-current",
    });

    expect(outcome).toEqual({
      kind: "ready",
      stats: {
        subjectAttemptCount: 2,
        personalBestPercent: 90,
        previousAttempt: { scorePercent: 60, submittedAt: "2026-07-18T09:00:00.000Z" },
      },
    });
  });

  it("reports no prior attempts when the subject has never been practised", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockLimit.mockResolvedValue({
      data: [
        attemptRow({
          id: "reading-attempt",
          submitted_at: "2026-07-19T09:00:00.000Z",
          session_id: "session-4",
          subject: "reading",
          objectivePercentage: 100,
        }),
      ],
      error: null,
    });

    const outcome = await fetchResultsHistory({
      subject: "numeracy",
      excludeSessionId: "session-current",
    });

    expect(outcome).toEqual({
      kind: "ready",
      stats: { subjectAttemptCount: 0, personalBestPercent: null, previousAttempt: null },
    });
  });

  it("treats a pending-manual-review attempt as unscored but still countable", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockLimit.mockResolvedValue({
      data: [
        attemptRow({
          id: "unscored",
          submitted_at: "2026-07-19T09:00:00.000Z",
          session_id: "session-5",
          subject: "numeracy",
          objectivePercentage: null,
        }),
      ],
      error: null,
    });

    const outcome = await fetchResultsHistory({
      subject: "numeracy",
      excludeSessionId: "session-current",
    });

    expect(outcome).toEqual({
      kind: "ready",
      stats: {
        subjectAttemptCount: 1,
        personalBestPercent: null,
        previousAttempt: { scorePercent: null, submittedAt: "2026-07-19T09:00:00.000Z" },
      },
    });
  });
});
