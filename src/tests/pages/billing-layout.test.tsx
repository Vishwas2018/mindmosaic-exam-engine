import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

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

import BillingLayout from "@/app/billing/layout";

/** Next's redirect() throws; the destination is encoded in error.digest. */
function redirectPath(error: unknown): string {
  const digest = (error as { digest?: string } | null)?.digest ?? "";
  return digest.split(";").slice(2, -2).join(";");
}

function setSession(user: { id: string } | null, role: string | null) {
  mockGetUser.mockResolvedValue({ data: { user } });
  mockSingle.mockResolvedValue({ data: role ? { role } : null });
}

describe("billing layout gate", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSingle.mockReset();
  });

  it("renders children for a signed-out guest — the public homepage subscribe CTA must keep working", async () => {
    setSession(null, null);
    const children = <div data-testid="child" />;
    const result = await BillingLayout({ children });
    expect(result).toBe(children);
  });

  it("renders children for a signed-in student — requireActiveSubscription's dormant redirect target must not loop", async () => {
    setSession({ id: "u1" }, "student");
    const children = <div data-testid="child" />;
    const result = await BillingLayout({ children });
    expect(result).toBe(children);
  });

  it("renders children for a signed-in parent", async () => {
    setSession({ id: "u1" }, "parent");
    const children = <div data-testid="child" />;
    const result = await BillingLayout({ children });
    expect(result).toBe(children);
  });

  it("redirects a signed-in teacher to their own home", async () => {
    setSession({ id: "u1" }, "teacher");
    const error = await BillingLayout({ children: <div /> }).catch((e: unknown) => e);
    expect(redirectPath(error)).toBe("/teacher");
  });

  it("redirects a signed-in admin to their own home", async () => {
    setSession({ id: "u1" }, "admin");
    const error = await BillingLayout({ children: <div /> }).catch((e: unknown) => e);
    expect(redirectPath(error)).toBe("/admin");
  });
});
