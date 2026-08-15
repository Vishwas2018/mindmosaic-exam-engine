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
const mockSessionMaybeSingle = vi.fn();
const mockAttemptMaybeSingle = vi.fn();
const mockAutosaveMaybeSingle = vi.fn();
/** The target model's answer to "is there a resumable session for this student". */
const mockTargetSessions = vi.fn();

/**
 * The route dispatches across both storage models now (§12.7 step 7), so this
 * mock answers for both. `mockTargetSessions` defaults to an empty list, which
 * is the shipped state — the cohort is empty, so every session in production is
 * a legacy one and every assertion below is still about the legacy path
 * behaving exactly as it did.
 *
 * The chain shapes differ per table on purpose: a mock that accepted any chain
 * would pass whatever queries the dispatcher issued, including wrong ones.
 */
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "assessment_sessions") {
        return {
          select: () => ({
            eq: () => ({
              gt: () => ({
                order: () => ({ limit: mockTargetSessions }),
              }),
            }),
          }),
        };
      }
      if (table === "exam_sessions") {
        return {
          select: () => ({
            eq: () => ({
              gt: () => ({
                order: () => ({
                  limit: () => mockSessionListResult(),
                }),
              }),
              eq: () => ({ maybeSingle: mockSessionMaybeSingle }),
            }),
          }),
        };
      }
      if (table === "exam_attempts") {
        return { select: () => ({ eq: () => ({ maybeSingle: mockAttemptMaybeSingle }) }) };
      }
      if (table === "exam_responses") {
        return { select: () => ({ eq: () => ({ maybeSingle: mockAutosaveMaybeSingle }) }) };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  })),
}));

/**
 * The resume lookup now lists candidate sessions and then reads the winner by
 * id, where it used to do both in one query. `mockSessionMaybeSingle` still
 * holds the session row, so this derives the list from it and every existing
 * assertion keeps working off the same fixture.
 */
async function mockSessionListResult(): Promise<{ data: unknown }> {
  const single = (await mockSessionMaybeSingle()) as { data: unknown };
  return { data: single.data === null ? [] : [single.data] };
}

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
    mockSessionMaybeSingle.mockReset();
    mockAttemptMaybeSingle.mockReset();
    mockAutosaveMaybeSingle.mockReset();

    mockTargetSessions.mockReset();
    mockTargetSessions.mockResolvedValue({ data: [] });

    mockGetUser.mockResolvedValue({ data: { user: { id: "student-1" } } });
    mockSessionMaybeSingle.mockResolvedValue({ data: SESSION_ROW });
    mockAttemptMaybeSingle.mockResolvedValue({ data: null });
    mockAutosaveMaybeSingle.mockResolvedValue({ data: null });
  });

  it("rejects an unauthenticated caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
  });

  it("404s when there is no unexpired, unsubmitted session", async () => {
    mockSessionMaybeSingle.mockResolvedValue({ data: null });

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "no_active_session" });
  });

  it("404s when the most recent session already has a recorded attempt", async () => {
    mockAttemptMaybeSingle.mockResolvedValue({ data: { id: "attempt-1" } });

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
});
