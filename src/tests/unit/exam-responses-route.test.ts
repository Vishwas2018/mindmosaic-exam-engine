import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const SESSION_ID = "session-1";
const STUDENT_ID = "student-1";

interface SupabaseMockOptions {
  readonly user?: { id: string } | null;
  readonly session?: { id: string; student_id: string; expires_at: string } | null;
  readonly existingAttempt?: { id: string } | null;
  readonly upsertError?: { message: string } | null;
}

function mockSupabaseClient({
  user = { id: STUDENT_ID },
  session = {
    id: SESSION_ID,
    student_id: STUDENT_ID,
    expires_at: "2099-01-01T00:00:00.000Z",
  },
  existingAttempt = null,
  upsertError = null,
}: SupabaseMockOptions) {
  const mockUpsert = vi.fn(async () => ({ error: upsertError }));
  const from = vi.fn((table: string) => {
    if (table === "exam_sessions") {
      return { select: () => ({ eq: () => ({ single: async () => ({ data: session }) }) }) };
    }
    if (table === "exam_attempts") {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existingAttempt }) }) }) };
    }
    if (table === "exam_responses") {
      return { upsert: mockUpsert };
    }
    throw new Error(`unexpected table: ${table}`);
  });
  const client = { auth: { getUser: async () => ({ data: { user } }) }, from };
  return { client, mockUpsert };
}

function autosaveRequest(
  body: Record<string, unknown> = { responses: { q1: "answer" }, currentQuestionIndex: 0, flaggedQuestionIds: [] },
  headers: Record<string, string> = {
    "content-type": "application/json",
    origin: "http://localhost",
    host: "localhost",
  },
): Request {
  return new Request(`http://localhost/api/exam/session/${SESSION_ID}/responses`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function loadRoute(options: SupabaseMockOptions = {}) {
  vi.resetModules();
  const { client, mockUpsert } = mockSupabaseClient(options);
  vi.doMock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => client) }));
  const routeModule = await import("@/app/api/exam/session/[id]/responses/route");
  return { POST: routeModule.POST, mockUpsert };
}

describe("POST /api/exam/session/[id]/responses — guard sweep", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/supabase/server");
  });

  it("rejects an unauthenticated caller", async () => {
    const { POST, mockUpsert } = await loadRoute({ user: null });

    const response = await POST(autosaveRequest(), { params: Promise.resolve({ id: SESSION_ID }) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejects a cross-site Origin — MM-SEC-03", async () => {
    const { POST, mockUpsert } = await loadRoute();

    const response = await POST(
      autosaveRequest(
        { responses: { q1: "answer" }, currentQuestionIndex: 0, flaggedQuestionIds: [] },
        { "content-type": "application/json", origin: "https://evil.example", host: "localhost" },
      ),
      { params: Promise.resolve({ id: SESSION_ID }) },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "origin_mismatch" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const { POST, mockUpsert } = await loadRoute();

    const response = await POST(autosaveRequest({ responses: { q1: "answer" } }), {
      params: Promise.resolve({ id: SESSION_ID }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejects a session id that doesn't belong to the caller", async () => {
    const { POST, mockUpsert } = await loadRoute({
      session: { id: SESSION_ID, student_id: "someone-else", expires_at: "2099-01-01T00:00:00.000Z" },
    });

    const response = await POST(autosaveRequest(), { params: Promise.resolve({ id: SESSION_ID }) });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "session_not_found" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("saves autosave data for the session's own student", async () => {
    const { POST, mockUpsert } = await loadRoute();

    const response = await POST(autosaveRequest(), { params: Promise.resolve({ id: SESSION_ID }) });

    expect(response.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });
});
