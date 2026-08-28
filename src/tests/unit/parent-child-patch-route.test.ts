import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockRoleSingle = vi.fn();
const mockLinkSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: mockRoleSingle }) }) };
      }
      if (table === "parent_children") {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mockLinkSingle }) }) }),
        };
      }
      throw new Error(`unexpected request table ${table}`);
    },
  })),
}));

const mockProfileEq = vi.fn();
const mockProfileUpdate = vi.fn((values: Record<string, unknown>) => {
  void values;
  return { eq: mockProfileEq };
});
const mockPasswordUpdate = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { admin: { updateUserById: mockPasswordUpdate } },
    from: (table: string) => {
      if (table === "profiles") return { update: mockProfileUpdate };
      if (table === "parent_children") {
        return { delete: () => ({ eq: () => ({ eq: vi.fn() }) }) };
      }
      throw new Error(`unexpected admin table ${table}`);
    },
  })),
}));

import { PATCH } from "@/app/api/parent/children/[childId]/route";

function request(body: unknown): Request {
  return new Request("http://localhost/api/parent/children/child-1", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      host: "localhost",
    },
    body: JSON.stringify(body),
  });
}

const context = { params: Promise.resolve({ childId: "child-1" }) };

describe("PATCH /api/parent/children/[childId]", () => {
  beforeEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockRoleSingle.mockResolvedValue({ data: { role: "parent" } });
    mockLinkSingle.mockResolvedValue({ data: { child_id: "child-1" } });
    mockProfileEq.mockResolvedValue({ error: null });
    mockPasswordUpdate.mockResolvedValue({ error: null });
    mockProfileUpdate.mockClear();
    mockProfileEq.mockClear();
    mockPasswordUpdate.mockClear();
  });

  it("preserves omitted year and preference fields", async () => {
    const response = await PATCH(request({ displayName: "Ada" }), context);

    expect(response.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith({ display_name: "Ada" });
  });

  it.each([1, 12])("accepts Year %i", async (yearLevel) => {
    const response = await PATCH(request({ yearLevel }), context);

    expect(response.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith({ year_level: yearLevel });
  });

  it("clears year only when explicitly null", async () => {
    const response = await PATCH(request({ yearLevel: null }), context);

    expect(response.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith({ year_level: null });
  });

  it("sets both preference columns in one update", async () => {
    const response = await PATCH(
      request({ curriculumPreference: { jurisdictionCode: "VIC", schoolSector: "government" } }),
      context,
    );

    expect(response.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      curriculum_jurisdiction_code: "VIC",
      curriculum_school_sector: "government",
    });
  });

  it("clears both preference columns in one update", async () => {
    const response = await PATCH(request({ curriculumPreference: null }), context);

    expect(response.status).toBe(200);
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      curriculum_jurisdiction_code: null,
      curriculum_school_sector: null,
    });
  });

  it("rejects incomplete preferences before privileged writes", async () => {
    const response = await PATCH(
      request({ curriculumPreference: { jurisdictionCode: "VIC" } }),
      context,
    );

    expect(response.status).toBe(400);
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  it("does not reset the PIN after an atomic profile write fails", async () => {
    mockProfileEq.mockResolvedValueOnce({ error: { message: "constraint failure" } });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await PATCH(
      request({
        pin: "123456",
        curriculumPreference: { jurisdictionCode: "VIC", schoolSector: "government" },
      }),
      context,
    );

    expect(response.status).toBe(500);
    expect(mockPasswordUpdate).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
