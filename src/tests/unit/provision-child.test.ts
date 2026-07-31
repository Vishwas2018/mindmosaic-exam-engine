import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
/** parent_children rows for the requester, used by the duplicate-name check. */
const mockChildLinks = vi.fn<() => Promise<{ data: { child_id: string }[] | null }>>();
/** The linked children's profiles, looked up by the same check. */
const mockChildProfiles = vi.fn<() => Promise<{ data: { display_name: string | null }[] | null }>>();

/*
 * Table-aware so the duplicate-name check is genuinely exercised: it reads
 * parent_children (select -> eq, no .single()) and then profiles
 * (select -> in), while the role lookup reads profiles with .single().
 */
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "parent_children") {
        return { select: () => ({ eq: mockChildLinks }) };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({ single: mockSingle }),
            in: mockChildProfiles,
          }),
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
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

/** Names the requesting parent already has linked children for. */
function setExistingChildren(names: (string | null)[]) {
  mockChildLinks.mockResolvedValue({
    data: names.map((_, i) => ({ child_id: `child-${i}` })),
  });
  mockChildProfiles.mockResolvedValue({ data: names.map((display_name) => ({ display_name })) });
}

describe("provisionChild", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSingle.mockReset();
    mockChildLinks.mockReset();
    mockChildProfiles.mockReset();
    setExistingChildren([]);
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

  it("rejects a malformed parent-supplied PIN before touching the admin API, with a specific message", async () => {
    setRequester({ id: "parent-1" }, "parent");

    const result = await provisionChild({ displayName: "Ada", pin: "12" });

    expect(result.ok).toBe(false);
    expect(result.message).toBe("PIN must be exactly 6 digits.");
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

  /*
   * Nothing here used to be idempotent: every call minted a fresh
   * auth.users row with its own login code, so a parent who submitted the
   * form twice ended up with two same-named children and no way to tell
   * which credentials belonged to which. The real case had the two
   * submissions five minutes apart, so a client-side in-flight guard could
   * not have caught it — the check has to be here, across requests.
   */
  it("stops a name the parent already has, and creates nothing", async () => {
    setRequester({ id: "parent-1" }, "parent");
    setExistingChildren(["Child A", "Child B"]);

    const result = await provisionChild({ displayName: "Child A", yearLevel: 3 });

    expect(result.ok).toBe(false);
    expect(result.duplicate).toBe(true);
    expect(result.message).toMatch(/already have a child called Child A/i);
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockParentChildrenInsert).not.toHaveBeenCalled();
  });

  it.each(["child a", "  Child A  ", "CHILD A"])(
    "treats %j as the same name as an existing child",
    async (typed) => {
      setRequester({ id: "parent-1" }, "parent");
      setExistingChildren(["Child A"]);

      const result = await provisionChild({ displayName: typed });

      expect(result.duplicate).toBe(true);
      expect(mockCreateUser).not.toHaveBeenCalled();
      // Named as the child is actually stored, not as it was just typed —
      // "you already have a child called child a" reads like the form
      // arguing with itself.
      expect(result.message).toContain("Child A");
    },
  );

  /* Two children in one family really can share a first name — it asks, it doesn't refuse. */
  it("creates the child once the parent confirms the duplicate", async () => {
    setRequester({ id: "parent-1" }, "parent");
    setExistingChildren(["Child A"]);

    const result = await provisionChild({ displayName: "Child A", allowDuplicate: true });

    expect(result.ok).toBe(true);
    expect(result.duplicate).toBeUndefined();
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
  });

  it("lets a different name through without a prompt", async () => {
    setRequester({ id: "parent-1" }, "parent");
    setExistingChildren(["Child A"]);

    const result = await provisionChild({ displayName: "Child B" });

    expect(result.ok).toBe(true);
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
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
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await provisionChild({ displayName: "Ada" });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/could not be linked/i);
    // Raw Supabase error is logged server-side for diagnosability, even
    // though it's deliberately not echoed back to the client.
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("parent_children insert failed"),
      { message: "boom" },
    );
    errorSpy.mockRestore();
  });

  it("surfaces a PIN-specific message when Supabase's own password check rejects it, and logs the raw error", async () => {
    setRequester({ id: "parent-1" }, "parent");
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Password should be at least 6 characters." },
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await provisionChild({ displayName: "Ada", pin: "424242" });

    expect(result.ok).toBe(false);
    expect(result.message).toBe("That PIN can't be used. Please choose a 6-digit PIN.");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("admin.auth.admin.createUser failed"),
      expect.objectContaining({ message: "Password should be at least 6 characters." }),
    );
    errorSpy.mockRestore();
  });

  it("falls back to a generic message for an unrecognised admin API failure, but still logs the raw error", async () => {
    setRequester({ id: "parent-1" }, "parent");
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Something unexpected happened." },
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await provisionChild({ displayName: "Ada" });

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Could not create the student account. Please try again.");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("admin.auth.admin.createUser failed"),
      expect.objectContaining({ message: "Something unexpected happened." }),
    );
    errorSpy.mockRestore();
  });
});
