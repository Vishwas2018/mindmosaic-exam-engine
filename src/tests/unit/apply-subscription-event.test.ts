import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/stripe/config", () => ({
  planForPriceId: (priceId: string | null) => {
    if (priceId === "price_test_monthly") return "family_monthly";
    if (priceId === "price_test_annual") return "family_annual";
    return null;
  },
}));

import { applySubscriptionEvent, SubscriptionEventApplyError } from "@/lib/stripe/apply-subscription-event";

/** Fakes the single admin.rpc("apply_stripe_subscription_event", ...) call the route now makes. */
function fakeAdmin() {
  const rpc = vi.fn<(fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>>(
    async () => ({ data: { duplicate: false, subscription_row_id: "row-1" }, error: null }),
  );
  return { rpc };
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

  it("checkout.session.completed: retrieves the subscription and calls the RPC with the resolved patch", async () => {
    const retrieve = vi.fn(async () => stripeSubscriptionFixture());
    const stripe = { subscriptions: { retrieve } } as never;

    const event = {
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { customer: "cus_123", subscription: "sub_123" } },
    } as never;

    const outcome = await applySubscriptionEvent(admin as never, stripe, event);

    expect(retrieve).toHaveBeenCalledWith("sub_123");
    expect(admin.rpc).toHaveBeenCalledWith("apply_stripe_subscription_event", {
      p_stripe_event_id: "evt_1",
      p_type: "checkout.session.completed",
      p_payload: event,
      p_customer_id: "cus_123",
      p_subscription_id: "sub_123",
      p_patch: {
        status: "active",
        plan: "family_monthly",
        stripe_subscription_id: "sub_123",
        current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
      },
    });
    expect(outcome).toBe("applied");
  });

  it("checkout.session.completed: propagates a Stripe retrieval failure without ever calling the RPC", async () => {
    const retrieve = vi.fn(async () => {
      throw new Error("stripe api unreachable");
    });
    const stripe = { subscriptions: { retrieve } } as never;

    const event = {
      id: "evt_2",
      type: "checkout.session.completed",
      data: { object: { customer: "cus_123", subscription: "sub_123" } },
    } as never;

    await expect(applySubscriptionEvent(admin as never, stripe, event)).rejects.toThrow(
      "stripe api unreachable",
    );
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("customer.subscription.updated: maps status/plan/period directly from the event payload, no Stripe API call", async () => {
    const retrieve = vi.fn();
    const stripe = { subscriptions: { retrieve } } as never;

    const event = {
      id: "evt_3",
      type: "customer.subscription.updated",
      data: { object: stripeSubscriptionFixture({ status: "past_due" }) },
    } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(retrieve).not.toHaveBeenCalled();
    expect(admin.rpc).toHaveBeenCalledWith("apply_stripe_subscription_event", {
      p_stripe_event_id: "evt_3",
      p_type: "customer.subscription.updated",
      p_payload: event,
      p_customer_id: "cus_123",
      p_subscription_id: "sub_123",
      p_patch: {
        status: "past_due",
        plan: "family_monthly",
        stripe_subscription_id: "sub_123",
        current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
      },
    });
  });

  it("customer.subscription.deleted: maps Stripe's 'canceled' status onto our 'canceled' status", async () => {
    const stripe = { subscriptions: { retrieve: vi.fn() } } as never;

    const event = {
      id: "evt_4",
      type: "customer.subscription.deleted",
      data: { object: stripeSubscriptionFixture({ status: "canceled" }) },
    } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(admin.rpc).toHaveBeenCalledWith(
      "apply_stripe_subscription_event",
      expect.objectContaining({ p_patch: expect.objectContaining({ status: "canceled" }) }),
    );
  });

  it("customer.subscription.updated: maps Stripe's 'unpaid' status onto our 'past_due' (no 'unpaid' value in our check constraint)", async () => {
    const stripe = { subscriptions: { retrieve: vi.fn() } } as never;

    const event = {
      id: "evt_5",
      type: "customer.subscription.updated",
      data: { object: stripeSubscriptionFixture({ status: "unpaid" }) },
    } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(admin.rpc).toHaveBeenCalledWith(
      "apply_stripe_subscription_event",
      expect.objectContaining({ p_patch: expect.objectContaining({ status: "past_due" }) }),
    );
  });

  it("invoice.payment_failed: sets status to past_due only, resolved via invoice.parent.subscription_details", async () => {
    const stripe = { subscriptions: { retrieve: vi.fn() } } as never;

    const event = {
      id: "evt_6",
      type: "invoice.payment_failed",
      data: {
        object: {
          customer: "cus_123",
          parent: { subscription_details: { subscription: "sub_123" } },
        },
      },
    } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(admin.rpc).toHaveBeenCalledWith("apply_stripe_subscription_event", {
      p_stripe_event_id: "evt_6",
      p_type: "invoice.payment_failed",
      p_payload: event,
      p_customer_id: "cus_123",
      p_subscription_id: "sub_123",
      p_patch: { status: "past_due" },
    });
  });

  it("ignores event types this batch doesn't handle, but still calls the RPC with a null patch so the event is recorded", async () => {
    const stripe = { subscriptions: { retrieve: vi.fn() } } as never;
    const event = { id: "evt_7", type: "customer.created", data: { object: {} } } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(admin.rpc).toHaveBeenCalledWith("apply_stripe_subscription_event", {
      p_stripe_event_id: "evt_7",
      p_type: "customer.created",
      p_payload: event,
      p_customer_id: null,
      p_subscription_id: null,
      p_patch: null,
    });
  });

  it("wraps an RPC-side error (e.g. the injected entitlement-update failure) as SubscriptionEventApplyError, never swallowing it", async () => {
    admin.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "duplicate key value violates unique constraint" },
    });
    const stripe = { subscriptions: { retrieve: vi.fn() } } as never;
    const event = {
      id: "evt_8",
      type: "customer.subscription.updated",
      data: { object: stripeSubscriptionFixture() },
    } as never;

    await expect(applySubscriptionEvent(admin as never, stripe, event)).rejects.toBeInstanceOf(
      SubscriptionEventApplyError,
    );
  });

  it("reports a duplicate outcome (idempotent replay) without treating it as an error", async () => {
    admin.rpc.mockResolvedValueOnce({
      data: { duplicate: true, subscription_row_id: null },
      error: null,
    });
    const stripe = { subscriptions: { retrieve: vi.fn() } } as never;
    const event = {
      id: "evt_9",
      type: "customer.subscription.updated",
      data: { object: stripeSubscriptionFixture() },
    } as never;

    const outcome = await applySubscriptionEvent(admin as never, stripe, event);

    expect(outcome).toBe("duplicate");
  });
});
