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

vi.mock("server-only", () => ({}));

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

/* A real UUID shape, not "session-1": Gate A item A9's origin dispatch
   (resolveSittingSource, @/server/assessment/read-dispatch) validates the id
   format before it ever queries visible_sittings. */
const SESSION_ID = "00000000-0000-0000-0000-00000000a002";
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
  readonly user?: { id: string } | null;
}

/*
 * MM-AUD-SEC-001: the attempt is written by the record_exam_attempt RPC,
 * not by an insert through the caller's own client — `authenticated` has no
 * INSERT on exam_attempts at all. `mockInsert` now stands in for that RPC,
 * and the exam_attempts branch of `from` keeps only its select (the
 * fast-path pre-check), so a regression back to a direct insert throws here
 * instead of passing against an obliging mock.
 */
function mockSupabaseClient({ existingAttempt, insertResult, user = { id: STUDENT_ID } }: SupabaseMockOptions) {
  const mockInsert =
    vi.fn<(fn: string, params: Record<string, unknown>) => Promise<SupabaseMockOptions["insertResult"]>>();
  mockInsert.mockResolvedValue(insertResult);
  const from = vi.fn((table: string) => {
    /* Gate A item A9's origin dispatch: this suite is entirely about the
       legacy submit path (MM-SEC-02's TOCTOU race is a legacy-table
       constraint), so every session resolves to "legacy" here — the same
       stance exam-session-create-route.test.ts already takes for
       session_storage_model_for_caller(). */
    if (table === "visible_sittings") {
      return {
        select: () => ({
          or: () => ({
            limit: async () => ({ data: [{ origin: "legacy", session_id: SESSION_ID, alias_session_id: null }] }),
          }),
        }),
      };
    }
    if (table === "exam_sessions") {
      return { select: () => ({ eq: () => ({ single: async () => ({ data: BASE_SESSION }) }) }) };
    }
    if (table === "exam_attempts") {
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existingAttempt }) }) }),
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });
  const client = {
    auth: { getUser: async () => ({ data: { user } }) },
    rpc: mockInsert,
    from,
  };
  return { client, mockInsert, from };
}

function submitRequest(
  body: Record<string, unknown> = { responses: { q1: "answer" } },
  headers: Record<string, string> = {
    "content-type": "application/json",
    origin: "http://localhost",
    host: "localhost",
  },
): Request {
  return new Request(`http://localhost/api/exam/session/${SESSION_ID}/submit`, {
    method: "POST",
    headers,
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
    const [fn, params] = mockInsert.mock.calls[0];
    expect(fn).toBe("record_exam_attempt");
    expect(params).toMatchObject({
      p_session_id: SESSION_ID,
      p_responses: { q1: "answer" },
      /* The score the route computed — and, now that no other path can
         write the column, the only value it can ever hold. */
      p_result: { status: "completed", score: 1, maxScore: 1 },
    });
    /* student_id comes from auth.uid() inside the function. */
    expect(params).not.toHaveProperty("student_id");
    expect(params).not.toHaveProperty("p_student_id");
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

  /*
   * MM-AUD-SEC-001: record_exam_attempt re-derives session ownership and
   * expiry rather than trusting the route's earlier checks, so it can
   * refuse a request those checks passed — only if the state changed
   * in between. Each SQLSTATE maps to the status that same condition
   * already returns earlier in the route, so losing that race looks
   * identical to the client.
   */
  it("maps the RPC's ownership refusal (MM003) to the same 404 as the earlier check", async () => {
    const { POST } = await loadRoute({
      existingAttempt: null,
      insertResult: { error: { code: "MM003", message: "no such exam session for this caller" } },
    });

    const response = await POST(submitRequest(), { params: Promise.resolve({ id: SESSION_ID }) });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "session_not_found" });
  });

  it("maps the RPC's expiry refusal (MM004) to the same 410 as the earlier check", async () => {
    const { POST } = await loadRoute({
      existingAttempt: null,
      insertResult: { error: { code: "MM004", message: "exam session has expired" } },
    });

    const response = await POST(submitRequest(), { params: Promise.resolve({ id: SESSION_ID }) });

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: "session_expired" });
  });
});

describe("POST /api/exam/session/[id]/submit — guard sweep (auth, origin, body)", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/supabase/server");
  });

  it("rejects an unauthenticated caller", async () => {
    const { POST, mockInsert } = await loadRoute({
      existingAttempt: null,
      insertResult: { error: null },
      user: null,
    });

    const response = await POST(submitRequest(), { params: Promise.resolve({ id: SESSION_ID }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects a cross-site Origin — MM-SEC-03", async () => {
    const { POST, mockInsert } = await loadRoute({
      existingAttempt: null,
      insertResult: { error: null },
    });

    const response = await POST(
      submitRequest(
        { responses: { q1: "answer" } },
        { "content-type": "application/json", origin: "https://evil.example", host: "localhost" },
      ),
      { params: Promise.resolve({ id: SESSION_ID }) },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "origin_mismatch" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const { POST, mockInsert } = await loadRoute({
      existingAttempt: null,
      insertResult: { error: null },
    });

    const response = await POST(submitRequest({ responses: "not-an-object" }), {
      params: Promise.resolve({ id: SESSION_ID }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
