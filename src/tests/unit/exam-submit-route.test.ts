import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * MM-SEC-02 regression coverage: the pre-check
 * (`.from("exam_attempts").select("id").eq("session_id", ...).maybeSingle()`)
 * in the submit route is only a fast path — the real guarantee is the
 * unique constraint on `exam_attempts.session_id` added by
 * `supabase/migrations/20260722100000_exam_attempts_unique_session_id.sql`.
 * Both fixtures below have the pre-check report "no existing attempt"
 * (mirroring the genuine TOCTOU race the constraint exists to close) and
 * differ only in what the subsequent insert reports, so they exercise the
 * route's own insert-error branch rather than its earlier fast-path check.
 */

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

vi.mock("@/server/exam-bank", () => ({
  getExamBank: vi.fn(() => [{ id: "q1" }]),
}));

const mockBuildExamResult = vi.fn(() => ({
  status: "completed",
  score: 1,
  maxScore: 1,
}));
vi.mock("@/features/exam-engine/scoring", () => ({
  buildExamResult: mockBuildExamResult,
}));

const SESSION_ID = "session-1";
const STUDENT_ID = "student-1";

const BASE_SESSION = {
  id: SESSION_ID,
  student_id: STUDENT_ID,
  config: {
    yearLevel: 5,
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: 10,
    timing: "untimed",
    bankId: "curated",
  },
  seed: 1,
  selected_question_ids: ["q1"],
  created_at: "2026-01-01T00:00:00.000Z",
  expires_at: "2099-01-01T00:00:00.000Z",
};

interface SupabaseMockOptions {
  readonly existingAttempt: { id: string } | null;
  readonly insertResult: { error: { code: string; message: string } | null };
}

function mockSupabaseClient({ existingAttempt, insertResult }: SupabaseMockOptions) {
  const mockInsert = vi.fn<(row: Record<string, unknown>) => Promise<SupabaseMockOptions["insertResult"]>>();
  mockInsert.mockResolvedValue(insertResult);
  const from = vi.fn((table: string) => {
    if (table === "exam_sessions") {
      return { select: () => ({ eq: () => ({ single: async () => ({ data: BASE_SESSION }) }) }) };
    }
    if (table === "exam_attempts") {
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existingAttempt }) }) }),
        insert: mockInsert,
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: STUDENT_ID } } }) },
    from,
  };
  return { client, mockInsert, from };
}

function submitRequest(body: Record<string, unknown> = { responses: { q1: "answer" } }): Request {
  return new Request(`http://localhost/api/exam/session/${SESSION_ID}/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function loadRoute(options: SupabaseMockOptions) {
  vi.resetModules();
  const { client, mockInsert, from } = mockSupabaseClient(options);
  vi.doMock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => client) }));
  const routeModule = await import("@/app/api/exam/session/[id]/submit/route");
  return { POST: routeModule.POST, mockInsert, from };
}

describe("POST /api/exam/session/[id]/submit — MM-SEC-02 idempotent submission", () => {
  beforeEach(() => {
    mockBuildExamResult.mockClear();
  });

  afterEach(() => {
    vi.doUnmock("@/lib/supabase/server");
  });

  it("stores exactly one attempt and returns the result on the happy path", async () => {
    const { POST, mockInsert } = await loadRoute({
      existingAttempt: null,
      insertResult: { error: null },
    });

    const response = await POST(submitRequest(), { params: Promise.resolve({ id: SESSION_ID }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.result).toEqual({ status: "completed", score: 1, maxScore: 1 });
    expect(body.reviewQuestions).toEqual([{ id: "q1" }]);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      session_id: SESSION_ID,
      student_id: STUDENT_ID,
      responses: { q1: "answer" },
    });
  });

  it("returns the idempotent 409 (not a 500) when the insert loses the TOCTOU race with a 23505 unique violation", async () => {
    const { POST, mockInsert } = await loadRoute({
      // The pre-check itself reports no existing attempt — this is the
      // genuine race: a concurrent request's insert committed between this
      // request's pre-check and its own insert.
      existingAttempt: null,
      insertResult: {
        error: {
          code: "23505",
          message: 'duplicate key value violates unique constraint "exam_attempts_session_id_key"',
        },
      },
    });

    const response = await POST(submitRequest(), { params: Promise.resolve({ id: SESSION_ID }) });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "already_submitted" });
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("still returns the fast-path 409 when the pre-check already finds an existing attempt (insert never attempted)", async () => {
    const { POST, mockInsert } = await loadRoute({
      existingAttempt: { id: "attempt-1" },
      insertResult: { error: null },
    });

    const response = await POST(submitRequest(), { params: Promise.resolve({ id: SESSION_ID }) });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "already_submitted" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns the generic 500 for a non-23505 insert error (constraint handling doesn't swallow real failures)", async () => {
    const { POST, mockInsert } = await loadRoute({
      existingAttempt: null,
      insertResult: { error: { code: "08006", message: "connection failure" } },
    });

    const response = await POST(submitRequest(), { params: Promise.resolve({ id: SESSION_ID }) });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "attempt_not_recorded" });
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
});
