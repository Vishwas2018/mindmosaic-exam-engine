import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockAttemptMaybeSingle = vi.fn();
const mockEssayMarksUpsert = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: mockProfileSingle }) }) };
      }
      if (table === "exam_attempts") {
        return { select: () => ({ eq: () => ({ maybeSingle: mockAttemptMaybeSingle }) }) };
      }
      if (table === "essay_marks") {
        return { upsert: mockEssayMarksUpsert };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  })),
}));

import { POST } from "@/app/api/teacher/marking/route";

const ATTEMPT_ID = "33333333-3333-4333-8333-333333333333";

const VALID_BODY = {
  attemptId: ATTEMPT_ID,
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

describe("POST /api/teacher/marking — guard sweep", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockProfileSingle.mockReset();
    mockAttemptMaybeSingle.mockReset();
    mockEssayMarksUpsert.mockReset();

    mockGetUser.mockResolvedValue({ data: { user: { id: "teacher-1" } } });
    mockProfileSingle.mockResolvedValue({ data: { role: "teacher" } });
    mockAttemptMaybeSingle.mockResolvedValue({ data: { id: ATTEMPT_ID, result: ATTEMPT_RESULT } });
    mockEssayMarksUpsert.mockResolvedValue({ error: null });
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
    const response = await POST(postRequest({ attemptId: "not-a-uuid" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("404s an attempt outside the teacher's own class roster (RLS-scoped read comes back empty)", async () => {
    mockAttemptMaybeSingle.mockResolvedValue({ data: null });

    const response = await POST(postRequest());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "attempt_not_found" });
  });

  it("rejects awarded marks above the question's available ceiling", async () => {
    const response = await POST(postRequest({ ...VALID_BODY, awardedMarks: 99 }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "awarded_marks_exceed_available" });
    expect(mockEssayMarksUpsert).not.toHaveBeenCalled();
  });

  it("records the mark for a genuine teacher against a pending manual-review question", async () => {
    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    expect(mockEssayMarksUpsert).toHaveBeenCalledTimes(1);
  });
});
