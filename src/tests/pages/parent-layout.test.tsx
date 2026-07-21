import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockRpc = vi.fn();
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
    rpc: mockRpc,
  })),
}));

import ParentLayout from "@/app/parent/layout";

/** Next's redirect() throws; the destination is encoded in error.digest. */
function redirectPath(error: unknown): string {
  const digest = (error as { digest?: string } | null)?.digest ?? "";
  return digest.split(";").slice(2, -2).join(";");
}

function setSession(user: { id: string } | null, role: string | null) {
  mockGetUser.mockResolvedValue({ data: { user } });
  mockSingle.mockResolvedValue({ data: role ? { role } : null });
}

describe("parent layout auth gate", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSingle.mockReset();
    mockRpc.mockReset();
    delete process.env.BILLING_ENFORCEMENT_ENABLED;
  });

  it("redirects a signed-out visitor to sign-in, never touching billing", async () => {
    process.env.BILLING_ENFORCEMENT_ENABLED = "true";
    setSession(null, null);
    const error = await ParentLayout({ children: <div /> }).catch((e: unknown) => e);
    expect(redirectPath(error)).toBe("/sign-in?next=%2Fparent");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("redirects a wrong-role visitor to their own home", async () => {
    setSession({ id: "u1" }, "student");
    const error = await ParentLayout({ children: <div /> }).catch((e: unknown) => e);
    expect(redirectPath(error)).toBe("/student");
  });

  it("renders children for a signed-in parent", async () => {
    setSession({ id: "u1" }, "parent");
    const children = <div data-testid="child" />;
    const result = await ParentLayout({ children });
    expect(result).toBe(children);
  });

  describe("billing gate (BILLING_ENFORCEMENT_ENABLED)", () => {
    it("flag off: never checks billing, renders as today (no-op)", async () => {
      setSession({ id: "u1" }, "parent");
      const children = <div data-testid="child" />;

      const result = await ParentLayout({ children });

      expect(result).toBe(children);
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("flag on: an active/trialing parent passes through", async () => {
      process.env.BILLING_ENFORCEMENT_ENABLED = "true";
      setSession({ id: "u1" }, "parent");
      mockRpc.mockResolvedValue({ data: true });
      const children = <div data-testid="child" />;

      const result = await ParentLayout({ children });

      expect(result).toBe(children);
      expect(mockRpc).toHaveBeenCalledWith("current_parent_has_access");
    });

    it("flag on: a no-access parent redirects to /billing", async () => {
      process.env.BILLING_ENFORCEMENT_ENABLED = "true";
      setSession({ id: "u1" }, "parent");
      mockRpc.mockResolvedValue({ data: false });

      const error = await ParentLayout({ children: <div /> }).catch((e: unknown) => e);

      expect(redirectPath(error)).toBe("/billing");
    });
  });
});
