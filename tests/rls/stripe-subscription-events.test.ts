/**
 * Coverage for the MM-SEC-01 fix (supabase/migrations/
 * 20260723090000_stripe_webhook_transactional_apply.sql): calls
 * public.apply_stripe_subscription_event directly against a real local
 * Postgres to prove the properties a mocked unit test can't — that record
 * + apply + mark-complete really is one transaction, that a replay is
 * genuinely idempotent, and that only service_role may call the function at
 * all.
 *
 * Each test seeds its own local parent/subscription fixture (same pattern
 * as subscriptions.test.ts) as the unrestricted `postgres` role — which,
 * like every other test in this suite, bypasses RLS *and* function-execute
 * grants, so the atomicity/idempotency tests below call the RPC directly
 * regardless of the service_role-only grant. The grant itself is proven
 * separately, by impersonating `authenticated`/`anon`/`service_role`.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated } from "./fixtures";

const PARENT_F = "00000000-0000-0000-0000-00000000003a";

let client: Client;

async function insertParent(id: string, email: string): Promise<void> {
  await client.query(
    `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)`,
    [id, email, JSON.stringify({ role: "parent" })],
  );
}

async function linkCustomer(parentId: string, customerId: string): Promise<void> {
  await client.query(`update public.subscriptions set stripe_customer_id = $1 where parent_id = $2`, [
    customerId,
    parentId,
  ]);
}

async function subscriptionRow(customerId: string) {
  const result = await client.query(
    `select status, plan, stripe_subscription_id, current_period_end, updated_at
     from public.subscriptions where stripe_customer_id = $1`,
    [customerId],
  );
  return result.rows[0] ?? null;
}

async function eventRow(stripeEventId: string) {
  const result = await client.query(
    `select stripe_event_id, type, processed_at from public.subscription_events where stripe_event_id = $1`,
    [stripeEventId],
  );
  return result.rows[0] ?? null;
}

function callRpc(args: {
  eventId: string;
  type: string;
  payload?: Record<string, unknown>;
  customerId: string | null;
  subscriptionId: string | null;
  patch: Record<string, unknown> | null;
}) {
  return client.query(
    `select * from public.apply_stripe_subscription_event($1, $2, $3::jsonb, $4, $5, $6::jsonb)`,
    [
      args.eventId,
      args.type,
      JSON.stringify(args.payload ?? { id: args.eventId, type: args.type }),
      args.customerId,
      args.subscriptionId,
      args.patch === null ? null : JSON.stringify(args.patch),
    ],
  );
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await insertParent(PARENT_F, "parent-f@test.local");
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("public.apply_stripe_subscription_event (supabase/migrations/20260723090000_stripe_webhook_transactional_apply.sql)", () => {
  it("happy path: records the event, applies the patch, and marks it processed — parity with the old apply-subscription-event.ts write", async () => {
    const customerId = "cus_happy_path";
    await linkCustomer(PARENT_F, customerId);

    const result = await callRpc({
      eventId: "evt_happy",
      type: "customer.subscription.updated",
      customerId,
      subscriptionId: "sub_happy",
      patch: {
        status: "active",
        plan: "family_monthly",
        stripe_subscription_id: "sub_happy",
        current_period_end: "2027-01-01T00:00:00.000Z",
      },
    });

    expect(result.rows[0]).toMatchObject({ duplicate: false });

    const row = await subscriptionRow(customerId);
    expect(row).toMatchObject({
      status: "active",
      plan: "family_monthly",
      stripe_subscription_id: "sub_happy",
    });
    expect(new Date(row.current_period_end).toISOString()).toBe("2027-01-01T00:00:00.000Z");

    const event = await eventRow("evt_happy");
    expect(event).not.toBeNull();
    expect(event.processed_at).not.toBeNull();
  });

  it("injected update failure: an invalid patch value aborts the whole transaction — the event is NOT left recorded/processed and the row is untouched", async () => {
    const customerId = "cus_update_failure";
    await linkCustomer(PARENT_F, customerId);

    // Wrapped in its own savepoint: the failing call poisons whatever
    // (sub)transaction it runs in (Postgres: "current transaction is
    // aborted"), and `rollback to savepoint` is what clears that without
    // discarding this test's earlier fixture inserts — the DB-level
    // equivalent of the webhook route's non-2xx response meaning "nothing
    // was committed, Stripe should retry".
    await client.query("savepoint before_failure");
    await expect(
      callRpc({
        eventId: "evt_update_failure",
        type: "customer.subscription.updated",
        customerId,
        subscriptionId: "sub_failure",
        // "totally_bogus_status" violates subscriptions' status check
        // constraint — simulates the entitlement-update failure MM-SEC-01
        // describes. Postgres aborts the transaction on error, so
        // everything this function call did (including the
        // subscription_events insert) rolls back with it.
        patch: { status: "totally_bogus_status" },
      }),
    ).rejects.toThrow(/violates check constraint/i);
    await client.query("rollback to savepoint before_failure");

    const event = await eventRow("evt_update_failure");
    expect(event).toBeNull();

    const row = await subscriptionRow(customerId);
    expect(row.status).toBe("trialing"); // untouched: still the trigger-created default
  });

  it("duplicate/replay: the second delivery of the same stripe_event_id is idempotent — reported duplicate, no double-apply", async () => {
    const customerId = "cus_duplicate";
    await linkCustomer(PARENT_F, customerId);

    const first = await callRpc({
      eventId: "evt_duplicate",
      type: "customer.subscription.updated",
      customerId,
      subscriptionId: "sub_dup",
      patch: { status: "active", stripe_subscription_id: "sub_dup" },
    });
    expect(first.rows[0].duplicate).toBe(false);

    // Replay with a DIFFERENT patch — if this were mistakenly re-applied,
    // the row would flip to past_due. It must not: a genuine duplicate skips
    // the apply step entirely.
    const second = await callRpc({
      eventId: "evt_duplicate",
      type: "customer.subscription.updated",
      customerId,
      subscriptionId: "sub_dup",
      patch: { status: "past_due" },
    });
    expect(second.rows[0].duplicate).toBe(true);

    const row = await subscriptionRow(customerId);
    expect(row.status).toBe("active"); // still the first delivery's write, not double-applied
  });

  it("out-of-order events: two distinct events for the same row both apply (each has its own event id) — last one processed wins, same as the pre-fix apply logic", async () => {
    const customerId = "cus_out_of_order";
    await linkCustomer(PARENT_F, customerId);

    // "Newer" state (e.g. Stripe's `customer.subscription.updated` after a
    // successful renewal) delivered FIRST...
    await callRpc({
      eventId: "evt_newer_state",
      type: "customer.subscription.updated",
      customerId,
      subscriptionId: "sub_ooo",
      patch: { status: "active", current_period_end: "2027-06-01T00:00:00.000Z" },
    });

    // ...then an older `invoice.payment_failed` for a prior period arrives
    // late (Stripe's at-least-once delivery gives no ordering guarantee).
    // Neither this fix nor the code it replaces reorders by event.created —
    // this test documents that known, unchanged behaviour rather than
    // asserting a new guard that doesn't exist.
    await callRpc({
      eventId: "evt_older_state",
      type: "invoice.payment_failed",
      customerId,
      subscriptionId: "sub_ooo",
      patch: { status: "past_due" },
    });

    const row = await subscriptionRow(customerId);
    expect(row.status).toBe("past_due"); // whichever event landed last wins, unconditionally

    expect((await eventRow("evt_newer_state")).processed_at).not.toBeNull();
    expect((await eventRow("evt_older_state")).processed_at).not.toBeNull();
  });

  it("is service_role-only: authenticated and anon get permission denied", async () => {
    await client.query("savepoint authenticated_denied");
    await asAuthenticated(client, PARENT_F);
    await expect(
      client.query(`select public.apply_stripe_subscription_event($1, $2, '{}'::jsonb, null, null, null)`, [
        "evt_denied_authenticated",
        "customer.subscription.updated",
      ]),
    ).rejects.toThrow(/permission denied/i);
    await client.query("rollback to savepoint authenticated_denied");

    await client.query("savepoint anon_denied");
    await asAnon(client);
    await expect(
      client.query(`select public.apply_stripe_subscription_event($1, $2, '{}'::jsonb, null, null, null)`, [
        "evt_denied_anon",
        "customer.subscription.updated",
      ]),
    ).rejects.toThrow(/permission denied/i);
    await client.query("rollback to savepoint anon_denied");
  });

  it("service_role can call the function", async () => {
    await client.query("set local role service_role");

    const result = await client.query(
      `select * from public.apply_stripe_subscription_event($1, $2, '{}'::jsonb, null, null, null)`,
      ["evt_service_role_allowed", "customer.created"],
    );

    expect(result.rows[0]).toMatchObject({ duplicate: false });
  });
});
