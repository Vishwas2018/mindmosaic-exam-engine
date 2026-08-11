import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const FAKE_QUESTION = {
  id: "q1",
  yearLevel: 5,
  subject: "numeracy",
  marks: 1,
  answerKey: { kind: "exact", value: "1" },
  explanation: "",
};

vi.mock("@/server/exam-bank", () => ({
  getExamBank: vi.fn(() => [FAKE_QUESTION]),
}));

/*
 * Partial mock: only the two functions this suite stubs are replaced. It
 * used to replace the whole module, which broke the moment anything else in
 * the route's import graph needed a real export from it — the exam-pattern
 * registry validates itself at module load and reads
 * ISOLABLE_SUBJECT_FILTERS / REGISTRY_SUBJECT_BY_FILTER from here.
 */
vi.mock("@/features/exam-engine/selection", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/exam-engine/selection")>()),
  selectExamQuestions: vi.fn(() => ({ ok: true, questions: [FAKE_QUESTION] })),
  durationSecondsFor: vi.fn(() => 600),
}));

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
/*
 * MM-AUD-SEC-001: the session row is no longer inserted through the
 * caller's own client — `authenticated` has no INSERT on exam_sessions at
 * all — so this stands in for the create_exam_session RPC. `from` keeps
 * only the profiles branch and throws on exam_sessions, which is what makes
 * a regression back to a direct insert fail loudly here rather than pass
 * against a mock that still accepted one.
 */
const mockRpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
    from: (table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: mockProfileSingle }) }) };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  })),
}));

import { POST } from "@/app/api/exam/session/route";

const VALID_CONFIG = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "untimed",
};

function postRequest(
  body: unknown = { config: VALID_CONFIG },
  headers: Record<string, string> = {
    "content-type": "application/json",
    origin: "http://localhost",
    host: "localhost",
  },
): Request {
  return new Request("http://localhost/api/exam/session", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/exam/session — MM-AUTH-01 role gate + MM-SEC-03 origin gate", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockProfileSingle.mockReset();
    mockRpc.mockReset();

    mockGetUser.mockResolvedValue({ data: { user: { id: "student-1" } } });
    mockProfileSingle.mockResolvedValue({ data: { role: "student" } });
    /* create_exam_session returns the new uuid directly, not a row. */
    mockRpc.mockResolvedValue({ data: "session-1", error: null });
  });

  it("rejects an unauthenticated caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects a teacher — MM-AUTH-01", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "teacher" } });

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "students_only" });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects a parent — MM-AUTH-01", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "parent" } });

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "students_only" });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects a caller with no profile row at all", async () => {
    mockProfileSingle.mockResolvedValue({ data: null });

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "students_only" });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects a cross-site Origin — MM-SEC-03", async () => {
    const response = await POST(
      postRequest(
        { config: VALID_CONFIG },
        { "content-type": "application/json", origin: "https://evil.example", host: "localhost" },
      ),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "origin_mismatch" });
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const response = await POST(postRequest({ config: { yearLevel: 99 } }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("creates a session for a genuine student", async () => {
    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sessionId).toBe("session-1");
    expect(mockRpc).toHaveBeenCalledTimes(1);

    const [fn, params] = mockRpc.mock.calls[0];
    expect(fn).toBe("create_exam_session");
    /* The paper is the server's own selection, passed through verbatim... */
    expect(params).toMatchObject({
      p_seed: expect.any(String),
      p_selected_question_ids: ["q1"],
    });
    /* ...and student_id is deliberately absent: the function reads it from
       auth.uid(), so no argument this route could get wrong decides whose
       session it is. */
    expect(params).not.toHaveProperty("student_id");
    expect(params).not.toHaveProperty("p_student_id");
  });

  /*
   * MM-AUD-SEC-001: the function's role gate is independent of the profile
   * check above, so the route has to map its SQLSTATE rather than reporting
   * a generic failure — the two can only disagree if the role changed
   * mid-request, and the client already handles students_only.
   */
  it("maps the RPC's own role refusal (MM002) to the same 403", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: "MM002", message: "not a student" } });

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "students_only" });
  });

  it("500s when the RPC fails for any other reason", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: "08006", message: "connection failure" } });

    const response = await POST(postRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "session_not_created" });
  });

  /*
   * The full-length-practice-paper entry point. The client sends only a
   * pattern id; everything about the paper's shape is resolved server-side
   * from the registry, so these cover the ways a request can name a paper
   * the server will not sit.
   */
  it("rejects a request naming both a config and a pattern", async () => {
    const response = await POST(
      postRequest({ config: VALID_CONFIG, patternId: "naplan-y3-numeracy-full" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects a request naming neither", async () => {
    const response = await POST(postRequest({}));

    expect(response.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("404s an unknown pattern id", async () => {
    const response = await POST(postRequest({ patternId: "not-a-pattern" }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "unknown_pattern" });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("refuses to sit a deferred pattern, whatever the client asks for", async () => {
    const response = await POST(postRequest({ patternId: "naplan-y3-writing-deferred" }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "pattern_deferred" });
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
