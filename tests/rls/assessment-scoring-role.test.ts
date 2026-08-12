/**
 * The least-privilege proof for `mindmosaic_scoring`
 * (supabase/migrations/20260812110000_scoring_role.sql, spec v1.2 §9.3.1,
 * ADR-006 Amendment A).
 *
 * Spec v1.1 allowed exactly one runtime reader of `item_answer_versions`: a
 * SECURITY DEFINER function that returned outcomes rather than rows. v1.2
 * admits a second path — a dedicated role held by one isolated module — on the
 * condition that its privilege set is asserted, not described. That is what
 * this file is. The assertions are deliberately **set equalities** rather than
 * "has at least": a test that only checks the role can do its job would pass
 * just as happily if someone granted it the whole schema.
 *
 * Two properties are checked in two different ways on purpose:
 *
 *   * the catalogue (what the grants say), and
 *   * behaviour under `set local role` (what the database actually enforces).
 *
 * They can disagree — a grant is not the same thing as reachability once RLS is
 * involved, and this role deliberately has no BYPASSRLS — so proving only one
 * would leave the interesting half unproven.
 */
import type { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { connect, connectAsScoringRole } from "./db";
import { asAuthenticated, seed, STUDENT_A } from "./fixtures";

const SCORING_ROLE = "mindmosaic_scoring";

/** Exactly the table-level grants 20260812110000 issues. Nothing else. */
const EXPECTED_TABLE_GRANTS = [
  "assessment_results:INSERT",
  "assessment_session_items:SELECT",
  "assessment_sessions:SELECT",
  "item_answer_versions:SELECT",
  "item_versions:SELECT",
  "session_responses:SELECT",
] as const;

/** Exactly the column-level UPDATE grants. */
const EXPECTED_COLUMN_UPDATES = [
  "assessment_sessions.status",
  "assessment_sessions.submitted_at",
  "assessment_sessions.version",
  "session_responses.available_marks",
  "session_responses.awarded_marks",
  "session_responses.is_correct",
  "session_responses.score_status",
  "session_responses.scored_at",
] as const;

let client: Client;
/**
 * A real connection as the scoring role — see connectAsScoringRole's note.
 * Undefined when that connection could not be made, so the teardown below
 * reports the connection failure rather than burying it under a TypeError in
 * every one of this file's cases.
 */
let scoring: Client | undefined;

/**
 * ONE scoring connection for the whole file, not one per test.
 *
 * Opened per test, this file churned 56 connections (two per case), and the
 * worker process died partway through roughly one run in four — after which
 * vitest reported the remaining 26 cases as neither passed nor failed. The
 * probes below are permission checks that do not depend on any seeded row, so
 * there is nothing a fresh connection per test was buying.
 *
 * Its transaction opens once and rolls back once. Every probe is additionally
 * savepoint-isolated in `asScoring`, because a probe that unexpectedly
 * SUCCEEDS is exactly the failure this file exists to catch, and it must not
 * leave a row — or a table — behind when it does.
 */
beforeAll(async () => {
  scoring = await connectAsScoringRole();
  await scoring.query("begin");
});

afterAll(async () => {
  if (scoring === undefined) return;
  await scoring.query("rollback").catch(() => undefined);
  await scoring.end();
});

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

async function inSavepoint(body: () => Promise<void>): Promise<void> {
  await client.query("savepoint sp");
  try {
    await body();
  } finally {
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");
  }
}

/** Runs one statement on the scoring connection, isolated by a savepoint. */
async function asScoring(sql: string): Promise<void> {
  /* beforeEach has already failed if this is undefined; narrowing here keeps
     the probes below free of non-null assertions. */
  if (scoring === undefined) throw new Error("no scoring connection");
  const connection = scoring;
  await connection.query("savepoint sp");
  try {
    await connection.query(sql);
  } finally {
    await connection.query("rollback to savepoint sp");
    await connection.query("release savepoint sp");
  }
}

describe("the scoring role is a narrow credential, not a second service_role", () => {
  it("exists and holds no dangerous role attribute", async () => {
    const result = await client.query<{
      rolsuper: boolean;
      rolcreatedb: boolean;
      rolcreaterole: boolean;
      rolbypassrls: boolean;
      rolinherit: boolean;
      rolreplication: boolean;
    }>(
      `select rolsuper, rolcreatedb, rolcreaterole, rolbypassrls, rolinherit, rolreplication
         from pg_roles where rolname = $1`,
      [SCORING_ROLE],
    );
    expect(result.rowCount).toBe(1);
    /* NOBYPASSRLS is the load-bearing one: with it, every policy stops applying
       and the grant list stops being the boundary. NOINHERIT means a future
       membership grant does not silently confer someone else's rights. */
    expect(result.rows[0]).toEqual({
      rolsuper: false,
      rolcreatedb: false,
      rolcreaterole: false,
      rolbypassrls: false,
      rolinherit: false,
      rolreplication: false,
    });
  });

  it("is a member of no other role", async () => {
    /* The dangerous direction. postgres holding admin membership *of* the
       scoring role is unavoidable — the creating role always does — and confers
       nothing postgres did not already have. The scoring role acquiring
       somebody else's privileges is the failure worth testing for. */
    const result = await client.query(
      `select r.rolname from pg_auth_members am
         join pg_roles member on member.oid = am.member
         join pg_roles r on r.oid = am.roleid
        where member.rolname = $1`,
      [SCORING_ROLE],
    );
    expect(result.rows).toEqual([]);
  });

  it("is not service_role, anon or authenticated", async () => {
    /* Stated explicitly because service_role is the alternative most likely to
       be reached for later: it is one environment variable already present in
       the repository, and it bypasses RLS on every table at once. */
    for (const other of ["service_role", "anon", "authenticated"]) {
      const same = await client.query<{ same: boolean }>(
        `select (select oid from pg_roles where rolname = $1)
              = (select oid from pg_roles where rolname = $2) as same`,
        [SCORING_ROLE, other],
      );
      expect(same.rows[0]!.same, `${SCORING_ROLE} must not be ${other}`).toBe(false);
    }
  });
});

describe("the scoring role holds exactly its intended grants", () => {
  it("holds exactly six table-level grants", async () => {
    const result = await client.query<{ grant: string }>(
      `select table_name::text || ':' || privilege_type::text as grant
         from information_schema.role_table_grants
        where grantee = $1
        order by 1`,
      [SCORING_ROLE],
    );
    /* Set equality, not a subset check. A new `grant ... to mindmosaic_scoring`
       anywhere in the schema fails here, which is the whole point. */
    expect(result.rows.map((row) => row.grant)).toEqual([...EXPECTED_TABLE_GRANTS]);
  });

  it("holds exactly eight column-level UPDATE grants and no table-level UPDATE", async () => {
    const result = await client.query<{ grant: string }>(
      `select table_name::text || '.' || column_name::text as grant
         from information_schema.column_privileges
        where grantee = $1 and privilege_type = 'UPDATE'
        order by 1`,
      [SCORING_ROLE],
    );
    expect(result.rows.map((row) => row.grant)).toEqual([...EXPECTED_COLUMN_UPDATES]);

    /* The column grants are what stop "scoring" from being able to alter the
       evidence it scores — response_value and client_sequence are absent above
       deliberately. A table-level UPDATE would silently include them. */
    const tableLevel = await client.query(
      `select 1 from information_schema.role_table_grants
        where grantee = $1 and privilege_type = 'UPDATE'`,
      [SCORING_ROLE],
    );
    expect(tableLevel.rowCount).toBe(0);
  });

  it("holds no privilege on any other schema's objects", async () => {
    const result = await client.query<{ table_schema: string }>(
      `select distinct table_schema::text from information_schema.role_table_grants
        where grantee = $1 and table_schema <> 'public'`,
      [SCORING_ROLE],
    );
    expect(result.rows).toEqual([]);
  });
});

describe("the answer table stays unreachable to learners", () => {
  it("grants anon and authenticated nothing on item_answer_versions", async () => {
    /* Spec §9.3.1 requires this to be re-asserted alongside the new reader
       rather than inherited from Phase 1 — the migration that introduces a
       second reader is exactly where a reviewer should see the old ones denied. */
    const result = await client.query(
      `select 1 from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'item_answer_versions'
          and grantee in ('anon', 'authenticated')`,
    );
    expect(result.rowCount).toBe(0);
  });

  it("refuses a signed-in learner reading answers — permission denied, not an empty set", async () => {
    await inSavepoint(async () => {
      await asAuthenticated(client, STUDENT_A);
      await expect(
        client.query("select * from public.item_answer_versions"),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("defines no policy on item_answer_versions naming anon, authenticated or PUBLIC", async () => {
    /* The scoring role legitimately has a policy here, so "no policy at all" is
       no longer the invariant. The one that matters is that no policy names a
       role a learner can present. */
    const result = await client.query<{ polname: string }>(
      `select p.polname from pg_policy p
         join pg_class c on c.oid = p.polrelid
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'item_answer_versions'
          and (
            0 = any(p.polroles)
            or exists (
              select 1 from unnest(p.polroles) as role_oid
              join pg_roles r on r.oid = role_oid
              where r.rolname in ('anon', 'authenticated')
            )
          )`,
    );
    expect(result.rows).toEqual([]);
  });
});

describe("what the scoring role can and cannot actually do", () => {
  /* The catalogue half above says what the grants are. This half says what the
     database enforces once RLS is in play, which is not the same question. */

  it("can read the answer versions it exists to read", async () => {
    await expect(asScoring("select 1 from public.item_answer_versions")).resolves.toBeUndefined();
    await expect(asScoring("select 1 from public.item_versions")).resolves.toBeUndefined();
    await expect(
      asScoring("select 1 from public.assessment_session_items"),
    ).resolves.toBeUndefined();
    await expect(asScoring("select 1 from public.assessment_sessions")).resolves.toBeUndefined();
    await expect(asScoring("select 1 from public.session_responses")).resolves.toBeUndefined();
  });

  it.each([
    ["profiles", "select 1 from public.profiles"],
    ["exam_attempts", "select 1 from public.exam_attempts"],
    ["exam_sessions", "select 1 from public.exam_sessions"],
    ["exam_responses", "select 1 from public.exam_responses"],
    ["essay_marks", "select 1 from public.essay_marks"],
    ["subscriptions", "select 1 from public.subscriptions"],
    ["manual_marks", "select 1 from public.manual_marks"],
    ["assessment_results", "select 1 from public.assessment_results"],
  ])("cannot read %s", async (_label, sql) => {
    await expect(asScoring(sql)).rejects.toMatchObject({ code: "42501" });
  });

  it("can insert a result but cannot read results back", async () => {
    /* Write-only on assessment_results is a deliberate consequence of granting
       INSERT without SELECT: the role can record the score it computed and
       cannot enumerate anybody else's. */
    await expect(asScoring("select * from public.assessment_results")).rejects.toMatchObject({
      code: "42501",
    });
  });

  it.each([
    [`update public.session_responses set response_value = '"forged"'::jsonb`],
    [`update public.session_responses set client_sequence = 99`],
    [`delete from public.session_responses`],
    [`truncate public.item_answer_versions`],
    [`update public.assessment_session_items set global_ordinal = 2`],
    [`delete from public.assessment_sessions`],
  ])("cannot alter the evidence it scores: %s", async (sql) => {
    await expect(asScoring(sql)).rejects.toMatchObject({ code: "42501" });
  });

  it.each([
    [`create table public.scoring_backdoor (id int)`],
    [`create role scoring_backdoor`],
  ])("cannot create objects or roles: %s", async (sql) => {
    /* 42501 for the table (no CREATE on schema public), 42501 for the role
       (NOCREATEROLE). Both are permission denials. */
    await expect(asScoring(sql)).rejects.toMatchObject({ code: "42501" });
  });
});

describe("known platform exposure: pg_net is reachable by every role", () => {
  /* CHARACTERIZATION TEST, not a guarantee. ADR-006 Amendment A records this as
     a residual risk the application cannot close: net.http_request_queue carries
     arwdDxtm for PUBLIC and net.http_delete has a null ACL, so any role — the
     scoring role, anon, authenticated — can cause an outbound HTTP request. The
     objects are owned by supabase_admin, and the migration role is neither the
     owner nor a member nor a superuser, so REVOKE is a no-op that emits a
     notice rather than an error.

     It is asserted here so the exposure is a recorded fact rather than an
     unnoticed one. IF THIS TEST FAILS BECAUSE THE EXPOSURE WAS REMEDIATED —
     someone with supabase_admin ran the revoke, or pg_net was dropped — that is
     good news: delete this test and the residual-risk section of the ADR. */
  it("records that the scoring role can still reach the pg_net queue", async () => {
    const installed = await client.query(`select 1 from pg_namespace where nspname = 'net'`);
    if (installed.rowCount === 0) return; // pg_net absent: nothing to record.

    const reachable = await client.query<{ can_insert: boolean; can_delete_fn: boolean }>(
      `select has_table_privilege($1, 'net.http_request_queue', 'INSERT') as can_insert,
              has_function_privilege($1, 'net.http_delete(text, jsonb, jsonb, integer, jsonb)', 'EXECUTE')
                as can_delete_fn`,
      [SCORING_ROLE],
    );
    expect(
      reachable.rows[0],
      "pg_net exposure changed — see ADR-006 Amendment A residual risk",
    ).toEqual({ can_insert: true, can_delete_fn: true });
  });
});
