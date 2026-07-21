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
  priceIdForPlan: (plan: string) => {
    if (plan === "family_monthly") return "price_test_monthly";
    if (plan === "family_annual") return "price_test_annual";
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
    headers: { "content-type": "application/json", origin: "http://localhost" },
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

  it("rejects a malformed body", async () => {
    const response = await POST(postRequest({ plan: "not_a_real_plan" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
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

  it("404s when the caller has no subscriptions row at all", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });

    const response = await POST(postRequest({ plan: "family_monthly" }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "subscription_not_found" });
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
  });
});
