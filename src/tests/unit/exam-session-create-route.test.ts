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
const mockSessionInsert = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: mockProfileSingle }) }) };
      }
      if (table === "exam_sessions") {
        return { insert: mockSessionInsert };
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
    mockSessionInsert.mockReset();

    mockGetUser.mockResolvedValue({ data: { user: { id: "student-1" } } });
    mockProfileSingle.mockResolvedValue({ data: { role: "student" } });
    mockSessionInsert.mockReturnValue({
      select: () => ({ single: async () => ({ data: { id: "session-1" }, error: null }) }),
    });
  });

  it("rejects an unauthenticated caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
    expect(mockSessionInsert).not.toHaveBeenCalled();
  });

  it("rejects a teacher — MM-AUTH-01", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "teacher" } });

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "students_only" });
    expect(mockSessionInsert).not.toHaveBeenCalled();
  });

  it("rejects a parent — MM-AUTH-01", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "parent" } });

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "students_only" });
    expect(mockSessionInsert).not.toHaveBeenCalled();
  });

  it("rejects a caller with no profile row at all", async () => {
    mockProfileSingle.mockResolvedValue({ data: null });

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "students_only" });
    expect(mockSessionInsert).not.toHaveBeenCalled();
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
    expect(mockSessionInsert).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const response = await POST(postRequest({ config: { yearLevel: 99 } }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(mockSessionInsert).not.toHaveBeenCalled();
  });

  it("creates a session for a genuine student", async () => {
    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sessionId).toBe("session-1");
    expect(mockSessionInsert).toHaveBeenCalledTimes(1);
    expect(mockSessionInsert.mock.calls[0][0]).toMatchObject({ student_id: "student-1" });
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
    expect(mockSessionInsert).not.toHaveBeenCalled();
  });

  it("rejects a request naming neither", async () => {
    const response = await POST(postRequest({}));

    expect(response.status).toBe(400);
    expect(mockSessionInsert).not.toHaveBeenCalled();
  });

  it("404s an unknown pattern id", async () => {
    const response = await POST(postRequest({ patternId: "not-a-pattern" }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "unknown_pattern" });
    expect(mockSessionInsert).not.toHaveBeenCalled();
  });

  it("refuses to sit a deferred pattern, whatever the client asks for", async () => {
    const response = await POST(postRequest({ patternId: "naplan-y3-writing-deferred" }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "pattern_deferred" });
    expect(mockSessionInsert).not.toHaveBeenCalled();
  });
});
