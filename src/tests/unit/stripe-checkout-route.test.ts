import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockProfileSingle,
        }),
      }),
    }),
  })),
}));

vi.mock("@/lib/stripe/config", () => ({
  isStripeConfigured: true,
  BILLING_PLANS: ["family_monthly", "family_annual", "individual_monthly", "individual_annual"],
  priceIdForPlan: (plan: string) => {
    if (plan === "family_monthly") return "price_test_monthly";
    if (plan === "family_annual") return "price_test_annual";
    if (plan === "individual_monthly") return "price_test_ind_monthly";
    if (plan === "individual_annual") return "price_test_ind_annual";
    return null;
  },
}));

const mockMaybeSingle = vi.fn();
const mockUpdateEq = vi.fn(async () => ({ error: null }));
const mockFrom = vi.fn((table: string) => {
  if (table !== "subscriptions") throw new Error(`unexpected table: ${table}`);
  return {
    select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
    update: () => ({ eq: mockUpdateEq }),
  };
});
const mockAdminClient = { from: mockFrom };
vi.mock("@/lib/stripe/subscriptions-admin", () => ({
  createSubscriptionsAdminClient: vi.fn(() => mockAdminClient),
}));

const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: vi.fn(() => ({
    customers: { create: mockCustomersCreate },
    checkout: { sessions: { create: mockCheckoutSessionsCreate } },
  })),
}));

import { POST } from "@/app/api/stripe/checkout/route";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockProfileSingle.mockReset();
    mockMaybeSingle.mockReset();
    mockUpdateEq.mockClear();
    mockFrom.mockClear();
    mockCustomersCreate.mockReset();
    mockCheckoutSessionsCreate.mockReset();

    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1", email: "parent@example.com" } } });
    mockProfileSingle.mockResolvedValue({ data: { role: "parent" } });
    mockCheckoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session/test" });
  });

  it("rejects an unauthenticated caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(postRequest({ plan: "family_monthly" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("rejects a non-parent caller", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "student" } });

    const response = await POST(postRequest({ plan: "family_monthly" }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "parents_only" });
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
  });

  describe("duplicate checkout prevention (409 already_subscribed)", () => {
    const future = () => new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString();
    const past = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    it.each(["active", "past_due"])("refuses a second checkout while a %s paid subscription is in period", async (status) => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: "row-1",
          stripe_customer_id: "cus_1",
          stripe_subscription_id: "sub_1",
          status,
          current_period_end: future(),
        },
        error: null,
      });

      const response = await POST(postRequest({ plan: "family_annual" }));

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ error: "already_subscribed" });
      expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
      expect(mockCustomersCreate).not.toHaveBeenCalled();
    });

    it.each([
      ["canceled", future()],
      ["trialing", future()],
      ["active", past()],
    ])("still allows checkout for a %s row (period end %s)", async (status, periodEnd) => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: "row-1",
          stripe_customer_id: "cus_1",
          stripe_subscription_id: "sub_1",
          status,
          current_period_end: periodEnd,
        },
        error: null,
      });

      const response = await POST(postRequest({ plan: "family_monthly" }));

      expect(response.status).toBe(200);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledTimes(1);
    });

    it("allows a first checkout for a trial row that has no Stripe subscription yet", async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { id: "row-1", stripe_customer_id: null, stripe_subscription_id: null, status: "trialing", current_period_end: null },
        error: null,
      });
      mockCustomersCreate.mockResolvedValue({ id: "cus_new" });

      const response = await POST(postRequest({ plan: "individual_monthly" }));

      expect(response.status).toBe(200);
    });
  });

  it("rejects a malformed body", async () => {
    const response = await POST(postRequest({ plan: "not_a_real_plan" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("rejects a cross-site Origin — MM-SEC-03", async () => {
    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://evil.example", host: "localhost" },
        body: JSON.stringify({ plan: "family_monthly" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "origin_mismatch" });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("builds a checkout session for family_monthly at the correct price, creating a Stripe customer when none exists yet", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "sub-row-1", stripe_customer_id: null } });
    mockCustomersCreate.mockResolvedValue({ id: "cus_new_123" });

    const response = await POST(postRequest({ plan: "family_monthly" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: "https://checkout.stripe.com/session/test" });

    expect(mockCustomersCreate).toHaveBeenCalledTimes(1);
    expect(mockCustomersCreate.mock.calls[0][0]).toMatchObject({ metadata: { parent_id: "parent-1" } });

    // Never creates a duplicate customer: the new id is persisted via the service-role client.
    expect(mockUpdateEq).toHaveBeenCalledTimes(1);

    expect(mockCheckoutSessionsCreate).toHaveBeenCalledTimes(1);
    const sessionArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
    expect(sessionArgs.customer).toBe("cus_new_123");
    expect(sessionArgs.line_items).toEqual([{ price: "price_test_monthly", quantity: 1 }]);
  });

  it("builds a checkout session for family_annual at the correct price, reusing an existing Stripe customer", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "sub-row-1", stripe_customer_id: "cus_existing_456" } });

    const response = await POST(postRequest({ plan: "family_annual" }));

    expect(response.status).toBe(200);

    // No duplicate customer created for a parent who already has one.
    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockUpdateEq).not.toHaveBeenCalled();

    const sessionArgs = mockCheckoutSessionsCreate.mock.calls[0][0];
    expect(sessionArgs.customer).toBe("cus_existing_456");
    expect(sessionArgs.line_items).toEqual([{ price: "price_test_annual", quantity: 1 }]);
  });

  it.each([
    ["individual_monthly", "price_test_ind_monthly"],
    ["individual_annual", "price_test_ind_annual"],
  ])("builds a checkout session for %s at its own price", async (plan, price) => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "sub-1", stripe_customer_id: "cus_existing" }, error: null });

    const response = await POST(postRequest({ plan }));

    expect(response.status).toBe(200);
    const args = mockCheckoutSessionsCreate.mock.calls[0][0];
    expect(args.line_items).toEqual([{ price, quantity: 1 }]);
    expect(args.metadata).toMatchObject({ plan });
  });

  it("404s when the caller has no subscriptions row at all", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });

    const response = await POST(postRequest({ plan: "family_monthly" }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "subscription_not_found" });
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
  });
});
