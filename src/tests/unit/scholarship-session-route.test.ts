import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const state = vi.hoisted(() => ({ bank: [] as unknown[] }));
vi.mock("@/server/exam-bank", () => ({ getExamBank: vi.fn(() => state.bank) }));

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockCreateRpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    rpc: (fn: string, params?: unknown) =>
      fn === "session_storage_model_for_caller" ? Promise.resolve({ data: "legacy", error: null }) : mockCreateRpc(fn, params),
    from: (table: string) => {
      if (table === "profiles") return { select: () => ({ eq: () => ({ single: mockProfileSingle }) }) };
      throw new Error(`unexpected table: ${table}`);
    },
  })),
}));

import { POST } from "@/app/api/exam/session/route";
import { loadScholarshipDraftQuestions } from "@/tests/helpers/scholarship-published";
import { getExamPattern } from "@/features/exam-engine/exam-patterns";

const nr = loadScholarshipDraftQuestions("nr");
const rc = loadScholarshipDraftQuestions("rc");

function post(body: unknown): Request {
  return new Request("http://localhost/api/exam/session", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/exam/session for scholarship papers", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockProfileSingle.mockReset();
    mockCreateRpc.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: { id: "student-1" } } });
    mockProfileSingle.mockResolvedValue({ data: { role: "student" } });
    mockCreateRpc.mockResolvedValue({ data: "session-1", error: null });
    state.bank = [...nr, ...rc];
  });

  it("creates a full paper, stores the server's own selection and returns answer-stripped questions", async () => {
    const response = await POST(post({ patternId: "scholarship-y6-numerical-reasoning-full" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sessionId).toBe("session-1");
    expect(body.questions).toHaveLength(40);

    const [fn, params] = mockCreateRpc.mock.calls[0];
    expect(fn).toBe("create_exam_session");
    expect((params as { p_selected_question_ids: string[] }).p_selected_question_ids).toHaveLength(40);
    expect(new Set((params as { p_selected_question_ids: string[] }).p_selected_question_ids)).toEqual(new Set(nr.map((q) => q.id)));

    const serialised = JSON.stringify(body);
    for (const question of body.questions) {
      expect(question).not.toHaveProperty("answerKey");
      expect(question).not.toHaveProperty("explanation");
    }
    // No explanation text reaches the browser before submission, even though the draft explanations name the answer.
    for (const q of nr) expect(serialised).not.toContain(q.explanation);
  });

  it("creates the exact 12-item sample from isolated fixtures, retaining passages and withholding answers", async () => {
    // Only this mocked bank/RPC changes: no publication approvals or real database writes.
    state.bank = ["vr", "nr", "rc", "maths"].flatMap(section => loadScholarshipDraftQuestions(section as "vr" | "nr" | "rc" | "maths"));
    const pattern = getExamPattern("scholarship-y6-comprehensive-sample-module")!;
    const ids = pattern.sources.flatMap(source => source.filters!.questionIds!);
    const response = await POST(post({ patternId: pattern.id }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.questions.map((q: { id: string }) => q.id).sort()).toEqual([...ids].sort());
    expect(mockCreateRpc.mock.calls[0][1].p_selected_question_ids.sort()).toEqual([...ids].sort());
    const reading = body.questions.filter((q: { id: string }) => q.id.includes("-rc-"));
    expect(reading).toHaveLength(3);
    for (const q of reading) expect(q.stimulus).toEqual(rc[0].stimulus);
    for (const q of body.questions) {
      expect(q).not.toHaveProperty("answerKey");
      expect(q).not.toHaveProperty("explanation");
    }
    for (const q of state.bank as typeof nr) {
      if (ids.includes(q.id)) expect(JSON.stringify(body)).not.toContain(q.explanation);
    }
  });

  it("refuses an incomplete sample without substituting other published fixtures", async () => {
    state.bank = ["vr", "nr", "rc", "maths"].flatMap(section => loadScholarshipDraftQuestions(section as "vr" | "nr" | "rc" | "maths")).filter(q => q.id !== "scholarship-y6-vr-001");
    expect((await POST(post({ patternId: "scholarship-y6-comprehensive-sample-module", asPracticeModule: true }))).status).toBe(422);
    expect(mockCreateRpc).not.toHaveBeenCalled();
  });

  it("denies the sample session to guests and non-student roles", async () => {
    const body = { patternId: "scholarship-y6-comprehensive-sample-module" };
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(post(body))).status).toBe(401);
    mockGetUser.mockResolvedValue({ data: { user: { id: "non-student" } } });
    for (const role of ["parent", "teacher", "admin"]) {
      mockProfileSingle.mockResolvedValue({ data: { role } });
      expect((await POST(post(body))).status).toBe(403);
    }
    expect(mockCreateRpc).not.toHaveBeenCalled();
  });

  it("does not ship explanations before submission even when the client asks for Confidence Mode", async () => {
    const response = await POST(post({ patternId: "scholarship-y6-numerical-reasoning-full", confidenceMode: true }));
    expect(response.status).toBe(200);
    const body = await response.json();
    const serialised = JSON.stringify(body);
    for (const q of nr) expect(serialised).not.toContain(q.explanation);
  });

  it("refuses a short bank with 422, and a requested practice module cannot widen it", async () => {
    state.bank = nr.slice(1);
    for (const asPracticeModule of [false, true]) {
      const response = await POST(post({ patternId: "scholarship-y6-numerical-reasoning-full", asPracticeModule }));
      expect(response.status).toBe(422);
      expect((await response.json()).error).toBe("insufficient_questions");
    }
    expect(mockCreateRpc).not.toHaveBeenCalled();
  });

  it("serves reading only as whole passages", async () => {
    const response = await POST(post({ patternId: "scholarship-y6-reading-full" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.questions).toHaveLength(35);
    const counts = new Map<string, number>();
    for (const q of body.questions) counts.set(q.stimulus.title, (counts.get(q.stimulus.title) ?? 0) + 1);
    expect([...counts.values()].sort()).toEqual([8, 9, 9, 9]);

    state.bank = rc.filter((q) => q.id !== rc[12].id);
    expect((await POST(post({ patternId: "scholarship-y6-reading-full", asPracticeModule: true }))).status).toBe(422);
  });

  it("refuses a custom-length scholarship draw and keeps scholarship out of a mixed draw", async () => {
    const custom = await POST(post({ config: { yearLevel: 6, examStyle: "scholarship_style", subject: "numerical_reasoning", questionCount: 10, timing: "timed" } }));
    expect(custom.status).toBe(422);
    expect((await custom.json()).error).toBe("scholarship_requires_paper");
    expect(mockCreateRpc).not.toHaveBeenCalled();

    const mixed = await POST(post({ config: { yearLevel: 6, examStyle: "mixed", subject: "mixed", questionCount: 10, timing: "timed" } }));
    expect(mixed.status).toBe(422);
    expect(mockCreateRpc).not.toHaveBeenCalled();
  });

  it("never starts the deferred written-expression paper", async () => {
    const response = await POST(post({ patternId: "scholarship-y6-written-expression-full" }));
    expect(response.status).toBe(422);
    expect((await response.json()).error).toBe("pattern_deferred");
  });

  it("is for students only, and never for an unauthenticated caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(post({ patternId: "scholarship-y6-numerical-reasoning-full" }))).status).toBe(401);
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    for (const role of ["parent", "teacher", "admin"]) {
      mockProfileSingle.mockResolvedValue({ data: { role } });
      expect((await POST(post({ patternId: "scholarship-y6-numerical-reasoning-full" }))).status).toBe(403);
    }
    expect(mockCreateRpc).not.toHaveBeenCalled();
  });

  it("rejects a cross-site origin before touching the session", async () => {
    const request = new Request("http://localhost/api/exam/session", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://evil.example", host: "localhost" },
      body: JSON.stringify({ patternId: "scholarship-y6-numerical-reasoning-full" }),
    });
    expect((await POST(request)).status).toBe(403);
    expect(mockCreateRpc).not.toHaveBeenCalled();
  });
});
