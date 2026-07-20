import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  })),
}));

const mockCreateUser = vi.fn();
const mockProfilesUpdate = vi.fn(async () => ({ data: null, error: null }));
const mockParentChildrenInsert = vi.fn<() => Promise<{ error: { message: string } | null }>>(
  async () => ({ error: null }),
);
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { admin: { createUser: mockCreateUser } },
    from: (table: string) => {
      if (table === "profiles") {
        return { update: () => ({ eq: mockProfilesUpdate }) };
      }
      if (table === "parent_children") {
        return { insert: mockParentChildrenInsert };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  })),
}));

import { buildAliasEmail, normalizeLoginCode } from "@/features/auth/student-alias";
import { provisionChild } from "@/features/auth/provision-child";

function setRequester(user: { id: string } | null, role: string | null) {
  mockGetUser.mockResolvedValue({ data: { user } });
  mockSingle.mockResolvedValue({ data: role ? { role } : null });
}

describe("provisionChild", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSingle.mockReset();
    mockCreateUser.mockReset();
    mockProfilesUpdate.mockClear();
    mockParentChildrenInsert.mockClear();
    mockParentChildrenInsert.mockResolvedValue({ error: null });
    mockCreateUser.mockResolvedValue({ data: { user: { id: "child-1" } }, error: null });
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  it("fails cleanly, without throwing, when the service-role key isn't configured", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    setRequester({ id: "parent-1" }, "parent");

    const result = await provisionChild({ displayName: "Ada" });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/isn't configured/i);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("refuses when nobody is signed in", async () => {
    setRequester(null, null);

    const result = await provisionChild({ displayName: "Ada" });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/sign in/i);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("refuses when the signed-in caller is not a parent", async () => {
    setRequester({ id: "student-1" }, "student");

    const result = await provisionChild({ displayName: "Ada" });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/only a parent/i);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("rejects a blank display name before touching the admin API", async () => {
    setRequester({ id: "parent-1" }, "parent");

    const result = await provisionChild({ displayName: "   " });

    expect(result.ok).toBe(false);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("rejects a malformed parent-supplied PIN before touching the admin API", async () => {
    setRequester({ id: "parent-1" }, "parent");

    const result = await provisionChild({ displayName: "Ada", pin: "12" });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/pin/i);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("creates the child account, links it to the parent, and returns a code + PIN", async () => {
    setRequester({ id: "parent-1" }, "parent");

    const result = await provisionChild({ displayName: "Ada", yearLevel: 3 });

    expect(result.ok).toBe(true);
    expect(result.loginCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(result.pin).toMatch(/^\d{6}$/);

    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    const call = mockCreateUser.mock.calls[0][0];
    expect(call.email).toBe(buildAliasEmail(normalizeLoginCode(result.loginCode!)));
    expect(call.password).toBe(result.pin);
    expect(call.user_metadata).toEqual({ display_name: "Ada", role: "student" });

    expect(mockParentChildrenInsert).toHaveBeenCalledWith({
      parent_id: "parent-1",
      child_id: "child-1",
    });
  });

  it("uses the parent-supplied PIN instead of generating one", async () => {
    setRequester({ id: "parent-1" }, "parent");

    const result = await provisionChild({ displayName: "Ada", pin: "424242" });

    expect(result.ok).toBe(true);
    expect(result.pin).toBe("424242");
    expect(mockCreateUser.mock.calls[0][0].password).toBe("424242");
  });

  it("reports a clean failure if the parent_children link fails", async () => {
    setRequester({ id: "parent-1" }, "parent");
    mockParentChildrenInsert.mockResolvedValueOnce({ error: { message: "boom" } });

    const result = await provisionChild({ displayName: "Ada" });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/could not be linked/i);
  });
});
