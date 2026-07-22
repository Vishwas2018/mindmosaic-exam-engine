import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockRpc = vi.fn();
const mockParentChildrenEq = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "parent_children") {
        return { select: () => ({ eq: mockParentChildrenEq }) };
      }
      return {
        select: () => ({
          eq: () => ({
            single: mockSingle,
          }),
        }),
      };
    },
    rpc: mockRpc,
  })),
}));

import StudentLayout from "@/app/student/layout";

/** Next's redirect() throws; the destination is encoded in error.digest. */
function redirectPath(error: unknown): string {
  const digest = (error as { digest?: string } | null)?.digest ?? "";
  return digest.split(";").slice(2, -2).join(";");
}

function setSession(user: { id: string } | null, role: string | null) {
  mockGetUser.mockResolvedValue({ data: { user } });
  mockSingle.mockResolvedValue({ data: role ? { role } : null });
}

describe("student layout auth gate", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSingle.mockReset();
    mockRpc.mockReset();
    mockParentChildrenEq.mockReset();
    mockParentChildrenEq.mockResolvedValue({ data: [] });
    delete process.env.BILLING_ENFORCEMENT_ENABLED;
  });

  it("redirects a signed-out visitor to sign-in, never touching billing", async () => {
    process.env.BILLING_ENFORCEMENT_ENABLED = "true";
    setSession(null, null);
    const error = await StudentLayout({ children: <div /> }).catch((e: unknown) => e);
    expect(redirectPath(error)).toBe("/sign-in?next=%2Fstudent");
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockParentChildrenEq).not.toHaveBeenCalled();
  });

  it("redirects a wrong-role visitor to their own home", async () => {
    setSession({ id: "u1" }, "admin");
    const error = await StudentLayout({ children: <div /> }).catch((e: unknown) => e);
    expect(redirectPath(error)).toBe("/admin");
  });

  it("renders children for a signed-in student", async () => {
    setSession({ id: "u1" }, "student");
    const children = <div data-testid="child" />;
    const result = await StudentLayout({ children });
    expect(result).toBe(children);
  });

  describe("billing gate (BILLING_ENFORCEMENT_ENABLED)", () => {
    it("flag off: never checks billing, renders as today (no-op)", async () => {
      setSession({ id: "u1" }, "student");
      const children = <div data-testid="child" />;

      const result = await StudentLayout({ children });

      expect(result).toBe(children);
      expect(mockRpc).not.toHaveBeenCalled();
      expect(mockParentChildrenEq).not.toHaveBeenCalled();
    });

    it("flag on: a student whose linked parent has access passes through", async () => {
      process.env.BILLING_ENFORCEMENT_ENABLED = "true";
      setSession({ id: "u1" }, "student");
      mockParentChildrenEq.mockResolvedValue({ data: [{ parent_id: "parent-1" }] });
      mockRpc.mockResolvedValue({ data: true });
      const children = <div data-testid="child" />;

      const result = await StudentLayout({ children });

      expect(result).toBe(children);
      expect(mockRpc).toHaveBeenCalledWith("has_active_access", { p: "parent-1" });
    });

    it("flag on: a student whose linked parent has no access redirects to /billing", async () => {
      process.env.BILLING_ENFORCEMENT_ENABLED = "true";
      setSession({ id: "u1" }, "student");
      mockParentChildrenEq.mockResolvedValue({ data: [{ parent_id: "parent-1" }] });
      mockRpc.mockResolvedValue({ data: false });

      const error = await StudentLayout({ children: <div /> }).catch((e: unknown) => e);

      expect(redirectPath(error)).toBe("/billing");
    });
  });
});
