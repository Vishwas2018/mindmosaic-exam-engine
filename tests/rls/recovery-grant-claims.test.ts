/**
 * Server-side, atomic, fenced, single-use consumption of a password-recovery grant (migration 20261102090000).
 *
 * The SQL is the control, so it is exercised as the database runs it: impersonating `authenticated` the way PostgREST
 * does, and for the concurrency case with SEPARATE COMMITTED connections (a rolled-back transaction would hide exactly
 * the race under test). A password change is simulated the way Auth makes one: a new `auth.users.encrypted_password`.
 * Fixture users are created with random ids and deleted in afterAll; nothing else is touched.
 */
import { randomUUID } from "node:crypto";

import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";

const USER_X = randomUUID();
const USER_Y = randomUUID();
const inFifteen = () => new Date(Date.now() + 15 * 60 * 1000).toISOString();

let admin: Client;

beforeAll(async () => {
  admin = await connect();
  await admin.query(`insert into auth.users (id, email, encrypted_password) values ($1, $2, 'hash-0'), ($3, $4, 'hash-0')`, [
    USER_X,
    `claim-x-${USER_X}@test.local`,
    USER_Y,
    `claim-y-${USER_Y}@test.local`,
  ]);
});

/* The per-user cap (10 live claims) is itself under test, so every test starts from an empty claim table for USER_X. */
beforeEach(async () => {
  await admin.query("delete from public.recovery_grant_claims where user_id = $1", [USER_X]);
});

afterAll(async () => {
  await admin.query(`delete from public.recovery_grant_claims where user_id in ($1, $2)`, [USER_X, USER_Y]);
  await admin.query(`delete from auth.users where id in ($1, $2)`, [USER_X, USER_Y]);
  await admin.end();
});

/** What Auth does on a successful password change. */
let hashSeq = 0;
const changePassword = (uid: string) =>
  admin.query("update auth.users set encrypted_password = $2 where id = $1", [uid, `hash-${(hashSeq += 1)}`]);
const lapse = (jti: string) =>
  admin.query("update public.recovery_grant_claims set lease_until = now() - interval '1 second' where jti = $1", [jti]);
const rowOf = async (jti: string) =>
  (await admin.query("select state, lease_until, claim_token from public.recovery_grant_claims where jti = $1", [jti])).rows[0] as
    | { state: string; lease_until: Date | null; claim_token: string }
    | undefined;

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

type Claim = { outcome: "claimed"; token: string } | { outcome: "busy" | "spent" };
const claim = (sub: string, jti: string, exp = inFifteen()) =>
  asUser(sub, async (c) => (await c.query("select public.claim_recovery_grant($1::uuid, $2::timestamptz) as r", [jti, exp])).rows[0].r as Claim);
/** Claims and returns the token, failing the test if the grant was not won. */
const won = async (sub: string, jti: string) => {
  const r = await claim(sub, jti);
  if (r.outcome !== "claimed") throw new Error(`expected claimed, got ${r.outcome}`);
  return r.token;
};
const settle = (sub: string, jti: string, token: string | null, outcome: string) =>
  asUser(sub, async (c) => (await c.query("select public.settle_recovery_grant($1::uuid, $2::uuid, $3::text) as r", [jti, token, outcome])).rows[0].r as boolean);
const resolve = (sub: string, jti: string, token: string) =>
  asUser(sub, async (c) => (await c.query("select public.resolve_recovery_claim($1::uuid, $2::uuid) as r", [jti, token])).rows[0].r as string);

describe("privileges", () => {
  it("anon cannot execute any of the functions", async () => {
    for (const sql of [
      "select public.claim_recovery_grant($1::uuid, now() + interval '1 minute')",
      "select public.settle_recovery_grant($1::uuid, $1::uuid, 'spent')",
      "select public.resolve_recovery_claim($1::uuid, $1::uuid)",
    ]) {
      const c = await connect();
      try {
        await c.query("begin");
        await c.query("set local role anon");
        await expect(c.query(sql, [randomUUID()])).rejects.toThrow(/permission denied/i);
      } finally {
        await c.query("rollback").catch(() => undefined);
        await c.end();
      }
    }
  });

  it("authenticated can neither read nor write the table directly", async () => {
    await asUser(USER_X, async (c) => {
      await expect(c.query("select * from public.recovery_grant_claims")).rejects.toThrow(/permission denied/i);
    }, false);
    await asUser(USER_X, async (c) => {
      await expect(
        c.query(
          `insert into public.recovery_grant_claims (jti, user_id, state, claim_token, pw_digest, lease_until, grant_expires_at) values ($1, $2, 'spent', $1, '\\x00', null, now())`,
          [randomUUID(), USER_X],
        ),
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
        where n.nspname = 'public' and p.proname in ('claim_recovery_grant', 'settle_recovery_grant', 'resolve_recovery_claim')`,
    );
    expect(rows).toHaveLength(3);
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
    const token = await won(USER_X, jti);
    expect(await claim(USER_X, jti)).toEqual({ outcome: "busy" });
    expect(await settle(USER_X, jti, token, "spent")).toBe(true);
    expect(await claim(USER_X, jti)).toEqual({ outcome: "spent" });
    expect(await settle(USER_X, jti, token, "spent")).toBe(true); // idempotent
    expect(await rowOf(jti)).toMatchObject({ state: "spent", lease_until: null });
    await admin.query("update public.recovery_grant_claims set claimed_at = now() - interval '1 day' where jti = $1", [jti]);
    expect(await claim(USER_X, jti)).toEqual({ outcome: "spent" });
  });

  it("release (password provably unchanged) makes the same grant claimable again, with a NEW token", async () => {
    const jti = randomUUID();
    const first = await won(USER_X, jti);
    expect(await settle(USER_X, jti, first, "released")).toBe(true);
    const second = await won(USER_X, jti);
    expect(second).not.toBe(first);
    expect(await settle(USER_X, jti, second, "spent")).toBe(true);
  });

  it("settling an unknown outcome is refused (MM011) and changes nothing", async () => {
    const jti = randomUUID();
    const token = await won(USER_X, jti);
    await expect(settle(USER_X, jti, token, "whatever")).rejects.toMatchObject({ code: "MM011" });
    expect((await rowOf(jti))?.state).toBe("claimed");
    await settle(USER_X, jti, token, "released");
  });
});

describe("lease expiry, takeover and fencing", () => {
  it("a lapsed claim with the password UNCHANGED (a crashed attempt) is claimable again; one inside its lease is busy", async () => {
    const jti = randomUUID();
    const first = await won(USER_X, jti);
    expect(await claim(USER_X, jti)).toEqual({ outcome: "busy" });
    await lapse(jti);
    const second = await won(USER_X, jti);
    expect(second).not.toBe(first);
    expect(await claim(USER_X, jti)).toEqual({ outcome: "busy" });
    expect((await admin.query("select lease_until > now() as live from public.recovery_grant_claims where jti = $1", [jti])).rows[0].live).toBe(true);
    await settle(USER_X, jti, second, "released");
  });

  it("a lapsed claim whose password HAS changed (success that never settled) becomes spent, not claimable", async () => {
    const jti = randomUUID();
    await won(USER_X, jti);
    await changePassword(USER_X);
    expect(await claim(USER_X, jti)).toEqual({ outcome: "busy" }); // still inside the lease: the attempt may be finishing
    await lapse(jti);
    expect(await claim(USER_X, jti)).toEqual({ outcome: "spent" });
    expect((await rowOf(jti))?.state).toBe("spent");
    expect(await claim(USER_X, jti)).toEqual({ outcome: "spent" });
  });

  it("an OLD claimant cannot release a NEWER claimant's claim (fencing), and the newer claim is untouched", async () => {
    const jti = randomUUID();
    const oldToken = await won(USER_X, jti);
    await lapse(jti);
    const newToken = await won(USER_X, jti);
    expect(await settle(USER_X, jti, oldToken, "released")).toBe(false);
    expect(await settle(USER_X, jti, null, "released")).toBe(false);
    expect(await rowOf(jti)).toMatchObject({ state: "claimed", claim_token: newToken });
    expect(await claim(USER_X, jti)).toEqual({ outcome: "busy" });
    expect(await settle(USER_X, jti, newToken, "released")).toBe(true);
  });

  it("an old claimant's late SUCCESS report still marks the grant spent (the safe direction)", async () => {
    const jti = randomUUID();
    const oldToken = await won(USER_X, jti);
    await lapse(jti);
    await won(USER_X, jti);
    expect(await settle(USER_X, jti, oldToken, "spent")).toBe(true);
    expect((await rowOf(jti))?.state).toBe("spent");
    expect(await claim(USER_X, jti)).toEqual({ outcome: "spent" });
  });

  it("a release is REFUSED, and the grant spent instead, once the password hash has changed since the claim", async () => {
    const jti = randomUUID();
    const token = await won(USER_X, jti);
    await changePassword(USER_X);
    expect(await settle(USER_X, jti, token, "released")).toBe(false);
    expect((await rowOf(jti))?.state).toBe("spent");
    expect(await claim(USER_X, jti)).toEqual({ outcome: "spent" });
  });
});

describe("resolve (an ambiguous answer from Auth)", () => {
  it("password unchanged -> 'unchanged', and nothing is released or spent", async () => {
    const jti = randomUUID();
    const token = await won(USER_X, jti);
    expect(await resolve(USER_X, jti, token)).toBe("unchanged");
    expect(await rowOf(jti)).toMatchObject({ state: "claimed", claim_token: token });
    await settle(USER_X, jti, token, "released");
  });

  it("password changed -> 'changed' and the grant is spent in the same step", async () => {
    const jti = randomUUID();
    const token = await won(USER_X, jti);
    await changePassword(USER_X);
    expect(await resolve(USER_X, jti, token)).toBe("changed");
    expect((await rowOf(jti))?.state).toBe("spent");
    expect(await resolve(USER_X, jti, token)).toBe("changed"); // spent stays changed
  });

  it("a superseded token, an unknown grant and another user's grant all resolve to 'unknown'", async () => {
    const jti = randomUUID();
    const oldToken = await won(USER_X, jti);
    await lapse(jti);
    await won(USER_X, jti);
    expect(await resolve(USER_X, jti, oldToken)).toBe("unknown");
    expect(await resolve(USER_X, randomUUID(), randomUUID())).toBe("unknown");
    expect(await resolve(USER_Y, jti, oldToken)).toBe("unknown");
  });
});

describe("ownership", () => {
  it("another user can neither claim, settle nor release a grant they do not own, and learns nothing from it", async () => {
    const jti = randomUUID();
    const token = await won(USER_X, jti);
    expect(await claim(USER_Y, jti)).toEqual({ outcome: "busy" });
    expect(await settle(USER_Y, jti, token, "spent")).toBe(false);
    expect(await settle(USER_Y, jti, token, "released")).toBe(false);
    expect(await rowOf(jti)).toMatchObject({ state: "claimed" });
    expect((await admin.query("select user_id from public.recovery_grant_claims where jti = $1", [jti])).rows[0].user_id).toBe(USER_X);
    expect(await settle(USER_X, jti, token, "spent")).toBe(true);
    /* A spent grant belonging to X is 'busy', not 'spent', to Y: Y is told nothing about X's state. */
    expect(await claim(USER_Y, jti)).toEqual({ outcome: "busy" });
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
  it("of 12 simultaneous claims for one grant exactly one wins (with a token) and the rest are busy", async () => {
    const jti = randomUUID();
    const results = await Promise.all(Array.from({ length: 12 }, () => claim(USER_X, jti)));
    const winners = results.filter((r) => r.outcome === "claimed");
    expect(winners).toHaveLength(1);
    expect(results.filter((r) => r.outcome === "busy")).toHaveLength(11);
    expect((await admin.query("select count(*)::int as n from public.recovery_grant_claims where jti = $1", [jti])).rows[0].n).toBe(1);
    expect((await rowOf(jti))?.claim_token).toBe((winners[0] as { token: string }).token);
    await settle(USER_X, jti, (winners[0] as { token: string }).token, "spent");
  });

  it("of 12 simultaneous claims racing a lapsed lease, exactly one takes it over", async () => {
    const jti = randomUUID();
    await won(USER_X, jti);
    await lapse(jti);
    const results = await Promise.all(Array.from({ length: 12 }, () => claim(USER_X, jti)));
    const winners = results.filter((r) => r.outcome === "claimed");
    expect(winners).toHaveLength(1);
    expect(results.filter((r) => r.outcome === "busy")).toHaveLength(11);
    await settle(USER_X, jti, (winners[0] as { token: string }).token, "spent");
  });

  it("racing a lapsed lease whose password CHANGED, nobody wins: all 12 see spent or busy", async () => {
    const jti = randomUUID();
    await won(USER_X, jti);
    await changePassword(USER_X);
    await lapse(jti);
    const results = await Promise.all(Array.from({ length: 12 }, () => claim(USER_X, jti)));
    expect(results.filter((r) => r.outcome === "claimed")).toHaveLength(0);
    expect((await rowOf(jti))?.state).toBe("spent");
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
    for (const id of ids) await won(USER_Y, id);
    await expect(claim(USER_Y, randomUUID())).rejects.toMatchObject({ code: "MM012" });
    /* An already-held grant is not counted against itself. */
    expect(await claim(USER_Y, ids[0]!)).toEqual({ outcome: "busy" });
    /* Expired rows (older than the retention margin) are deleted by the next claim, freeing the cap. */
    await admin.query("update public.recovery_grant_claims set grant_expires_at = now() - interval '2 hours', lease_until = now() - interval '2 hours' where user_id = $1", [USER_Y]);
    expect((await claim(USER_Y, randomUUID())).outcome).toBe("claimed");
    expect((await admin.query("select count(*)::int as n from public.recovery_grant_claims where user_id = $1", [USER_Y])).rows[0].n).toBe(1);
  });
});
