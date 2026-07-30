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

  /*
   * The whole subscriptions table was missing from the deployed project for
   * a while (its migration had never been applied), and every parent saw
   * "Billing info unavailable right now" with nothing anywhere to say why —
   * diagnosing it meant querying the database by hand. A query failure has
   * to leave a trace on the server.
   */
  it("logs the underlying error server-side when the query fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    const error = { code: "42P01", message: 'relation "public.subscriptions" does not exist' };
    mockMaybeSingle.mockResolvedValue({ data: null, error });

    await getMySubscription();

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("getMySubscription"), error);
    consoleError.mockRestore();
  });

  /*
   * A parent with no subscriptions row has not hit an error — they simply
   * have no plan yet, which the UI shows as an empty state, not a failure.
   */
  it("returns a null subscription, not an error, when the parent has no row yet", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getMySubscription();

    expect(result).toEqual({ status: "ready", subscription: null });
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
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
