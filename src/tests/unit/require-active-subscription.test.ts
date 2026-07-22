import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockRpc = vi.fn();
const mockParentChildrenEq = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: mockRpc,
    from: (table: string) => {
      if (table === "parent_children") {
        return { select: () => ({ eq: mockParentChildrenEq }) };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  })),
}));

import { requireActiveSubscription } from "@/features/billing/require-active-subscription";

/** Next's redirect() throws; the destination is encoded in error.digest. */
function redirectPath(error: unknown): string {
  const digest = (error as { digest?: string } | null)?.digest ?? "";
  return digest.split(";").slice(2, -2).join(";");
}

describe("requireActiveSubscription", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockParentChildrenEq.mockReset();
    delete process.env.BILLING_ENFORCEMENT_ENABLED;
  });

  describe("flag off (default)", () => {
    it("is a no-op for a parent with no access", async () => {
      mockRpc.mockResolvedValue({ data: false });

      await requireActiveSubscription("parent-1", "parent");

      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("is a no-op for a student with no linked parent", async () => {
      await requireActiveSubscription("student-1", "student");

      expect(mockRpc).not.toHaveBeenCalled();
      expect(mockParentChildrenEq).not.toHaveBeenCalled();
    });
  });

  describe("flag on", () => {
    beforeEach(() => {
      process.env.BILLING_ENFORCEMENT_ENABLED = "true";
    });

    it("passes a parent with active access", async () => {
      mockRpc.mockResolvedValue({ data: true });

      await requireActiveSubscription("parent-1", "parent");

      expect(mockRpc).toHaveBeenCalledWith("current_parent_has_access");
    });

    it("redirects a parent with no access to /billing", async () => {
      mockRpc.mockResolvedValue({ data: false });

      const error = await requireActiveSubscription("parent-1", "parent").catch(
        (e: unknown) => e,
      );

      expect(redirectPath(error)).toBe("/billing");
    });

    it("passes a student whose linked parent has active access", async () => {
      mockParentChildrenEq.mockResolvedValue({ data: [{ parent_id: "parent-1" }] });
      mockRpc.mockResolvedValue({ data: true });

      await requireActiveSubscription("student-1", "student");

      expect(mockRpc).toHaveBeenCalledWith("has_active_access", { p: "parent-1" });
    });

    it("passes a student when any linked parent has active access", async () => {
      mockParentChildrenEq.mockResolvedValue({
        data: [{ parent_id: "parent-1" }, { parent_id: "parent-2" }],
      });
      mockRpc.mockResolvedValueOnce({ data: false }).mockResolvedValueOnce({ data: true });

      await requireActiveSubscription("student-1", "student");

      expect(mockRpc).toHaveBeenCalledTimes(2);
    });

    it("redirects a student whose linked parent has no access to /billing", async () => {
      mockParentChildrenEq.mockResolvedValue({ data: [{ parent_id: "parent-1" }] });
      mockRpc.mockResolvedValue({ data: false });

      const error = await requireActiveSubscription("student-1", "student").catch(
        (e: unknown) => e,
      );

      expect(redirectPath(error)).toBe("/billing");
    });

    it("redirects a student with no linked parent to /billing", async () => {
      mockParentChildrenEq.mockResolvedValue({ data: [] });

      const error = await requireActiveSubscription("student-1", "student").catch(
        (e: unknown) => e,
      );

      expect(redirectPath(error)).toBe("/billing");
      expect(mockRpc).not.toHaveBeenCalled();
    });
  });
});
