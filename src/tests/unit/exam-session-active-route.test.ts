import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

vi.mock("@/server/exam-bank", () => ({
  getExamBank: vi.fn(() => [
    {
      id: "q1",
      answerKey: { kind: "exact", value: "1" },
      explanation: "",
    },
  ]),
}));

const mockGetUser = vi.fn();
const mockOpenSittings = vi.fn();
const mockSessionMaybeSingle = vi.fn();
const mockAutosaveMaybeSingle = vi.fn();

/**
 * Resume asks ONE view for "my most recent unexpired, unsubmitted sitting"
 * (§12.7 step 8) and then reads the winner from the model that created it. So
 * the mock answers for `visible_sittings` and for the legacy tables the read
 * itself uses — and rejects anything else, because a resume that started
 * probing models again would be the resolution rule forked in half.
 */
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "visible_sittings") {
        return {
          select: () => ({
            eq: () => ({
              gt: () => ({
                is: () => ({ order: () => ({ limit: mockOpenSittings }) }),
              }),
            }),
          }),
        };
      }
      if (table === "exam_sessions") {
        return {
          select: () => ({
            eq: () => ({ eq: () => ({ maybeSingle: mockSessionMaybeSingle }) }),
          }),
        };
      }
      if (table === "exam_responses") {
        return { select: () => ({ eq: () => ({ maybeSingle: mockAutosaveMaybeSingle }) }) };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  })),
}));

import { GET } from "@/app/api/exam/session/active/route";

const SESSION_ROW = {
  id: "session-1",
  config: {
    yearLevel: 5,
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: 10,
    timing: "untimed",
    bankId: "curated",
  },
  selected_question_ids: ["q1"],
  created_at: "2026-01-01T00:00:00.000Z",
  expires_at: "2099-01-01T00:00:00.000Z",
};

describe("GET /api/exam/session/active — guard sweep", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockOpenSittings.mockReset();
    mockSessionMaybeSingle.mockReset();
    mockAutosaveMaybeSingle.mockReset();

    mockGetUser.mockResolvedValue({ data: { user: { id: "student-1" } } });
    /* One open legacy sitting — the shipped state, since the cohort is empty
       and every sitting in production is a legacy one. */
    mockOpenSittings.mockResolvedValue({
      data: [{ session_id: "session-1", origin: "legacy", created_at: "2026-01-01T00:00:00.000Z" }],
    });
    mockSessionMaybeSingle.mockResolvedValue({ data: SESSION_ROW });
    mockAutosaveMaybeSingle.mockResolvedValue({ data: null });
  });

  it("rejects an unauthenticated caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
  });

  it("404s when there is no unexpired, unsubmitted sitting on either model", async () => {
    mockOpenSittings.mockResolvedValue({ data: [] });

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "no_active_session" });
  });

  it("404s when the sitting the view named has vanished under the read", async () => {
    /* The view says a sitting is open; the read of it comes back empty. That is
       a race, not a corruption, and it must read as "nothing to resume" rather
       than as a 500. */
    mockSessionMaybeSingle.mockResolvedValue({ data: null });

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "no_active_session" });
  });

  it("returns the resumable session for its own signed-in student", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sessionId).toBe("session-1");
    expect(body.responses).toEqual({});
  });

  it("asks the shared view for the open sitting, not the models", async () => {
    /* The submitted-check moved into the view: `submitted_at is null` means the
       same thing on both sides, so resume no longer probes exam_attempts to
       find out whether a legacy session is finished. */
    await GET();

    expect(mockOpenSittings).toHaveBeenCalled();
  });
});
