import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const mockGetUser = vi.fn();
const mockProfileSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: () => ({ select: () => ({ eq: () => ({ single: mockProfileSingle }) }) }),
  })),
}));

vi.mock("@/lib/stripe/config", () => ({ isStripeConfigured: true }));

const mockMaybeSingle = vi.fn();
const mockAdminClient = {
  from: (table: string) => {
    if (table !== "subscriptions") throw new Error(`unexpected table: ${table}`);
    return { select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }) };
  },
};
vi.mock("@/lib/stripe/subscriptions-admin", () => ({
  createSubscriptionsAdminClient: vi.fn(() => mockAdminClient),
}));

const mockPortalSessionsCreate = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: vi.fn(() => ({
    billingPortal: { sessions: { create: mockPortalSessionsCreate } },
  })),
}));

import { POST } from "@/app/api/stripe/portal/route";

function postRequest(): Request {
  return new Request("http://localhost/api/stripe/portal", {
    method: "POST",
    headers: { origin: "http://localhost", host: "localhost" },
  });
}

describe("POST /api/stripe/portal", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockProfileSingle.mockReset();
    mockMaybeSingle.mockReset();
    mockPortalSessionsCreate.mockReset();

    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockProfileSingle.mockResolvedValue({ data: { role: "parent" } });
    mockPortalSessionsCreate.mockResolvedValue({ url: "https://billing.stripe.com/session/test" });
  });

  it("rejects an unauthenticated caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(mockPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("rejects a non-parent caller", async () => {
    mockProfileSingle.mockResolvedValue({ data: { role: "teacher" } });

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(mockPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("rejects a cross-site Origin — MM-SEC-03", async () => {
    const response = await POST(
      new Request("http://localhost/api/stripe/portal", {
        method: "POST",
        headers: { origin: "https://evil.example", host: "localhost" },
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "origin_mismatch" });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("404s a parent with no Stripe customer yet", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { stripe_customer_id: null } });

    const response = await POST(postRequest());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "no_stripe_customer" });
    expect(mockPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("returns a portal session URL scoped to the parent's own Stripe customer", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { stripe_customer_id: "cus_existing_789" } });

    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: "https://billing.stripe.com/session/test" });
    expect(mockPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing_789" }),
    );
  });
});
