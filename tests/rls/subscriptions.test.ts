/**
 * RLS + entitlement-helper coverage for
 * supabase/migrations/20260720100000_subscriptions.sql, following the
 * pattern in essay-marks.test.ts: each test seeds its own local parent
 * fixture (kept local rather than in ./fixtures.ts since only this file
 * needs it) as the unrestricted `postgres` role, impersonates a signed-in
 * user, and always ROLLBACKs.
 *
 * Core assertions this file exists for: a parent can read only their own
 * subscription row and can never write to either table directly (all
 * writes come from the profiles-insert trigger or, later, a service-role
 * Stripe webhook — see docs/PRIVACY_AND_BILLING_GUARDRAILS.md); and
 * has_active_access/current_parent_has_access compute entitlement
 * correctly across trialing, expired-trial, and active states.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated } from "./fixtures";

const PARENT_D = "00000000-0000-0000-0000-00000000002a";
const PARENT_E = "00000000-0000-0000-0000-00000000002b";

let client: Client;

/**
 * Inserts an auth.users row with role: 'parent' in its metadata so
 * handle_new_user creates a 'parent' profile, which in turn fires the
 * on_parent_profile_created trigger and auto-creates a trialing
 * subscriptions row. Must run as the unrestricted `postgres` role, before
 * any `set local role` impersonation.
 */
async function insertParent(id: string, email: string): Promise<void> {
  await client.query(
    `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)`,
    [id, email, JSON.stringify({ role: "parent" })],
  );
}

/** R3's rule: permission-denied and empty-result-set are both a pass. */
async function expectDeniedOrEmpty(sql: string): Promise<void> {
  await client.query("savepoint anon_check");
  try {
    const result = await client.query(sql);
    await client.query("release savepoint anon_check");
    expect(result.rows).toHaveLength(0);
  } catch (error) {
    await client.query("rollback to savepoint anon_check");
    expect((error as Error).message).toMatch(/permission denied/i);
  }
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await insertParent(PARENT_D, "parent-d@test.local");
  await insertParent(PARENT_E, "parent-e@test.local");
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("RLS: subscriptions / subscription_events (supabase/migrations/20260720100000_subscriptions.sql)", () => {
  it("the profiles-insert trigger creates a trialing subscription with a ~7 day trial", async () => {
    const rows = await client.query(
      `select status, seats, trial_end, current_period_end
       from public.subscriptions where parent_id = $1`,
      [PARENT_D],
    );
    expect(rows.rows).toHaveLength(1);

    const row = rows.rows[0];
    expect(row.status).toBe("trialing");
    expect(row.seats).toBe(3);
    expect(row.current_period_end).toBeNull();

    const trialEndMs = new Date(row.trial_end).getTime();
    const expectedMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(trialEndMs - expectedMs)).toBeLessThan(60_000);
  });

  it("a parent can read their own subscription", async () => {
    await asAuthenticated(client, PARENT_D);

    const rows = await client.query(`select parent_id from public.subscriptions`);
    expect(rows.rows).toEqual([{ parent_id: PARENT_D }]);
  });

  it("a parent cannot read another parent's subscription", async () => {
    await asAuthenticated(client, PARENT_D);

    const rows = await client.query(`select * from public.subscriptions where parent_id = $1`, [
      PARENT_E,
    ]);
    expect(rows.rows).toHaveLength(0);
  });

  it("a parent cannot insert their own subscription (client writes blocked)", async () => {
    await client.query(`delete from public.subscriptions where parent_id = $1`, [PARENT_D]);
    await asAuthenticated(client, PARENT_D);

    await expect(
      client.query(`insert into public.subscriptions (parent_id, status) values ($1, 'trialing')`, [
        PARENT_D,
      ]),
    ).rejects.toThrow(/row-level security/i);
  });

  it("a parent cannot update their own subscription (client writes blocked)", async () => {
    await asAuthenticated(client, PARENT_D);

    const result = await client.query(
      `update public.subscriptions set status = 'active' where parent_id = $1`,
      [PARENT_D],
    );
    expect(result.rowCount).toBe(0);
  });

  it("a parent cannot delete their subscription (client writes blocked)", async () => {
    await asAuthenticated(client, PARENT_D);

    const result = await client.query(`delete from public.subscriptions where parent_id = $1`, [
      PARENT_D,
    ]);
    expect(result.rowCount).toBe(0);
  });

  it("anon is denied on both tables", async () => {
    await asAnon(client);

    await expectDeniedOrEmpty("select * from public.subscriptions");
    await expectDeniedOrEmpty("select * from public.subscription_events");
  });

  it("an authenticated parent has no access to subscription_events (service-role only)", async () => {
    await asAuthenticated(client, PARENT_D);

    await expectDeniedOrEmpty("select * from public.subscription_events");
  });

  describe("entitlement helpers", () => {
    it("has_active_access is true during an unexpired trial", async () => {
      const result = await client.query(`select public.has_active_access($1) as ok`, [PARENT_D]);
      expect(result.rows[0].ok).toBe(true);
    });

    it("has_active_access is false once trial_end is past with no active subscription", async () => {
      await client.query(
        `update public.subscriptions set trial_end = now() - interval '1 day' where parent_id = $1`,
        [PARENT_E],
      );

      const result = await client.query(`select public.has_active_access($1) as ok`, [PARENT_E]);
      expect(result.rows[0].ok).toBe(false);
    });

    it("has_active_access is true for an active subscription with a future current_period_end", async () => {
      await client.query(
        `update public.subscriptions
         set status = 'active', current_period_end = now() + interval '30 days'
         where parent_id = $1`,
        [PARENT_D],
      );

      const result = await client.query(`select public.has_active_access($1) as ok`, [PARENT_D]);
      expect(result.rows[0].ok).toBe(true);
    });

    it("has_active_access is false for an active subscription whose current_period_end has passed", async () => {
      await client.query(
        `update public.subscriptions
         set status = 'active', current_period_end = now() - interval '1 day'
         where parent_id = $1`,
        [PARENT_D],
      );

      const result = await client.query(`select public.has_active_access($1) as ok`, [PARENT_D]);
      expect(result.rows[0].ok).toBe(false);
    });

    it("current_parent_has_access reflects the signed-in parent's own entitlement", async () => {
      await client.query(
        `update public.subscriptions set trial_end = now() - interval '1 day' where parent_id = $1`,
        [PARENT_E],
      );

      await asAuthenticated(client, PARENT_D);
      const stillTrialing = await client.query(`select public.current_parent_has_access() as ok`);
      expect(stillTrialing.rows[0].ok).toBe(true);

      await asAuthenticated(client, PARENT_E);
      const expired = await client.query(`select public.current_parent_has_access() as ok`);
      expect(expired.rows[0].ok).toBe(false);
    });
  });
});
