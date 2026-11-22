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

  it("customer.subscription.updated: writes the CURRENT Stripe state, not the possibly stale payload", async () => {
    const retrieve = vi.fn(async () => stripeSubscriptionFixture({ status: "past_due" }));
    const stripe = { subscriptions: { retrieve } } as never;

    const event = {
      id: "evt_3",
      type: "customer.subscription.updated",
      data: { object: stripeSubscriptionFixture({ status: "past_due" }) },
    } as never;

    await applySubscriptionEvent(admin as never, stripe, event);

    expect(retrieve).toHaveBeenCalledWith("sub_123");
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
    const stripe = {
      subscriptions: { retrieve: vi.fn(async () => stripeSubscriptionFixture({ status: "canceled" })) },
    } as never;

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
    const stripe = {
      subscriptions: { retrieve: vi.fn(async () => stripeSubscriptionFixture({ status: "unpaid" })) },
    } as never;

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

  it("invoice.payment_failed: resolves the subscription via invoice.parent.subscription_details and writes its current status", async () => {
    const stripe = {
      subscriptions: { retrieve: vi.fn(async () => stripeSubscriptionFixture({ status: "past_due" })) },
    } as never;

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
      p_patch: {
        status: "past_due",
        plan: "family_monthly",
        stripe_subscription_id: "sub_123",
        current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
      },
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
    const stripe = { subscriptions: { retrieve: vi.fn(async () => stripeSubscriptionFixture()) } } as never;
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
    const stripe = { subscriptions: { retrieve: vi.fn(async () => stripeSubscriptionFixture()) } } as never;
    const event = {
      id: "evt_9",
      type: "customer.subscription.updated",
      data: { object: stripeSubscriptionFixture() },
    } as never;

    const outcome = await applySubscriptionEvent(admin as never, stripe, event);

    expect(outcome).toBe("duplicate");
  });

  describe("out-of-order and delayed delivery", () => {
    it("a delayed customer.subscription.updated(active) after cancellation cannot resurrect the entitlement", async () => {
      const stripe = {
        subscriptions: { retrieve: vi.fn(async () => stripeSubscriptionFixture({ status: "canceled" })) },
      } as never;
      const stale = {
        id: "evt_late_active",
        type: "customer.subscription.updated",
        data: { object: stripeSubscriptionFixture({ status: "active" }) },
      } as never;

      await applySubscriptionEvent(admin as never, stripe, stale);

      expect(admin.rpc).toHaveBeenCalledWith(
        "apply_stripe_subscription_event",
        expect.objectContaining({ p_patch: expect.objectContaining({ status: "canceled" }) }),
      );
    });

    it("a delayed invoice.payment_failed after a successful retry cannot flip an active subscription to past_due", async () => {
      const stripe = {
        subscriptions: { retrieve: vi.fn(async () => stripeSubscriptionFixture({ status: "active" })) },
      } as never;
      const stale = {
        id: "evt_late_failed",
        type: "invoice.payment_failed",
        data: {
          object: { customer: "cus_123", parent: { subscription_details: { subscription: "sub_123" } } },
        },
      } as never;

      await applySubscriptionEvent(admin as never, stripe, stale);

      expect(admin.rpc).toHaveBeenCalledWith(
        "apply_stripe_subscription_event",
        expect.objectContaining({ p_patch: expect.objectContaining({ status: "active" }) }),
      );
    });

    it("falls back to the payload only when Stripe reports the subscription no longer exists", async () => {
      const stripe = {
        subscriptions: {
          retrieve: vi.fn(async () => {
            throw Object.assign(new Error("No such subscription"), { code: "resource_missing", statusCode: 404 });
          }),
        },
      } as never;
      const deleted = {
        id: "evt_gone",
        type: "customer.subscription.deleted",
        data: { object: stripeSubscriptionFixture({ status: "canceled" }) },
      } as never;

      await applySubscriptionEvent(admin as never, stripe, deleted);

      expect(admin.rpc).toHaveBeenCalledWith(
        "apply_stripe_subscription_event",
        expect.objectContaining({ p_patch: expect.objectContaining({ status: "canceled" }) }),
      );
    });

    it("a Stripe outage while re-syncing fails the delivery so Stripe retries, and never calls the RPC", async () => {
      const stripe = {
        subscriptions: {
          retrieve: vi.fn(async () => {
            throw Object.assign(new Error("connection reset"), { statusCode: 503 });
          }),
        },
      } as never;
      const event = {
        id: "evt_outage",
        type: "customer.subscription.updated",
        data: { object: stripeSubscriptionFixture() },
      } as never;

      await expect(applySubscriptionEvent(admin as never, stripe, event)).rejects.toThrow("connection reset");
      expect(admin.rpc).not.toHaveBeenCalled();
    });

    it("an unmapped price leaves the stored plan untouched instead of clearing it", async () => {
      const stripe = {
        subscriptions: {
          retrieve: vi.fn(async () =>
            stripeSubscriptionFixture({
              items: { data: [{ price: { id: "price_unknown" }, current_period_end: 1_800_000_000 }] },
            }),
          ),
        },
      } as never;
      const event = {
        id: "evt_unmapped",
        type: "customer.subscription.updated",
        data: { object: stripeSubscriptionFixture() },
      } as never;

      await applySubscriptionEvent(admin as never, stripe, event);

      const patch = admin.rpc.mock.calls[0]![1].p_patch as Record<string, unknown>;
      expect("plan" in patch).toBe(false);
    });

    it("a payment_failed for an invoice with no subscription writes nothing to subscriptions", async () => {
      const stripe = { subscriptions: { retrieve: vi.fn() } } as never;
      const event = {
        id: "evt_oneoff",
        type: "invoice.payment_failed",
        data: { object: { customer: "cus_123", parent: null } },
      } as never;

      await applySubscriptionEvent(admin as never, stripe, event);

      expect(admin.rpc).toHaveBeenCalledWith(
        "apply_stripe_subscription_event",
        expect.objectContaining({ p_patch: null }),
      );
    });
  });
});
