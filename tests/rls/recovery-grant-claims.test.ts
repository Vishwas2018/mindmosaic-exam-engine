/**
 * Server-side, atomic, single-use consumption of a password-recovery grant (migration 20261102090000).
 *
 * The SQL is the control, so it is exercised as the database runs it: impersonating `authenticated` the way PostgREST
 * does, and for the concurrency case with SEPARATE COMMITTED connections (a rolled-back transaction would hide exactly
 * the race under test). Fixture users are created with random ids and deleted in afterAll; nothing else is touched.
 */
import { randomUUID } from "node:crypto";

import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connect } from "./db";

const USER_X = randomUUID();
const USER_Y = randomUUID();
const inFifteen = () => new Date(Date.now() + 15 * 60 * 1000).toISOString();

let admin: Client;

beforeAll(async () => {
  admin = await connect();
  await admin.query(`insert into auth.users (id, email) values ($1, $2), ($3, $4)`, [
    USER_X,
    `claim-x-${USER_X}@test.local`,
    USER_Y,
    `claim-y-${USER_Y}@test.local`,
  ]);
});

afterAll(async () => {
  await admin.query(`delete from public.recovery_grant_claims where user_id in ($1, $2)`, [USER_X, USER_Y]);
  await admin.query(`delete from auth.users where id in ($1, $2)`, [USER_X, USER_Y]);
  await admin.end();
});

/** Runs `work` in one transaction as `authenticated` with the given `sub`, committing (or not) as asked. */
async function asUser<T>(sub: string | null, work: (c: Client) => Promise<T>, commit = true): Promise<T> {
  const c = await connect();
  try {
    await c.query("begin");
    await c.query("set local role authenticated");
    await c.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(sub ? { sub, role: "authenticated" } : { role: "authenticated" }),
    ]);
    const out = await work(c);
    await c.query(commit ? "commit" : "rollback");
    return out;
  } catch (error) {
    await c.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await c.end();
  }
}

const claim = (sub: string, jti: string, exp = inFifteen()) =>
  asUser(sub, async (c) => (await c.query("select public.claim_recovery_grant($1::uuid, $2::timestamptz) as r", [jti, exp])).rows[0].r as string);
const settle = (sub: string, jti: string, outcome: string) =>
  asUser(sub, async (c) => (await c.query("select public.settle_recovery_grant($1::uuid, $2::text) as r", [jti, outcome])).rows[0].r as boolean);

describe("privileges", () => {
  it("anon cannot execute either function", async () => {
    const c = await connect();
    try {
      await c.query("begin");
      await c.query("set local role anon");
      await expect(c.query("select public.claim_recovery_grant($1::uuid, $2::timestamptz)", [randomUUID(), inFifteen()])).rejects.toThrow(/permission denied/i);
      await c.query("rollback");
      await c.query("begin");
      await c.query("set local role anon");
      await expect(c.query("select public.settle_recovery_grant($1::uuid, 'spent')", [randomUUID()])).rejects.toThrow(/permission denied/i);
    } finally {
      await c.query("rollback").catch(() => undefined);
      await c.end();
    }
  });

  it("authenticated can neither read nor write the table directly", async () => {
    await asUser(USER_X, async (c) => {
      await expect(c.query("select * from public.recovery_grant_claims")).rejects.toThrow(/permission denied/i);
    }, false);
    await asUser(USER_X, async (c) => {
      await expect(
        c.query(`insert into public.recovery_grant_claims (jti, user_id, state, lease_until, grant_expires_at) values ($1, $2, 'spent', null, now())`, [randomUUID(), USER_X]),
      ).rejects.toThrow(/permission denied/i);
    }, false);
  });

  it("the catalogue grants EXECUTE to authenticated alone (no anon, no PUBLIC), and the table to no client role", async () => {
    const { rows } = await admin.query(
      `select p.proname,
              has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
              has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated,
              exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_grant
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname in ('claim_recovery_grant', 'settle_recovery_grant')`,
    );
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(row).toMatchObject({ anon: false, authenticated: true, public_grant: false });
    const table = await admin.query(
      `select has_table_privilege('anon', 'public.recovery_grant_claims', 'SELECT') as anon_select,
              has_table_privilege('authenticated', 'public.recovery_grant_claims', 'SELECT') as auth_select,
              has_table_privilege('authenticated', 'public.recovery_grant_claims', 'INSERT') as auth_insert,
              (select relrowsecurity from pg_class where oid = 'public.recovery_grant_claims'::regclass) as rls`,
    );
    expect(table.rows[0]).toEqual({ anon_select: false, auth_select: false, auth_insert: false, rls: true });
  });

  it("a request with no signed-in user is refused (MM010)", async () => {
    await expect(
      asUser(null, (c) => c.query("select public.claim_recovery_grant($1::uuid, $2::timestamptz)", [randomUUID(), inFifteen()]), false),
    ).rejects.toMatchObject({ code: "MM010" });
  });
});

describe("single-use lifecycle", () => {
  it("claim -> busy -> settle spent -> spent forever (and spent is never taken over, whatever the clock)", async () => {
    const jti = randomUUID();
    expect(await claim(USER_X, jti)).toBe("claimed");
    expect(await claim(USER_X, jti)).toBe("busy");
    expect(await settle(USER_X, jti, "spent")).toBe(true);
    expect(await claim(USER_X, jti)).toBe("spent");
    expect(await settle(USER_X, jti, "spent")).toBe(false); // already settled
    const row = (await admin.query("select state, lease_until from public.recovery_grant_claims where jti = $1", [jti])).rows[0];
    expect(row).toEqual({ state: "spent", lease_until: null });
    await admin.query("update public.recovery_grant_claims set claimed_at = now() - interval '1 day' where jti = $1", [jti]);
    expect(await claim(USER_X, jti)).toBe("spent");
  });

  it("release makes the same grant claimable again (a failed password change does not lock the user out)", async () => {
    const jti = randomUUID();
    expect(await claim(USER_X, jti)).toBe("claimed");
    expect(await settle(USER_X, jti, "released")).toBe(true);
    expect(await claim(USER_X, jti)).toBe("claimed");
    expect(await settle(USER_X, jti, "spent")).toBe(true);
  });

  it("a claim whose lease lapsed (a crashed attempt) is claimable again; one inside its lease is busy", async () => {
    const jti = randomUUID();
    expect(await claim(USER_X, jti)).toBe("claimed");
    expect(await claim(USER_X, jti)).toBe("busy");
    await admin.query("update public.recovery_grant_claims set lease_until = now() - interval '1 second' where jti = $1", [jti]);
    expect(await claim(USER_X, jti)).toBe("claimed");
    expect(await claim(USER_X, jti)).toBe("busy");
    const lease = (await admin.query("select lease_until > now() as live from public.recovery_grant_claims where jti = $1", [jti])).rows[0];
    expect(lease.live).toBe(true);
  });

  it("settling an unknown outcome is refused (MM011) and changes nothing", async () => {
    const jti = randomUUID();
    await claim(USER_X, jti);
    await expect(settle(USER_X, jti, "whatever")).rejects.toMatchObject({ code: "MM011" });
    expect((await admin.query("select state from public.recovery_grant_claims where jti = $1", [jti])).rows[0].state).toBe("claimed");
    await settle(USER_X, jti, "released");
  });
});

describe("ownership", () => {
  it("another user can neither claim, settle nor release a grant they do not own, and learns nothing from it", async () => {
    const jti = randomUUID();
    expect(await claim(USER_X, jti)).toBe("claimed");
    expect(await claim(USER_Y, jti)).toBe("busy");
    expect(await settle(USER_Y, jti, "spent")).toBe(false);
    expect(await settle(USER_Y, jti, "released")).toBe(false);
    expect((await admin.query("select state, user_id from public.recovery_grant_claims where jti = $1", [jti])).rows[0]).toEqual({ state: "claimed", user_id: USER_X });
    expect(await settle(USER_X, jti, "spent")).toBe(true);
    /* A spent grant belonging to X is 'busy', not 'spent', to Y: Y is told nothing about X's state. */
    expect(await claim(USER_Y, jti)).toBe("busy");
  });

  it("deleting the user removes their claims", async () => {
    const temp = randomUUID();
    await admin.query("insert into auth.users (id, email) values ($1, $2)", [temp, `claim-t-${temp}@test.local`]);
    const jti = randomUUID();
    await claim(temp, jti);
    await admin.query("delete from auth.users where id = $1", [temp]);
    expect((await admin.query("select 1 from public.recovery_grant_claims where jti = $1", [jti])).rowCount).toBe(0);
  });
});

describe("concurrency (real, committed connections)", () => {
  it("of 12 simultaneous claims for one grant exactly one wins and the rest are busy", async () => {
    const jti = randomUUID();
    const results = await Promise.all(Array.from({ length: 12 }, () => claim(USER_X, jti)));
    expect(results.filter((r) => r === "claimed")).toHaveLength(1);
    expect(results.filter((r) => r === "busy")).toHaveLength(11);
    expect((await admin.query("select count(*)::int as n from public.recovery_grant_claims where jti = $1", [jti])).rows[0].n).toBe(1);
    await settle(USER_X, jti, "spent");
  });

  it("of 12 simultaneous claims racing a lapsed lease, exactly one takes it over", async () => {
    const jti = randomUUID();
    await claim(USER_X, jti);
    await admin.query("update public.recovery_grant_claims set lease_until = now() - interval '1 second' where jti = $1", [jti]);
    const results = await Promise.all(Array.from({ length: 12 }, () => claim(USER_X, jti)));
    expect(results.filter((r) => r === "claimed")).toHaveLength(1);
    expect(results.filter((r) => r === "busy")).toHaveLength(11);
    await settle(USER_X, jti, "spent");
  });
});

describe("bounds", () => {
  it("refuses an expiry in the past or beyond the 15-minute grant lifetime plus margin (MM011)", async () => {
    await expect(claim(USER_X, randomUUID(), new Date(Date.now() - 1000).toISOString())).rejects.toMatchObject({ code: "MM011" });
    await expect(claim(USER_X, randomUUID(), new Date(Date.now() + 25 * 60 * 1000).toISOString())).rejects.toMatchObject({ code: "MM011" });
  });

  it("caps live claims per user at 10 (MM012) and purges expired rows", async () => {
    await admin.query("delete from public.recovery_grant_claims where user_id = $1", [USER_Y]);
    const ids = Array.from({ length: 10 }, () => randomUUID());
    for (const id of ids) expect(await claim(USER_Y, id)).toBe("claimed");
    await expect(claim(USER_Y, randomUUID())).rejects.toMatchObject({ code: "MM012" });
    /* An already-held grant is not counted against itself. */
    expect(await claim(USER_Y, ids[0]!)).toBe("busy");
    /* Expired rows (older than the retention margin) are deleted by the next claim, freeing the cap. */
    await admin.query("update public.recovery_grant_claims set grant_expires_at = now() - interval '2 hours', lease_until = now() - interval '2 hours' where user_id = $1", [USER_Y]);
    expect(await claim(USER_Y, randomUUID())).toBe("claimed");
    expect((await admin.query("select count(*)::int as n from public.recovery_grant_claims where user_id = $1", [USER_Y])).rows[0].n).toBe(1);
  });
});
