import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
const mockClassMaybeSingle = vi.fn();
const mockRosterSelect = vi.fn();
const mockAssignmentInsertSingle = vi.fn();
const mockAssignmentStudentsInsert = vi.fn();
const mockAssignmentDelete = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: mockProfileSingle }) }) };
      }
      if (table === "classes") {
        return { select: () => ({ eq: () => ({ maybeSingle: mockClassMaybeSingle }) }) };
      }
      if (table === "class_students") {
        return { select: () => ({ eq: mockRosterSelect }) };
      }
      if (table === "assignments") {
        return {
          insert: () => ({ select: () => ({ single: mockAssignmentInsertSingle }) }),
          delete: () => ({ eq: mockAssignmentDelete }),
        };
      }
      if (table === "assignment_students") {
        return { insert: mockAssignmentStudentsInsert };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  })),
}));

import { POST } from "@/app/api/teacher/assignments/route";

const STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const CLASS_ID = "22222222-2222-4222-8222-222222222222";

const VALID_BODY = {
  classId: CLASS_ID,
  config: {
    yearLevel: 5,
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: 10,
    timing: "untimed",
    title: "Week 3 numeracy",
  },
  studentIds: [STUDENT_ID],
};

function postRequest(
  body: unknown = VALID_BODY,
  headers: Record<string, string> = {
    "content-type": "application/json",
    origin: "http://localhost",
    host: "localhost",
  },
): Request {
  return new Request("http://localhost/api/teacher/assignments", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/teacher/assignments — guard sweep", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockProfileSingle.mockReset();
    mockClassMaybeSingle.mockReset();
    mockRosterSelect.mockReset();
    mockAssignmentInsertSingle.mockReset();
    mockAssignmentStudentsInsert.mockReset();
    mockAssignmentDelete.mockReset();

    mockGetUser.mockResolvedValue({ data: { user: { id: "teacher-1" } } });
    mockProfileSingle.mockResolvedValue({ data: { role: "teacher" } });
    mockClassMaybeSingle.mockResolvedValue({ data: { id: CLASS_ID } });
    mockRosterSelect.mockResolvedValue({ data: [{ student_id: STUDENT_ID }], error: null });
    mockAssignmentInsertSingle.mockResolvedValue({ data: { id: "assignment-1" }, error: null });
    mockAssignmentStudentsInsert.mockResolvedValue({ error: null });
  });

  it("rejects an unauthenticated caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
  });

  it("rejects a non-teacher caller", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "student" } });

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
    const response = await POST(postRequest({ classId: "not-a-uuid" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("404s a class the teacher doesn't own", async () => {
    mockClassMaybeSingle.mockResolvedValue({ data: null });

    const response = await POST(postRequest());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "class_not_found" });
  });

  it("rejects a student id outside the class roster", async () => {
    mockRosterSelect.mockResolvedValue({ data: [], error: null });

    const response = await POST(postRequest());

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "students_not_in_class" });
  });

  it("creates the assignment for a genuine teacher targeting their own class roster", async () => {
    const response = await POST(postRequest());

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ assignmentId: "assignment-1", assignedCount: 1 });
  });
});
