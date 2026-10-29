// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Server-side enforcement of the preview-only Scholarship sample through the REAL session and submit routes
 * (only the database, the Supabase client and the governed bank are faked). The governed bank is mocked EMPTY, so
 * anything served here came through the gated preview source and nowhere else.
 */

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/server/exam-bank", () => ({
  getExamBank: vi.fn(() => []),
  getPatternReadiness: vi.fn(() => ({})),
}));

const ALLOWED = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const SESSION_ID = "00000000-0000-0000-0000-00000000a012";
const PATTERN_ID = "scholarship-y6-comprehensive-sample-module";

const KEYS: Record<string, string> = {
  "scholarship-y6-vr-001": "e",
  "scholarship-y6-vr-016": "d",
  "scholarship-y6-vr-032": "c",
  "scholarship-y6-nr-001": "e",
  "scholarship-y6-nr-022": "e",
  "scholarship-y6-nr-023": "b",
  "scholarship-y6-rc-001": "a",
  "scholarship-y6-rc-002": "c",
  "scholarship-y6-rc-003": "e",
  "scholarship-y6-maths-004": "b",
  "scholarship-y6-maths-007": "a",
  "scholarship-y6-maths-014": "c",
};

const state = vi.hoisted(() => ({ userId: "" as string, role: "student" as string, signedIn: true, rpcCalls: [] as { fn: string; params: Record<string, unknown> }[] }));

function useActivePreview(overrides: Record<string, string> = {}) {
  const env: Record<string, string> = {
    SCHOLARSHIP_SAMPLE_PREVIEW: "enabled",
    SCHOLARSHIP_SAMPLE_SUPABASE_REF: "devref123",
    PRODUCTION_SUPABASE_PROJECT_REF: "prodref4567",
    NEXT_PUBLIC_SUPABASE_URL: "https://devref123.supabase.co",
    SCHOLARSHIP_SAMPLE_ALLOWED_USER_IDS: ALLOWED,
    VERCEL_ENV: "preview",
    ...overrides,
  };
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
}

function sessionRequest(): Request {
  return new Request("http://localhost/api/exam/session", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost" },
    body: JSON.stringify({ patternId: PATTERN_ID }),
  });
}

function mockClient(sessionRow?: Record<string, unknown>) {
  return {
    auth: { getUser: async () => ({ data: { user: state.signedIn ? { id: state.userId } : null } }) },
    rpc: async (fn: string, params: Record<string, unknown>) => {
      if (fn === "session_storage_model_for_caller") return { data: "legacy", error: null };
      state.rpcCalls.push({ fn, params });
      return { data: fn === "create_exam_session" ? SESSION_ID : null, error: null };
    },
    from: (table: string) => {
      if (table === "profiles") return { select: () => ({ eq: () => ({ single: async () => ({ data: { role: state.role } }) }) }) };
      if (table === "visible_sittings") {
        return {
          select: () => ({
            or: () => ({ limit: async () => ({ data: [{ origin: "legacy", session_id: SESSION_ID, alias_session_id: null }] }) }),
          }),
        };
      }
      if (table === "exam_sessions") return { select: () => ({ eq: () => ({ single: async () => ({ data: sessionRow }) }) }) };
      if (table === "exam_attempts") return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
      throw new Error(`unexpected table: ${table}`);
    },
  };
}

async function loadRoutes(sessionRow?: Record<string, unknown>) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => mockClient(sessionRow)) }));
  const session = await import("@/app/api/exam/session/route");
  const submit = await import("@/app/api/exam/session/[id]/submit/route");
  return { createSession: session.POST, submitSession: submit.POST };
}

beforeEach(() => {
  state.userId = ALLOWED;
  state.role = "student";
  state.signedIn = true;
  state.rpcCalls = [];
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock("@/lib/supabase/server");
});

describe("POST /api/exam/session: Scholarship sample", () => {
  it("creates the 12-question, 18-minute sample for an allowlisted student, answer-stripped", async () => {
    useActivePreview();
    const { createSession } = await loadRoutes();
    const response = await createSession(sessionRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sessionId).toBe(SESSION_ID);
    expect(body.questions.map((q: { id: string }) => q.id).sort()).toEqual(Object.keys(KEYS).sort());

    const [{ fn, params }] = state.rpcCalls;
    expect(fn).toBe("create_exam_session");
    expect((params.p_selected_question_ids as string[]).sort()).toEqual(Object.keys(KEYS).sort());
    expect((params.p_config as { patternId: string; questionCount: number; timing: string }).patternId).toBe(PATTERN_ID);
    expect((params.p_config as { questionCount: number }).questionCount).toBe(12);
    expect((params.p_config as { timing: string }).timing).toBe("timed");
    // 18 minutes + the standard 5-minute submission grace.
    const lifetime = (Date.parse(params.p_expires_at as string) - Date.now()) / 1000;
    expect(lifetime).toBeGreaterThan(18 * 60 + 5 * 60 - 30);
    expect(lifetime).toBeLessThan(18 * 60 + 5 * 60 + 30);

    for (const question of body.questions) {
      expect(question).not.toHaveProperty("answerKey");
      expect(question).not.toHaveProperty("explanation");
    }
    const reading = body.questions.filter((q: { id: string }) => q.id.includes("-rc-"));
    expect(reading).toHaveLength(3);
    expect(new Set(reading.map((q: { stimulus?: { body: string } }) => q.stimulus?.body)).size).toBe(1);
  });

  it("returns 404 to a signed-in student who is not allowlisted, and creates nothing", async () => {
    useActivePreview();
    state.userId = OTHER;
    const { createSession } = await loadRoutes();
    const response = await createSession(sessionRequest());
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "unknown_pattern" });
    expect(state.rpcCalls).toHaveLength(0);
  });

  it("refuses guests, parents and administrators even if their user id is allowlisted", async () => {
    useActivePreview();
    const { createSession } = await loadRoutes();
    state.signedIn = false;
    expect((await createSession(sessionRequest())).status).toBeGreaterThanOrEqual(401);
    state.signedIn = true;
    for (const role of ["parent", "admin"]) {
      state.role = role;
      const response = await createSession(sessionRequest());
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    }
    expect(state.rpcCalls).toHaveLength(0);
  });

  it("does not serve the sample on Vercel production even with the flag, binding and allowlist set", async () => {
    useActivePreview({ VERCEL_ENV: "production" });
    const { createSession } = await loadRoutes();
    const response = await createSession(sessionRequest());
    expect(response.status).toBe(422);
    expect((await response.json()).error).toBe("insufficient_questions");
    expect(state.rpcCalls).toHaveLength(0);
  });

  it("does not serve the sample when the flag is unset (today's behaviour everywhere)", async () => {
    useActivePreview({ SCHOLARSHIP_SAMPLE_PREVIEW: "" });
    const { createSession } = await loadRoutes();
    const response = await createSession(sessionRequest());
    expect(response.status).toBe(422);
    expect(state.rpcCalls).toHaveLength(0);
  });

  it("refuses to serve when the Supabase project binding does not match", async () => {
    useActivePreview({ SCHOLARSHIP_SAMPLE_SUPABASE_REF: "notthisproject" });
    const { createSession } = await loadRoutes();
    expect((await createSession(sessionRequest())).status).toBe(404);
    expect(state.rpcCalls).toHaveLength(0);
  });

  it.each([
    ["undeclared", ""],
    ["malformed", "not a ref"],
    ["the bound project itself", "devref123"],
  ])("refuses to serve when the production project ref is %s", async (_label, production) => {
    useActivePreview({ PRODUCTION_SUPABASE_PROJECT_REF: production });
    const { createSession } = await loadRoutes();
    expect((await createSession(sessionRequest())).status).toBe(404);
    expect(state.rpcCalls).toHaveLength(0);
  });
});

describe("POST /api/exam/session/[id]/submit: Scholarship sample scoring", () => {
  const sessionRow = {
    id: SESSION_ID,
    student_id: ALLOWED,
    config: {
      yearLevel: 6,
      examStyle: "scholarship_style",
      subject: "mixed",
      questionCount: 12,
      timing: "timed",
      patternId: PATTERN_ID,
      shortened: false,
      confidenceMode: false,
      bankId: "published",
      mode: "standard",
    },
    seed: "seed",
    selected_question_ids: Object.keys(KEYS),
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 23 * 60 * 1000).toISOString(),
  };

  function submitRequest(responses: Record<string, string>): Request {
    return new Request(`http://localhost/api/exam/session/${SESSION_ID}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost" },
      body: JSON.stringify({ responses, submissionReason: "user_submitted" }),
    });
  }

  it("scores a perfect and a partial sitting server-side and returns explanations after submission", async () => {
    useActivePreview();
    const { submitSession } = await loadRoutes(sessionRow);
    const perfect = await submitSession(submitRequest(KEYS), { params: Promise.resolve({ id: SESSION_ID }) });
    expect(perfect.status).toBe(200);
    const body = await perfect.json();
    expect(body.result).toMatchObject({ totalQuestions: 12, correctCount: 12, incorrectCount: 0, objectivePercentage: 100 });
    expect(body.reviewQuestions).toHaveLength(12);
    for (const question of body.reviewQuestions) expect(String(question.explanation).length).toBeGreaterThan(10);
    expect(state.rpcCalls.at(-1)?.fn).toBe("record_exam_attempt");

    state.rpcCalls = [];
    const partialAnswers = { ...KEYS, "scholarship-y6-maths-004": "a", "scholarship-y6-maths-007": "b", "scholarship-y6-rc-003": "a", "scholarship-y6-maths-014": "a" };
    const { submitSession: again } = await loadRoutes(sessionRow);
    const partial = await again(submitRequest(partialAnswers), { params: Promise.resolve({ id: SESSION_ID }) });
    expect((await partial.json()).result).toMatchObject({ correctCount: 8, incorrectCount: 4, objectivePercentage: 67 });
  });

  it("cannot score a sample session once the account is no longer allowlisted (fails closed, no attempt written)", async () => {
    useActivePreview({ SCHOLARSHIP_SAMPLE_ALLOWED_USER_IDS: OTHER });
    const { submitSession } = await loadRoutes(sessionRow);
    const response = await submitSession(submitRequest(KEYS), { params: Promise.resolve({ id: SESSION_ID }) });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "corrupt_session" });
    expect(state.rpcCalls.filter((call) => call.fn === "record_exam_attempt")).toHaveLength(0);
  });
});
