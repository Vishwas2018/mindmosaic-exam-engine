/**
 * RLS, privilege and integrity coverage for
 * supabase/migrations/20260812100000_assessment_session_model.sql — the Phase 2
 * expand step (spec §12.2–§12.6, ADR-005, ADR-006).
 *
 * The distinction every case here turns on is the one 20260812090000
 * established for the content tables and this migration extends to the session
 * model: **privilege, not policy, is the write boundary.** Nine new tables, and
 * `authenticated` holds no INSERT, UPDATE, DELETE or TRUNCATE on any of them.
 * So a `42501` permission-denied error is the PASSING result below, and an
 * empty result set or a silent no-op would be a failure — it would mean the
 * privilege exists and only a policy is holding the line.
 *
 * TRUNCATE gets its own per-table case because RLS cannot cover it at all:
 * there is no per-row filter to apply, so the grant is the only control. That
 * is exactly the hole the repository audit found on all 17 pre-existing public
 * tables, which 20260811093000 closed for three of them and
 * docs/adr/phase0-legacy-session-inventory.md §7 recorded as still open for the
 * rest. Repeating it on the target model would carry the defect forward, so it
 * is asserted table by table rather than in aggregate.
 *
 * Same harness contract as the other suites here: seed as the unrestricted
 * role, impersonate the way PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, seed, STUDENT_A, STUDENT_B, PARENT_C } from "./fixtures";

/** Every table the migration creates. Used by the privilege sweeps. */
const SESSION_MODEL_TABLES = [
  "assessment_sessions",
  "assessment_session_stages",
  "assessment_session_items",
  "session_responses",
  "stage_transitions",
  "assessment_results",
  "manual_marks",
  "outbox_events",
  "idempotency_keys",
] as const;

/** The three with an application reader; everything else is definer-only. */
const READABLE_TABLES = [
  "assessment_sessions",
  "assessment_results",
  "manual_marks",
] as const;

const DEFINER_ONLY_TABLES = SESSION_MODEL_TABLES.filter(
  (table) => !READABLE_TABLES.includes(table as (typeof READABLE_TABLES)[number]),
);

const TEACHER_OF_A = "00000000-0000-0000-0000-00000000001a";
const OTHER_TEACHER = "00000000-0000-0000-0000-00000000001b";
const CLASS_ID = "33333333-0000-0000-0000-00000000000a";

const SESSION_A = "44444444-0000-0000-0000-00000000000a";
const SESSION_B = "44444444-0000-0000-0000-00000000000b";
const ITEM_ID = "55555555-0000-0000-0000-0000000000a1";
const VERSION_ID = "55555555-0000-0000-0000-0000000000a2";
const SESSION_ITEM_A = "55555555-0000-0000-0000-0000000000a3";
const HASH_A = "a".repeat(64);

let client: Client;

/** A minimal projected item, so the ledger has something real to pin. */
async function seedContent(target: Client): Promise<void> {
  await target.query(
    `insert into public.items (id, item_code, origin, provenance_class)
     values ($1, 'session-model-item-001', 'original_seed', 'curated_git_authored')`,
    [ITEM_ID],
  );
  await target.query(
    `insert into public.item_versions
       (id, item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic)
     values ($1, $2, 1, 'multiple_choice', 'What is 2 + 2?', '{"options":[]}'::jsonb,
             '{"altTextProvided":true}'::jsonb, 40, 'easy', 1, 1, $3,
             'curated_git_authored', now(), 5, 'naplan_style', 'numeracy',
             'single_option', 'number', 'addition')`,
    [VERSION_ID, ITEM_ID, HASH_A],
  );
  await target.query(
    `insert into public.item_answer_versions (item_version_id, answer_key)
     values ($1, '{"kind":"single_option","optionId":"b"}'::jsonb)`,
    [VERSION_ID],
  );
}

/** One open target session for student A, one for student B. */
async function seedSessions(target: Client): Promise<void> {
  for (const [id, student] of [
    [SESSION_A, STUDENT_A],
    [SESSION_B, STUDENT_B],
  ] as const) {
    await target.query(
      `insert into public.assessment_sessions
         (id, student_id, assessment_profile_version, framework_version, blueprint_version,
          taxonomy_version, engine_algorithm_version, scoring_algorithm_version,
          content_build_version, seed, config, expires_at)
       values ($1, $2, 'profile-v1', 'framework-v1', 'blueprint-v1', 'taxonomy-v1',
               'fixed-v1', 'objective-v1', 'build-test', 'seed-1', '{}'::jsonb,
               now() + interval '1 hour')`,
      [id, student],
    );
  }

  await target.query(
    `insert into public.assessment_session_items
       (id, session_id, global_ordinal, within_stage_ordinal, item_id, item_version_id,
        content_hash, seed)
     values ($1, $2, 1, 1, $3, $4, $5, 'seed-1')`,
    [SESSION_ITEM_A, SESSION_A, ITEM_ID, VERSION_ID, HASH_A],
  );
  await target.query(
    `insert into public.session_responses (session_id, session_item_id, response_value, client_sequence)
     values ($1, $2, '"b"'::jsonb, 1)`,
    [SESSION_A, SESSION_ITEM_A],
  );
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);

  await client.query(`insert into auth.users (id, email) values ($1, $2), ($3, $4)`, [
    TEACHER_OF_A,
    "session-teacher-a@test.local",
    OTHER_TEACHER,
    "session-teacher-other@test.local",
  ]);
  await client.query(`update public.profiles set role = 'teacher' where id in ($1, $2)`, [
    TEACHER_OF_A,
    OTHER_TEACHER,
  ]);
  await client.query(
    `insert into public.classes (id, teacher_id, name) values ($1, $2, 'Session Class A')`,
    [CLASS_ID, TEACHER_OF_A],
  );
  await client.query(
    `insert into public.class_students (class_id, student_id) values ($1, $2)`,
    [CLASS_ID, STUDENT_A],
  );

  await seedContent(client);
  await seedSessions(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

/** Runs `body` inside a savepoint, so an expected error cannot poison the rest. */
async function inSavepoint(body: () => Promise<void>): Promise<void> {
  await client.query("savepoint sp");
  try {
    await body();
  } finally {
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");
  }
}

describe("privileges: the session model grants learners no write, anywhere", () => {
  it("grants anon and authenticated no INSERT/UPDATE/DELETE/TRUNCATE on any of the nine tables", async () => {
    const result = await client.query<{
      table_name: string;
      grantee: string;
      privilege_type: string;
    }>(
      `select table_name, grantee, privilege_type
         from information_schema.role_table_grants
        where table_schema = 'public'
          and grantee in ('anon', 'authenticated')
          and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
          and table_name = any($1)`,
      [[...SESSION_MODEL_TABLES]],
    );
    expect(result.rows).toEqual([]);
  });

  it("grants anon nothing at all", async () => {
    const result = await client.query(
      `select 1 from information_schema.role_table_grants
        where table_schema = 'public' and grantee = 'anon' and table_name = any($1)`,
      [[...SESSION_MODEL_TABLES]],
    );
    expect(result.rowCount).toBe(0);
  });

  it("grants SELECT on exactly the three reader tables and no others", async () => {
    const result = await client.query<{ table_name: string }>(
      `select distinct table_name from information_schema.role_table_grants
        where table_schema = 'public' and grantee = 'authenticated'
          and privilege_type = 'SELECT' and table_name = any($1)
        order by table_name`,
      [[...SESSION_MODEL_TABLES]],
    );
    expect(result.rows.map((row) => row.table_name)).toEqual([...READABLE_TABLES].sort());
  });

  /* The per-table case the aggregate above cannot replace. RLS never applies to
     TRUNCATE, so this is the only thing standing between `authenticated` and
     an empty assessment_results table. */
  it.each([...SESSION_MODEL_TABLES])("refuses TRUNCATE on %s", async (table) => {
    await inSavepoint(async () => {
      await asAuthenticated(client, STUDENT_A);
      await expect(
        client.query(`truncate table public.${table}`),
        `${table} must not be truncatable by a learner`,
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it.each([...SESSION_MODEL_TABLES])("refuses DELETE on %s", async (table) => {
    await inSavepoint(async () => {
      await asAuthenticated(client, STUDENT_A);
      await expect(
        client.query(`delete from public.${table}`),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("refuses a forged session — a learner cannot create their own paper", async () => {
    await inSavepoint(async () => {
      await asAuthenticated(client, STUDENT_A);
      await expect(
        client.query(
          `insert into public.assessment_sessions
             (student_id, assessment_profile_version, framework_version, blueprint_version,
              taxonomy_version, engine_algorithm_version, scoring_algorithm_version,
              content_build_version, seed, config, expires_at)
           values ($1, 'p', 'f', 'b', 't', 'e', 's', 'c', 'chosen-by-me', '{}'::jsonb,
                   now() + interval '1 hour')`,
          [STUDENT_A],
        ),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("refuses a forged result — a learner cannot write their own score", async () => {
    await inSavepoint(async () => {
      await asAuthenticated(client, STUDENT_A);
      await expect(
        client.query(
          `insert into public.assessment_results
             (session_id, student_id, scoring_algorithm_version, total_items, attempted_items,
              auto_marked_items, manual_review_items, correct_count, incorrect_count,
              unanswered_count, objective_awarded_marks, objective_available_marks,
              objective_percentage, time_taken_seconds, started_at, submitted_at,
              submission_reason)
           values ($1, $2, 'objective-v1', 1, 1, 1, 0, 1, 0, 0, 1, 1, 100, 10,
                   now(), now(), 'user_submitted')`,
          [SESSION_A, STUDENT_A],
        ),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });
});

describe("the definer-only tables are unreadable, not merely filtered", () => {
  it.each(DEFINER_ONLY_TABLES)("refuses SELECT on %s with permission denied", async (table) => {
    await inSavepoint(async () => {
      await asAuthenticated(client, STUDENT_A);
      /* 42501 means no privilege exists. An empty result would mean SELECT is
         granted and only a policy is filtering — materially weaker, and for
         assessment_session_items specifically it would be a learner-reachable
         view of the exposure ledger (§17.1). */
      await expect(
        client.query(`select * from public.${table}`),
        `${table} must be unreadable`,
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("defines no RLS policy on any of them that a learner can reach", async () => {
    /* Originally "no policy at all". Tightened by 20260812110000: the
       mindmosaic_scoring role (spec §9.3.1) legitimately holds read/write
       policies on assessment_session_items and session_responses, and RLS
       applies to it because it deliberately has no BYPASSRLS. The invariant
       that matters is that no policy names a role a learner can present. */
    const result = await client.query<{ relname: string; polname: string }>(
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
      [DEFINER_ONLY_TABLES],
    );
    expect(result.rows).toEqual([]);
  });

  it("exposes no view that leaks the ledger or the responses to authenticated", async () => {
    const views = await client.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('v', 'm')
          and pg_get_viewdef(c.oid) ~* '(assessment_session_items|session_responses)'
          and has_table_privilege('authenticated', c.oid, 'SELECT')`,
    );
    expect(views.rows).toEqual([]);
  });
});

describe("read isolation on the three reader tables", () => {
  beforeEach(async () => {
    await client.query(
      `insert into public.assessment_results
         (session_id, student_id, scoring_algorithm_version, total_items, attempted_items,
          auto_marked_items, manual_review_items, correct_count, incorrect_count,
          unanswered_count, objective_awarded_marks, objective_available_marks,
          objective_percentage, time_taken_seconds, started_at, submitted_at,
          submission_reason)
       values ($1, $2, 'objective-v1', 1, 1, 1, 0, 1, 0, 0, 1, 1, 100, 10,
               now(), now(), 'user_submitted')`,
      [SESSION_A, STUDENT_A],
    );
  });

  it("lets a student read their own session and result", async () => {
    await asAuthenticated(client, STUDENT_A);
    const sessions = await client.query(`select id from public.assessment_sessions`);
    expect(sessions.rows.map((row) => row.id)).toEqual([SESSION_A]);
    const results = await client.query(`select session_id from public.assessment_results`);
    expect(results.rows.map((row) => row.session_id)).toEqual([SESSION_A]);
  });

  it("hides another student's session and result", async () => {
    await asAuthenticated(client, STUDENT_B);
    const sessions = await client.query(`select id from public.assessment_sessions`);
    expect(sessions.rows.map((row) => row.id)).toEqual([SESSION_B]);
    const results = await client.query(`select session_id from public.assessment_results`);
    expect(results.rows).toEqual([]);
  });

  it("lets a linked parent read their own child's session and result, and nobody else's", async () => {
    await asAuthenticated(client, PARENT_C);
    const sessions = await client.query(`select id from public.assessment_sessions`);
    /* PARENT_C is linked to STUDENT_A only (see fixtures.ts). */
    expect(sessions.rows.map((row) => row.id)).toEqual([SESSION_A]);
  });

  it("lets the class teacher read their own student, and refuses another teacher", async () => {
    await inSavepoint(async () => {
      await asAuthenticated(client, TEACHER_OF_A);
      const mine = await client.query(`select id from public.assessment_sessions`);
      expect(mine.rows.map((row) => row.id)).toEqual([SESSION_A]);
    });

    await asAuthenticated(client, OTHER_TEACHER);
    const theirs = await client.query(`select id from public.assessment_sessions`);
    expect(theirs.rows).toEqual([]);
  });

  it("shows an unauthenticated caller nothing", async () => {
    await asAnon(client);
    await expect(
      client.query(`select id from public.assessment_sessions`),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("keeps manual marks to the class teacher, matching essay_marks exactly", async () => {
    await client.query(
      `insert into public.manual_marks
         (session_id, session_item_id, marked_by, awarded_marks, max_marks)
       values ($1, $2, $3, 3, 5)`,
      [SESSION_A, SESSION_ITEM_A, TEACHER_OF_A],
    );

    await inSavepoint(async () => {
      await asAuthenticated(client, TEACHER_OF_A);
      const seen = await client.query(`select id from public.manual_marks`);
      expect(seen.rowCount).toBe(1);
    });

    await inSavepoint(async () => {
      await asAuthenticated(client, OTHER_TEACHER);
      const seen = await client.query(`select id from public.manual_marks`);
      expect(seen.rows).toEqual([]);
    });

    /* No student or parent policy exists on essay_marks and none is added here;
       widening that would be a product change smuggled in as a migration. */
    await asAuthenticated(client, STUDENT_A);
    const asStudent = await client.query(`select id from public.manual_marks`);
    expect(asStudent.rows).toEqual([]);
  });
});

describe("immutability holds for every role, including the owner", () => {
  /* Running as the unrestricted role on purpose: revoking learner privileges
     does nothing to stop a privileged job editing submitted evidence in place,
     and that is the failure §5.3's "immutable evidence" exists to prevent. */

  it("refuses any edit to the served-item ledger", async () => {
    await expect(
      client.query(
        `update public.assessment_session_items set global_ordinal = 2 where id = $1`,
        [SESSION_ITEM_A],
      ),
    ).rejects.toMatchObject({ code: "MM201" });
  });

  it("still allows the ledger to cascade away with its session, so erasure works", async () => {
    /* The append-only trigger covers UPDATE and deliberately not DELETE: a
       before-delete trigger fires on cascade too, and blocking it would make a
       child's records undeletable, breaking §17.5 / ADR-012 erasure. */
    const deleted = await client.query(`delete from public.assessment_sessions where id = $1`, [
      SESSION_A,
    ]);
    expect(deleted.rowCount).toBe(1);
    const orphans = await client.query(
      `select 1 from public.assessment_session_items where session_id = $1`,
      [SESSION_A],
    );
    expect(orphans.rowCount).toBe(0);
  });

  it("refuses an edit to a recorded result", async () => {
    await client.query(
      `insert into public.assessment_results
         (session_id, student_id, scoring_algorithm_version, total_items, attempted_items,
          auto_marked_items, manual_review_items, correct_count, incorrect_count,
          unanswered_count, objective_awarded_marks, objective_available_marks,
          objective_percentage, time_taken_seconds, started_at, submitted_at,
          submission_reason)
       values ($1, $2, 'objective-v1', 1, 1, 1, 0, 1, 0, 0, 1, 1, 100, 10,
               now(), now(), 'user_submitted')`,
      [SESSION_A, STUDENT_A],
    );
    await expect(
      client.query(
        `update public.assessment_results set objective_percentage = 100 where session_id = $1`,
        [SESSION_A],
      ),
    ).rejects.toMatchObject({ code: "MM201" });
  });

  it("refuses a response write once the session is terminal", async () => {
    await client.query(
      `update public.assessment_sessions
          set status = 'submitted', submitted_at = now(), version = version + 1
        where id = $1`,
      [SESSION_A],
    );

    /* This is the guarantee 20260811092000 gives on the legacy path via
       session_has_attempt(), reproduced one level stronger: there it was an RLS
       policy and so bound only the caller's own JWT; here it binds every role,
       and these statements run as the unrestricted one.

       Each in its own savepoint: a raised exception aborts the surrounding
       (sub)transaction, so without one the second assertion would fail with
       25P02 rather than exercising the trigger at all. */
    await inSavepoint(async () => {
      await expect(
        client.query(
          `update public.session_responses set response_value = '"c"'::jsonb where session_id = $1`,
          [SESSION_A],
        ),
      ).rejects.toMatchObject({ code: "MM202" });
    });

    await inSavepoint(async () => {
      await expect(
        client.query(
          `insert into public.session_responses (session_id, session_item_id, response_value)
           values ($1, $2, '"c"'::jsonb)`,
          [SESSION_A, SESSION_ITEM_A],
        ),
      ).rejects.toMatchObject({ code: "MM202" });
    });
  });
});

describe("the session lifecycle is a closed set of transitions (§12.8)", () => {
  it("refuses a transition that is not in the graph", async () => {
    await client.query(
      `update public.assessment_sessions
          set status = 'submitted', submitted_at = now(), version = version + 1
        where id = $1`,
      [SESSION_A],
    );
    await expect(
      client.query(
        `update public.assessment_sessions
            set status = 'active', submitted_at = null, version = version + 1
          where id = $1`,
        [SESSION_A],
      ),
    ).rejects.toMatchObject({ code: "MM207" });
  });

  it("refuses an update that does not advance the optimistic lock", async () => {
    await expect(
      client.query(
        `update public.assessment_sessions set status = 'active' where id = $1`,
        [SESSION_A],
      ),
    ).rejects.toMatchObject({ code: "MM207" });
  });

  it("refuses re-pointing a live session at a legacy source", async () => {
    /* ADR-005 §1: this is precisely how a session would acquire a second
       authoritative record after creation. */
    const legacy = await client.query<{ id: string }>(
      `select id from public.exam_sessions where student_id = $1`,
      [STUDENT_A],
    );
    await expect(
      client.query(
        `update public.assessment_sessions
            set legacy_session_id = $2, version = version + 1
          where id = $1`,
        [SESSION_A, legacy.rows[0].id],
      ),
    ).rejects.toMatchObject({ code: "MM207" });
  });
});

describe("the constraints that carry a spec rule", () => {
  it("refuses a version-pinned claim on a session with no legacy source it could be unversioned from", async () => {
    await expect(
      client.query(
        `insert into public.assessment_sessions
           (student_id, assessment_profile_version, framework_version, blueprint_version,
            taxonomy_version, engine_algorithm_version, scoring_algorithm_version,
            content_build_version, seed, config, expires_at, content_identity)
         values ($1, 'p', 'f', 'b', 't', 'e', 's', 'c', 'seed', '{}'::jsonb,
                 now() + interval '1 hour', 'legacy_unversioned')`,
        [STUDENT_A],
      ),
    ).rejects.toMatchObject({
      constraint: "assessment_sessions_unversioned_only_from_legacy",
    });
  });

  it("requires forced reuse to say why (§13.2)", async () => {
    await expect(
      client.query(
        `insert into public.assessment_session_items
           (session_id, global_ordinal, within_stage_ordinal, item_id, item_version_id,
            content_hash, seed, allocation_reason)
         values ($1, 2, 2, $2, $3, $4, 'seed-1', 'forced_reuse')`,
        [SESSION_B, ITEM_ID, VERSION_ID, HASH_A],
      ),
    ).rejects.toMatchObject({
      constraint: "assessment_session_items_forced_reuse_explained",
    });
  });

  it("refuses fabricated correctness on a manual-review response (§14.3)", async () => {
    await expect(
      client.query(
        `update public.session_responses
            set score_status = 'manual_review', is_correct = false, awarded_marks = 0
          where session_id = $1`,
        [SESSION_A],
      ),
    ).rejects.toMatchObject({
      constraint: "session_responses_manual_review_has_no_correctness",
    });
  });

  it("refuses the same item twice in one sitting", async () => {
    await expect(
      client.query(
        `insert into public.assessment_session_items
           (session_id, global_ordinal, within_stage_ordinal, item_id, item_version_id,
            content_hash, seed)
         values ($1, 2, 2, $2, $3, $4, 'seed-1')`,
        [SESSION_A, ITEM_ID, VERSION_ID, HASH_A],
      ),
    ).rejects.toMatchObject({
      constraint: "assessment_session_items_item_once_per_session",
    });
  });

  it("refuses a response that is neither pinned nor legacy-identified", async () => {
    await expect(
      client.query(
        `insert into public.session_responses (session_id, response_value)
         values ($1, '"b"'::jsonb)`,
        [SESSION_B],
      ),
    ).rejects.toMatchObject({ constraint: "session_responses_one_identity_branch" });
  });

  it("refuses a preserved legacy result with no source attempt, and vice versa", async () => {
    await expect(
      client.query(
        `insert into public.assessment_results
           (session_id, student_id, scoring_algorithm_version, total_items, attempted_items,
            auto_marked_items, manual_review_items, correct_count, incorrect_count,
            unanswered_count, objective_awarded_marks, objective_available_marks,
            objective_percentage, time_taken_seconds, started_at, submitted_at,
            submission_reason, legacy_result)
         values ($1, $2, 'objective-v1', 1, 1, 1, 0, 1, 0, 0, 1, 1, 100, 10,
                 now(), now(), 'user_submitted', '{"totalQuestions":1}'::jsonb)`,
        [SESSION_A, STUDENT_A],
      ),
    ).rejects.toMatchObject({ constraint: "assessment_results_legacy_pair_complete" });
  });
});
