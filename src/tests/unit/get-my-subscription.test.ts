import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }) }),
  })),
}));

import { getMySubscription } from "@/features/billing/get-my-subscription";

describe("getMySubscription", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockMaybeSingle.mockReset();
  });

  it("returns null when nobody is signed in", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await getMySubscription();

    expect(result).toBeNull();
  });

  it("returns null when the caller has no subscriptions row", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockMaybeSingle.mockResolvedValue({ data: null });

    const result = await getMySubscription();

    expect(result).toBeNull();
  });

  it("hasAccess is true for an unexpired trial", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockMaybeSingle.mockResolvedValue({
      data: {
        status: "trialing",
        plan: null,
        trial_end: new Date(Date.now() + 86_400_000).toISOString(),
        current_period_end: null,
        seats: 3,
      },
    });

    const result = await getMySubscription();

    expect(result?.hasAccess).toBe(true);
    expect(result?.status).toBe("trialing");
  });

  it("hasAccess is false for an expired trial (mirrors has_active_access's trial_end > now check)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockMaybeSingle.mockResolvedValue({
      data: {
        status: "trial_expired",
        plan: null,
        trial_end: new Date(Date.now() - 86_400_000).toISOString(),
        current_period_end: null,
        seats: 3,
      },
    });

    const result = await getMySubscription();

    expect(result?.hasAccess).toBe(false);
  });

  it("hasAccess is true for an active subscription with a future current_period_end", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockMaybeSingle.mockResolvedValue({
      data: {
        status: "active",
        plan: "family_monthly",
        trial_end: null,
        current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        seats: 3,
      },
    });

    const result = await getMySubscription();

    expect(result?.hasAccess).toBe(true);
    expect(result?.plan).toBe("family_monthly");
  });

  it("hasAccess is true for past_due within the dunning window (matches has_active_access's status in ('active','past_due'))", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockMaybeSingle.mockResolvedValue({
      data: {
        status: "past_due",
        plan: "family_annual",
        trial_end: null,
        current_period_end: new Date(Date.now() + 5 * 86_400_000).toISOString(),
        seats: 3,
      },
    });

    const result = await getMySubscription();

    expect(result?.hasAccess).toBe(true);
  });

  it("hasAccess is false for canceled regardless of a stale current_period_end", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockMaybeSingle.mockResolvedValue({
      data: {
        status: "canceled",
        plan: "family_monthly",
        trial_end: null,
        current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        seats: 3,
      },
    });

    const result = await getMySubscription();

    expect(result?.hasAccess).toBe(false);
  });
});
