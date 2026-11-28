import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { studentHasFullAccess } from "@/features/billing/student-access";

function client(parents: string[], accessByParent: Record<string, boolean>) {
  const rpc = vi.fn(async (_fn: string, args: { p: string }) => ({ data: accessByParent[args.p] ?? false }));
  const supabase = {
    from: () => ({
      select: () => ({ eq: async () => ({ data: parents.map((parent_id) => ({ parent_id })) }) }),
    }),
    rpc,
  };
  return { supabase: supabase as never, rpc };
}

afterEach(() => {
  delete process.env.BILLING_ENFORCEMENT_ENABLED;
});

describe("studentHasFullAccess", () => {
  it("gives every student full access while enforcement is off (the default)", async () => {
    const { supabase, rpc } = client(["p1"], { p1: false });
    await expect(studentHasFullAccess(supabase, "s1")).resolves.toBe(true);
    expect(rpc).not.toHaveBeenCalled();
  });

  describe("with enforcement on", () => {
    it("is true when any linked parent has access", async () => {
      process.env.BILLING_ENFORCEMENT_ENABLED = "true";
      const { supabase } = client(["p1", "p2"], { p1: false, p2: true });
      await expect(studentHasFullAccess(supabase, "s1")).resolves.toBe(true);
    });

    it("is false when no linked parent has access", async () => {
      process.env.BILLING_ENFORCEMENT_ENABLED = "true";
      const { supabase } = client(["p1"], { p1: false });
      await expect(studentHasFullAccess(supabase, "s1")).resolves.toBe(false);
    });

    it("is false for a student with no linked parent", async () => {
      process.env.BILLING_ENFORCEMENT_ENABLED = "true";
      const { supabase } = client([], {});
      await expect(studentHasFullAccess(supabase, "s1")).resolves.toBe(false);
    });
  });
});
