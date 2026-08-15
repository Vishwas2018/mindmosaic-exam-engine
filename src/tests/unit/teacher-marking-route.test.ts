import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockSittingMaybeSingle = vi.fn();
const mockQuestionMaybeSingle = vi.fn();
const mockAttemptMaybeSingle = vi.fn();
const mockEssayMarksUpsert = vi.fn();
const mockRpc = vi.fn();

/**
 * A PostgREST builder stub that swallows any number of chained `.eq()` calls
 * before its terminal method. The route filters `visible_sitting_questions` on
 * three columns, and a stub that only tolerated one would be asserting the shape
 * of the query rather than the behaviour of the route.
 */
function chain(terminal: { maybeSingle?: () => unknown }): unknown {
  const builder: Record<string, unknown> = {
    eq: () => builder,
    ...terminal,
  };
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
    from: (table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: mockProfileSingle }) }) };
      }
      if (table === "visible_sittings") {
        return { select: () => chain({ maybeSingle: mockSittingMaybeSingle }) };
      }
      if (table === "visible_sitting_questions") {
        return { select: () => chain({ maybeSingle: mockQuestionMaybeSingle }) };
      }
      if (table === "exam_attempts") {
        return { select: () => chain({ maybeSingle: mockAttemptMaybeSingle }) };
      }
      if (table === "essay_marks") {
        return { upsert: mockEssayMarksUpsert };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  })),
}));

import { POST } from "@/app/api/teacher/marking/route";

const SESSION_ID = "22222222-2222-4222-8222-222222222222";
const ATTEMPT_ID = "33333333-3333-4333-8333-333333333333";
const SESSION_ITEM_ID = "44444444-4444-4444-8444-444444444444";

const VALID_BODY = {
  sessionId: SESSION_ID,
  questionId: "q1",
  awardedMarks: 3,
  feedback: "Good work.",
};

const ATTEMPT_RESULT = {
  questionDetails: [{ questionId: "q1", pendingManualReview: true, availableMarks: 5 }],
};

function postRequest(
  body: unknown = VALID_BODY,
  headers: Record<string, string> = {
    "content-type": "application/json",
    origin: "http://localhost",
    host: "localhost",
  },
): Request {
  return new Request("http://localhost/api/teacher/marking", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

/** Makes the resolution view answer "this sitting is on the legacy model". */
function onLegacy(): void {
  mockSittingMaybeSingle.mockResolvedValue({
    data: { origin: "legacy", session_id: SESSION_ID, attempt_id: ATTEMPT_ID },
  });
}

/** Makes it answer "this sitting is on the target model". */
function onTarget(): void {
  mockSittingMaybeSingle.mockResolvedValue({
    data: { origin: "version_pinned", session_id: SESSION_ID, attempt_id: null },
  });
}

describe("POST /api/teacher/marking — guard sweep", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockProfileSingle.mockReset();
    mockSittingMaybeSingle.mockReset();
    mockQuestionMaybeSingle.mockReset();
    mockAttemptMaybeSingle.mockReset();
    mockEssayMarksUpsert.mockReset();
    mockRpc.mockReset();

    mockGetUser.mockResolvedValue({ data: { user: { id: "teacher-1" } } });
    mockProfileSingle.mockResolvedValue({ data: { role: "teacher" } });
    onLegacy();
    mockAttemptMaybeSingle.mockResolvedValue({ data: { id: ATTEMPT_ID, result: ATTEMPT_RESULT } });
    mockEssayMarksUpsert.mockResolvedValue({ error: null });
    mockQuestionMaybeSingle.mockResolvedValue({
      data: { session_item_id: SESSION_ITEM_ID, available_marks: 5 },
    });
    mockRpc.mockResolvedValue({ data: { maxMarks: 5 }, error: null });
  });

  it("rejects an unauthenticated caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
  });

  it("rejects a non-teacher caller", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "parent" } });

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "teachers_only" });
  });

  it("rejects a cross-site Origin — MM-SEC-03", async () => {
    const response = await POST(
      postRequest(VALID_BODY, {
        "content-type": "application/json",
        origin: "https://evil.example",
        host: "localhost",
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "origin_mismatch" });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const response = await POST(postRequest({ sessionId: "not-a-uuid" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("404s a sitting outside the teacher's own class roster (the view comes back empty)", async () => {
    mockSittingMaybeSingle.mockResolvedValue({ data: null });

    const response = await POST(postRequest());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "sitting_not_found" });
    expect(mockEssayMarksUpsert).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  describe("legacy sittings keep the write path they had", () => {
    beforeEach(onLegacy);

    it("rejects awarded marks above the question's available ceiling", async () => {
      const response = await POST(postRequest({ ...VALID_BODY, awardedMarks: 99 }));

      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({ error: "awarded_marks_exceed_available" });
      expect(mockEssayMarksUpsert).not.toHaveBeenCalled();
    });

    it("records the mark against essay_marks and never through the target RPC", async () => {
      const response = await POST(postRequest());

      expect(response.status).toBe(200);
      expect(mockEssayMarksUpsert).toHaveBeenCalledTimes(1);
      /* The invariant this step is under: the legacy write path is untouched.
         A legacy sitting must not start flowing through the new function. */
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("404s a legacy sitting that has not been submitted", async () => {
      mockSittingMaybeSingle.mockResolvedValue({
        data: { origin: "legacy", session_id: SESSION_ID, attempt_id: null },
      });

      const response = await POST(postRequest());

      expect(response.status).toBe(404);
      expect(mockEssayMarksUpsert).not.toHaveBeenCalled();
    });
  });

  describe("target sittings go through the definer function", () => {
    beforeEach(onTarget);

    it("records the mark through record_manual_mark and never through essay_marks", async () => {
      const response = await POST(postRequest());

      expect(response.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith("record_manual_mark", {
        p_session_id: SESSION_ID,
        p_session_item_id: SESSION_ITEM_ID,
        p_awarded_marks: 3,
        p_feedback: "Good work.",
      });
      expect(mockEssayMarksUpsert).not.toHaveBeenCalled();
    });

    it("sends no ceiling, no marker and no student — the function derives all three", async () => {
      await POST(postRequest());

      const [, args] = mockRpc.mock.calls[0]!;
      expect(Object.keys(args as object).sort()).toEqual([
        "p_awarded_marks",
        "p_feedback",
        "p_session_id",
        "p_session_item_id",
      ]);
    });

    it("422s a question the scorer did not flag for review", async () => {
      mockQuestionMaybeSingle.mockResolvedValue({ data: null });

      const response = await POST(postRequest());

      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({ error: "not_a_manual_review_question" });
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("maps the function's refusals to 404 and 422, never to 500", async () => {
      const cases: [string, number, string][] = [
        ["MM217", 404, "sitting_not_found"],
        ["MM218", 422, "not_a_manual_review_question"],
        ["MM219", 422, "awarded_marks_exceed_available"],
      ];

      for (const [code, status, error] of cases) {
        mockRpc.mockResolvedValue({ data: null, error: { code } });
        const response = await POST(postRequest());
        expect(response.status, code).toBe(status);
        expect(await response.json()).toEqual({ error });
      }
    });
  });
});
