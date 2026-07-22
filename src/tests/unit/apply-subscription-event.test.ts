import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/stripe/config", () => ({
  planForPriceId: (priceId: string | null) => {
    if (priceId === "price_test_monthly") return "family_monthly";
    if (priceId === "price_test_annual") return "family_annual";
    return null;
  },
}));

import { applySubscriptionEvent } from "@/lib/stripe/apply-subscription-event";

function fakeAdmin() {
  const maybeSingle = vi.fn();
  const update = vi.fn<(id: string, patch: Record<string, unknown>) => Promise<{ error: null }>>(
    async () => ({ error: null }),
  );
  const from = vi.fn((table: string) => {
    if (table !== "subscriptions") throw new Error(`unexpected table: ${table}`);
    return {
      select: () => ({ eq: () => ({ maybeSingle }) }),
      update: (patch: Record<string, unknown>) => ({
        eq: (_column: string, id: string) => update(id, patch),
      }),
    };
  });
  return { from, maybeSingle, update };
}

function stripeSubscriptionFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "sub_123",
    customer: "cus_123",
    status: "active",
    items: {
      data: [
        {
          price: { id: "price_test_monthly" },
          current_period_end: 1_800_000_000,
        },
      ],
    },
    ...overrides,
  };
}

describe("applySubscriptionEvent", () => {
  let admin: ReturnType<typeof fakeAdmin>;

  beforeEach(() => {
    admin = fakeAdmin();
  });

  it("checkout.session.completed: retrieves the subscription and patches the matching row", async () => {
    admin.maybeSingle.mockResolvedValue({ data: { id: "row-1" } });
    const retrieve = vi.fn(async () => stripeSubscriptionFixture());
    const stripe = { subscriptions: { retrieve } } as never;

    const event = {
      type: "checkout.session.completed",
      data: { object: { customer: "cus_123", subscription: "sub_123" } },
    } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(retrieve).toHaveBeenCalledWith("sub_123");
    expect(admin.update).toHaveBeenCalledWith("row-1", {
      status: "active",
      plan: "family_monthly",
      stripe_subscription_id: "sub_123",
      current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
    });
  });

  it("checkout.session.completed: no-ops (does not throw) when no subscriptions row matches", async () => {
    admin.maybeSingle.mockResolvedValue({ data: null });
    const retrieve = vi.fn(async () => stripeSubscriptionFixture());
    const stripe = { subscriptions: { retrieve } } as never;

    const event = {
      type: "checkout.session.completed",
      data: { object: { customer: "cus_unknown", subscription: "sub_unknown" } },
    } as never;

    await expect(applySubscriptionEvent(admin as never, stripe, event)).resolves.toBeUndefined();
    expect(admin.update).not.toHaveBeenCalled();
  });

  it("customer.subscription.updated: maps status/plan/period directly from the event payload, no Stripe API call", async () => {
    admin.maybeSingle.mockResolvedValue({ data: { id: "row-2" } });
    const retrieve = vi.fn();
    const stripe = { subscriptions: { retrieve } } as never;

    const event = {
      type: "customer.subscription.updated",
      data: { object: stripeSubscriptionFixture({ status: "past_due" }) },
    } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(retrieve).not.toHaveBeenCalled();
    expect(admin.update).toHaveBeenCalledWith("row-2", {
      status: "past_due",
      plan: "family_monthly",
      stripe_subscription_id: "sub_123",
      current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
    });
  });

  it("customer.subscription.deleted: maps Stripe's 'canceled' status onto our 'canceled' status", async () => {
    admin.maybeSingle.mockResolvedValue({ data: { id: "row-3" } });
    const stripe = { subscriptions: { retrieve: vi.fn() } } as never;

    const event = {
      type: "customer.subscription.deleted",
      data: { object: stripeSubscriptionFixture({ status: "canceled" }) },
    } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(admin.update).toHaveBeenCalledWith(
      "row-3",
      expect.objectContaining({ status: "canceled" }),
    );
  });

  it("customer.subscription.updated: maps Stripe's 'unpaid' status onto our 'past_due' (no 'unpaid' value in our check constraint)", async () => {
    admin.maybeSingle.mockResolvedValue({ data: { id: "row-4" } });
    const stripe = { subscriptions: { retrieve: vi.fn() } } as never;

    const event = {
      type: "customer.subscription.updated",
      data: { object: stripeSubscriptionFixture({ status: "unpaid" }) },
    } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(admin.update).toHaveBeenCalledWith(
      "row-4",
      expect.objectContaining({ status: "past_due" }),
    );
  });

  it("invoice.payment_failed: sets status to past_due only, resolved via invoice.parent.subscription_details", async () => {
    admin.maybeSingle.mockResolvedValue({ data: { id: "row-5" } });
    const stripe = { subscriptions: { retrieve: vi.fn() } } as never;

    const event = {
      type: "invoice.payment_failed",
      data: {
        object: {
          customer: "cus_123",
          parent: { subscription_details: { subscription: "sub_123" } },
        },
      },
    } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(admin.update).toHaveBeenCalledWith("row-5", { status: "past_due" });
  });

  it("ignores event types this batch doesn't handle", async () => {
    const stripe = { subscriptions: { retrieve: vi.fn() } } as never;
    const event = { type: "customer.created", data: { object: {} } } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(admin.from).not.toHaveBeenCalled();
  });
});
