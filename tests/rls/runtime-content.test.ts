/**
 * Coverage for supabase/migrations/20260812090000_runtime_content_projection.sql.
 *
 * The Phase 1 exit gate has two halves. The content half is proved offline in
 * `src/tests/unit/content-projection.test.ts` against the real 1,293-item bank.
 * This is the other half: **answer tables are provably inaccessible to learner
 * roles** (spec §9.3, §17.1), and the projection is immutable once written
 * (§9.2, ADR-003 Amendment A5).
 *
 * The distinction these cases turn on is that RLS is NOT the control here.
 * Elsewhere in this schema a table grants `authenticated` a privilege and a
 * policy narrows it; for the content tables there is no privilege at all, so
 * there is nothing for a policy to narrow. That is deliberate — spec §17.1 says
 * learners must not receive a queryable copy of the published bank, and the one
 * sanctioned reader is a SECURITY DEFINER scoring function that arrives in
 * Phase 2. A permission-denied error is therefore the PASSING result below, and
 * an empty result set would be a failure, because it would mean the privilege
 * exists and only a policy is holding the line.
 *
 * Same harness contract as the other suites here: seed as the unrestricted
 * role, impersonate the way PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, seed, STUDENT_A } from "./fixtures";

let client: Client;

const CONTENT_TABLES = [
  "publication_manifests",
  "items",
  "stimuli",
  "stimulus_versions",
  "item_versions",
  "item_answer_versions",
] as const;

const ITEM_ID = "22222222-0000-0000-0000-0000000000a1";
const VERSION_ID = "22222222-0000-0000-0000-0000000000a2";
const STIMULUS_ID = "22222222-0000-0000-0000-0000000000a3";
const STIMULUS_VERSION_ID = "22222222-0000-0000-0000-0000000000a4";
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

/** A minimal but constraint-satisfying projected item, written as the owner. */
async function seedProjectedItem(target: Client): Promise<void> {
  await target.query(
    `insert into public.stimuli (id, stimulus_code) values ($1, 'stim-test')`,
    [STIMULUS_ID],
  );
  await target.query(
    `insert into public.stimulus_versions (id, stimulus_id, revision, content, content_hash)
     values ($1, $2, 1, '{"body":"passage"}'::jsonb, $3)`,
    [STIMULUS_VERSION_ID, STIMULUS_ID, HASH_B],
  );
  await target.query(
    `insert into public.items (id, item_code, origin, provenance_class)
     values ($1, 'test-item-001', 'original_seed', 'curated_git_authored')`,
    [ITEM_ID],
  );
  await target.query(
    `insert into public.item_versions
       (id, item_id, revision, question_type, prompt, candidate_content, visuals, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available, stimulus_version_id,
        content_schema_version, content_hash, provenance_class, publication_manifest_id,
        published_at, source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic)
     values ($1, $2, 1, 'multiple_choice', 'What is 2 + 2?', '{"options":[]}'::jsonb,
             '[]'::jsonb, '{"altTextProvided":true}'::jsonb, 40, 'easy', 1, $3,
             1, $4, 'curated_git_authored', null, now(), 5, 'naplan_style', 'numeracy',
             'single_option', 'number', 'addition')`,
    [VERSION_ID, ITEM_ID, STIMULUS_VERSION_ID, HASH_A],
  );
  await target.query(
    `insert into public.item_answer_versions (item_version_id, answer_key, private_explanation)
     values ($1, '{"kind":"single_option","optionId":"b"}'::jsonb, 'Because 2 + 2 = 4.')`,
    [VERSION_ID],
  );
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await seedProjectedItem(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("privileges: the content tables grant learners nothing", () => {
  it("grants anon and authenticated no privilege on any of the six tables", async () => {
    const result = await client.query<{ table_name: string; grantee: string; privilege_type: string }>(
      `select table_name, grantee, privilege_type
         from information_schema.role_table_grants
        where table_schema = 'public'
          and grantee in ('anon', 'authenticated')
          and table_name = any($1)`,
      [[...CONTENT_TABLES]],
    );
    /* Includes TRUNCATE, which RLS cannot cover at all — the exact gap
       20260811093000 found on the legacy exam tables and recorded as
       outstanding for the rest of the schema. */
    expect(result.rows).toEqual([]);
  });

  it("grants no column-level privilege on item_answer_versions", async () => {
    const result = await client.query(
      `select 1 from information_schema.column_privileges
        where table_schema = 'public' and table_name = 'item_answer_versions'
          and grantee in ('anon', 'authenticated')`,
    );
    expect(result.rowCount).toBe(0);
  });

  it("exposes no view or function that returns answer rows to authenticated", async () => {
    /* Spec §9.3: "No general answer-read RPC or view may be granted to
       authenticated." Checked as a property of the catalogue rather than a
       list of known-bad names, so a future helper is caught too. */
    const views = await client.query<{ relname: string }>(
      `select c.relname
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('v', 'm')
          and pg_get_viewdef(c.oid) ~* 'item_answer_versions'
          and has_table_privilege('authenticated', c.oid, 'SELECT')`,
    );
    expect(views.rows).toEqual([]);

    /* Two fixes to a check that could never have passed as first written.
       Both are about the query, not about the guarantee — the guarantee holds.

       1. `as materialized`. Written as a plain join, the planner is free to
          apply the pg_get_functiondef filter to pg_proc *before* the
          pg_namespace join, evaluating it against routines outside `public` —
          and pg_get_functiondef raises `"array_agg" is an aggregate function`
          the moment it reaches one. The CTE fences the scan to plain functions
          in `public` first.

       2. Trigger functions are excluded. `reject_content_version_update`
          matched the old pattern because it *mentions* item_answer_versions in
          a comment, and `authenticated` holds the default EXECUTE on it. It is
          not a read path: Postgres refuses to call a trigger-returning function
          directly, and PostgREST does not expose one. Keeping it in the result
          would make this assertion fire on a function that cannot return a row
          to anyone, which teaches the next reader to silence it. */
    const functions = await client.query<{ proname: string; definition: string }>(
      `with public_functions as materialized (
         select p.oid, p.proname
           from pg_proc p
          where p.pronamespace = 'public'::regnamespace
            and p.prokind = 'f'
            and p.prorettype <> 'trigger'::regtype
       )
       select proname, pg_get_functiondef(oid) as definition from public_functions
        where pg_get_functiondef(oid) ~* 'item_answer_versions'
          and has_function_privilege('authenticated', oid, 'EXECUTE')`,
    );

    /* Third fix, same character as the two above: the guarantee is about answer
       DATA, and this query matches the table NAME.

       20260812120000's create_assessment_session joins item_answer_versions to
       decide eligibility — an item with no answer row cannot be scored, so
       allocating one would produce a sitting that can be sat and never marked.
       It selects no column from the table and returns none. Excluding it by
       name would blunt the check; so instead each allowed mention is required
       to prove it is a mention and not a read, by carrying no answer-bearing
       column and no whole-row construct that would smuggle one out.

       An entry here is a claim that has to hold, not a silencer. */
    const MENTIONS_WITHOUT_READING = new Set(["create_assessment_session"]);
    const ANSWER_READ = /answer_key|grading_rules|rubric|private_explanation|to_jsonb|\*\s*from\s+public\.item_answer_versions/i;

    for (const row of functions.rows) {
      expect(
        MENTIONS_WITHOUT_READING.has(row.proname),
        `${row.proname} is executable by authenticated and names item_answer_versions (spec §9.3)`,
      ).toBe(true);
      expect(
        row.definition,
        `${row.proname} may mention item_answer_versions but must not read from it`,
      ).not.toMatch(ANSWER_READ);
    }
  });

  it("enables RLS on all six tables and defines no policy on any of them", async () => {
    const rls = await client.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relrowsecurity and c.relname = any($1)`,
      [[...CONTENT_TABLES]],
    );
    expect(rls.rows.map((row) => row.relname).sort()).toEqual([...CONTENT_TABLES].sort());

    /* Originally "no policy at all", which was the Phase 1 posture. Tightened
       by 20260812110000 to the property that was actually meant: the
       mindmosaic_scoring role (spec §9.3.1) legitimately needs read policies on
       item_versions and item_answer_versions, and RLS applies to it because it
       deliberately has no BYPASSRLS. What must never exist is a policy a
       LEARNER can reach — one naming anon, authenticated, or PUBLIC. */
    const policies = await client.query<{ relname: string; polname: string }>(
      `select c.relname, p.polname
         from pg_policy p join pg_class c on c.oid = p.polrelid
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = any($1)
          and (
            0 = any(p.polroles)
            or exists (
              select 1 from unnest(p.polroles) as role_oid
              join pg_roles r on r.oid = role_oid
              where r.rolname in ('anon', 'authenticated')
            )
          )`,
      [[...CONTENT_TABLES]],
    );
    expect(policies.rows).toEqual([]);
  });
});

describe("a signed-in learner cannot read the projection", () => {
  it("is refused on item_answer_versions — permission denied, not an empty set", async () => {
    await asAuthenticated(client, STUDENT_A);
    /* The assertion that matters: 42501 means no privilege exists. An empty
       result would mean SELECT is granted and only a policy is filtering,
       which is a materially weaker guarantee. */
    await expect(
      client.query("select * from public.item_answer_versions"),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("is refused on every other content table too", async () => {
    /* Each attempt runs inside its own savepoint: a permission error aborts
       the surrounding (sub)transaction, so without one the first refusal would
       poison every later statement and the rest of the loop would pass for the
       wrong reason. `set local role` is rolled back with the savepoint, which
       is why no explicit `reset role` is needed. */
    for (const table of CONTENT_TABLES) {
      await client.query("savepoint sp");
      await asAuthenticated(client, STUDENT_A);
      await expect(
        client.query(`select * from public.${table}`),
        `${table} must be unreadable`,
      ).rejects.toMatchObject({ code: "42501" });
      await client.query("rollback to savepoint sp");
      await client.query("release savepoint sp");
    }
  });

  it("cannot write to the projection either", async () => {
    await client.query("savepoint sp");
    await asAuthenticated(client, STUDENT_A);
    await expect(
      client.query(
        `insert into public.items (item_code, origin, provenance_class)
         values ('forged-001', 'original_seed', 'curated_git_authored')`,
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");
  });
});

describe("immutability holds for every role, including the owner", () => {
  it("refuses an in-place edit of learner-visible content", async () => {
    /* Running as the unrestricted role on purpose: revoking learner privileges
       would not stop the projection job itself from editing content in place,
       and that is the failure immutable versioning exists to prevent. */
    await expect(
      client.query(`update public.item_versions set prompt = 'edited' where id = $1`, [VERSION_ID]),
    ).rejects.toMatchObject({ code: "MM101" });
  });

  it("refuses an edit of the content hash or the provenance link", async () => {
    await client.query("savepoint sp");
    await expect(
      client.query(`update public.item_versions set content_hash = $2 where id = $1`, [
        VERSION_ID,
        "c".repeat(64),
      ]),
    ).rejects.toMatchObject({ code: "MM101" });
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");

    await expect(
      client.query(
        `update public.item_versions set provenance_class = 'factory_manifest' where id = $1`,
        [VERSION_ID],
      ),
    ).rejects.toMatchObject({ code: "MM101" });
  });

  it("allows re-stamping projected_at, which is not content", async () => {
    const result = await client.query(
      `update public.item_versions set projected_at = now() where id = $1`,
      [VERSION_ID],
    );
    expect(result.rowCount).toBe(1);
  });

  it("refuses any edit to an answer version or a stimulus version", async () => {
    await client.query("savepoint sp");
    await expect(
      client.query(
        `update public.item_answer_versions set answer_key = '{"kind":"single_option","optionId":"a"}'::jsonb
          where item_version_id = $1`,
        [VERSION_ID],
      ),
    ).rejects.toMatchObject({ code: "MM101" });
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");

    await expect(
      client.query(`update public.stimulus_versions set content = '{}'::jsonb where id = $1`, [
        STIMULUS_VERSION_ID,
      ]),
    ).rejects.toMatchObject({ code: "MM101" });
  });
});

describe("the provenance constraint", () => {
  it("refuses a factory version with no manifest", async () => {
    await expect(
      client.query(
        `insert into public.item_versions
           (item_id, revision, question_type, prompt, candidate_content, accessibility,
            estimated_time_seconds, authored_difficulty, marks_available,
            content_schema_version, content_hash, provenance_class, publication_manifest_id,
            published_at, source_year_level, source_exam_style, source_subject)
         values ($1, 2, 'multiple_choice', 'p', '{}'::jsonb, '{}'::jsonb, 30, 'easy', 1,
                 1, $2, 'factory_manifest', null, now(), 5, 'naplan_style', 'numeracy')`,
        [ITEM_ID, "d".repeat(64)],
      ),
    ).rejects.toMatchObject({ constraint: "item_versions_manifest_matches_provenance" });
  });

  it("accepts a curated version with no manifest — the whole point of nullable", async () => {
    const result = await client.query(
      `insert into public.item_versions
         (item_id, revision, question_type, prompt, candidate_content, accessibility,
          estimated_time_seconds, authored_difficulty, marks_available,
          content_schema_version, content_hash, provenance_class, publication_manifest_id,
          published_at, source_year_level, source_exam_style, source_subject)
       values ($1, 2, 'multiple_choice', 'p', '{}'::jsonb, '{}'::jsonb, 30, 'easy', 1,
               1, $2, 'curated_git_authored', null, now(), 5, 'naplan_style', 'numeracy')`,
      [ITEM_ID, "e".repeat(64)],
    );
    expect(result.rowCount).toBe(1);
  });

  it("refuses a duplicate content hash across items — the dedupe guarantee", async () => {
    await expect(
      client.query(
        `insert into public.items (item_code, origin, provenance_class)
         values ('test-item-002', 'original_seed', 'curated_git_authored')`,
      ).then(() =>
        client.query(
          `insert into public.item_versions
             (item_id, revision, question_type, prompt, candidate_content, accessibility,
              estimated_time_seconds, authored_difficulty, marks_available,
              content_schema_version, content_hash, provenance_class, published_at,
              source_year_level, source_exam_style, source_subject)
           select id, 1, 'multiple_choice', 'p', '{}'::jsonb, '{}'::jsonb, 30, 'easy', 1,
                  1, $1, 'curated_git_authored', now(), 5, 'naplan_style', 'numeracy'
             from public.items where item_code = 'test-item-002'`,
          [HASH_A],
        ),
      ),
    ).rejects.toMatchObject({ constraint: "item_versions_content_hash_key" });
  });

  it("refuses a second stimulus version with the same content hash", async () => {
    await expect(
      client.query(
        `insert into public.stimulus_versions (stimulus_id, revision, content, content_hash)
         values ($1, 2, '{"body":"passage"}'::jsonb, $2)`,
        [STIMULUS_ID, HASH_B],
      ),
    ).rejects.toMatchObject({ constraint: "stimulus_versions_content_hash_key" });
  });
});
