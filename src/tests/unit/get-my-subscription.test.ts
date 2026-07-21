import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
  })),
}));

import { getMySubscription } from "@/lib/billing/subscription";

describe("getMySubscription", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockMaybeSingle.mockReset();
  });

  it("returns status: error when there is no signed-in user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await getMySubscription();

    expect(result).toEqual({ status: "error" });
  });

  it("returns status: error when the query fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error("boom") });

    const result = await getMySubscription();

    expect(result).toEqual({ status: "error" });
  });

  it("returns a null subscription when the parent has no row yet", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getMySubscription();

    expect(result).toEqual({ status: "ready", subscription: null });
  });

  it("maps a trialing row with an unexpired trial_end to hasAccess: true", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    const trialEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    mockMaybeSingle.mockResolvedValue({
      data: {
        status: "trialing",
        plan: null,
        trial_end: trialEnd,
        current_period_end: null,
        seats: 3,
      },
      error: null,
    });

    const result = await getMySubscription();

    expect(result).toEqual({
      status: "ready",
      subscription: {
        status: "trialing",
        plan: null,
        trialEnd,
        currentPeriodEnd: null,
        seats: 3,
        hasAccess: true,
      },
    });
  });

  it("maps a trial_expired row to hasAccess: false", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    const trialEnd = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    mockMaybeSingle.mockResolvedValue({
      data: {
        status: "trial_expired",
        plan: null,
        trial_end: trialEnd,
        current_period_end: null,
        seats: 3,
      },
      error: null,
    });

    const result = await getMySubscription();

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.subscription?.hasAccess).toBe(false);
    }
  });

  it("maps an active row with a future current_period_end to hasAccess: true", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    const periodEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    mockMaybeSingle.mockResolvedValue({
      data: {
        status: "active",
        plan: "family_monthly",
        trial_end: null,
        current_period_end: periodEnd,
        seats: 3,
      },
      error: null,
    });

    const result = await getMySubscription();

    expect(result).toEqual({
      status: "ready",
      subscription: {
        status: "active",
        plan: "family_monthly",
        trialEnd: null,
        currentPeriodEnd: periodEnd,
        seats: 3,
        hasAccess: true,
      },
    });
  });
});
