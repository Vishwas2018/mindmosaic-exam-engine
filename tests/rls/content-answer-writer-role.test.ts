/**
 * The least-privilege proof for `mindmosaic_content_answer_writer`
 * (supabase/migrations/20260902090000_content_answer_writer_role.sql, spec
 * v1.2 §9.3.1, ADR-006 Amendment A).
 *
 * The write-side twin of tests/rls/assessment-scoring-role.test.ts — see that
 * file's header for why both a catalogue check and a behavioural check are
 * needed, and why probes run on one long-lived connection rather than one per
 * test. This file additionally proves the two roles stay disjoint: the
 * writer cannot read, and the reader (mindmosaic_scoring) cannot write.
 */
import { randomUUID } from "node:crypto";
import type { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { connect, connectAsContentAnswerWriterRole, connectAsScoringRole } from "./db";
import { seed } from "./fixtures";

const WRITER_ROLE = "mindmosaic_content_answer_writer";

/** Exactly the table-level grant 20260902090000 issues. Nothing else. */
const EXPECTED_TABLE_GRANTS = ["item_answer_versions:INSERT"] as const;

let client: Client;
/** A real connection as the writer role — see connectAsContentAnswerWriterRole's note. */
let writer: Client | undefined;
/** A real connection as the scoring role, used only for the disjointness check below. */
let scoring: Client | undefined;

/**
 * One committed item_versions row, visible across every connection in this
 * file. It has to be genuinely committed rather than created inside a test's
 * rolled-back transaction: item_answer_versions.item_version_id references
 * item_versions(id), and a different role's connection cannot see another
 * connection's uncommitted row. A short-lived, autocommitting `postgres`
 * connection creates it here; afterAll deletes it the same way.
 */
let itemId: string;
let itemVersionId: string;
const CONTENT_HASH = "1".repeat(64);

beforeAll(async () => {
  const setup = await connect();
  itemId = randomUUID();
  itemVersionId = randomUUID();
  await setup.query(
    `insert into public.items (id, item_code, origin, provenance_class)
     values ($1, $2, 'manual_owner', 'curated_git_authored')`,
    [itemId, `rls-writer-fixture-${itemVersionId}`],
  );
  await setup.query(
    `insert into public.item_versions
       (id, item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available, content_schema_version,
        content_hash, provenance_class, published_at, source_year_level, source_exam_style,
        source_subject)
     values
       ($1, $2, 1, 'multiple_choice', 'RLS fixture prompt', '{}'::jsonb, '{}'::jsonb,
        60, 'easy', 1, 2, $3, 'curated_git_authored', now(), 5, 'naplan_style', 'numeracy')`,
    [itemVersionId, itemId, CONTENT_HASH],
  );
  await setup.end();

  writer = await connectAsContentAnswerWriterRole();
  await writer.query("begin");

  scoring = await connectAsScoringRole();
  await scoring.query("begin");
});

afterAll(async () => {
  if (writer !== undefined) {
    await writer.query("rollback").catch(() => undefined);
    await writer.end();
  }
  if (scoring !== undefined) {
    await scoring.query("rollback").catch(() => undefined);
    await scoring.end();
  }
  const cleanup = await connect();
  await cleanup.query("delete from public.item_versions where id = $1", [itemVersionId]);
  await cleanup.query("delete from public.items where id = $1", [itemId]);
  await cleanup.end();
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

/** Runs one statement on the writer connection, isolated by a savepoint. */
async function asWriter(sql: string, params: unknown[] = []): Promise<void> {
  if (writer === undefined) throw new Error("no writer connection");
  const connection = writer;
  await connection.query("savepoint sp");
  try {
    await connection.query(sql, params);
  } finally {
    await connection.query("rollback to savepoint sp");
    await connection.query("release savepoint sp");
  }
}

/** Runs one statement on the scoring connection, isolated by a savepoint. */
async function asScoring(sql: string, params: unknown[] = []): Promise<void> {
  if (scoring === undefined) throw new Error("no scoring connection");
  const connection = scoring;
  await connection.query("savepoint sp");
  try {
    await connection.query(sql, params);
  } finally {
    await connection.query("rollback to savepoint sp");
    await connection.query("release savepoint sp");
  }
}

describe("the content answer writer role is a narrow credential, not a second service_role", () => {
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
      [WRITER_ROLE],
    );
    expect(result.rowCount).toBe(1);
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
    const result = await client.query(
      `select r.rolname from pg_auth_members am
         join pg_roles member on member.oid = am.member
         join pg_roles r on r.oid = am.roleid
        where member.rolname = $1`,
      [WRITER_ROLE],
    );
    expect(result.rows).toEqual([]);
  });

  it("is not service_role, mindmosaic_scoring, anon or authenticated", async () => {
    for (const other of ["service_role", "mindmosaic_scoring", "anon", "authenticated"]) {
      const same = await client.query<{ same: boolean }>(
        `select (select oid from pg_roles where rolname = $1)
              = (select oid from pg_roles where rolname = $2) as same`,
        [WRITER_ROLE, other],
      );
      expect(same.rows[0]!.same, `${WRITER_ROLE} must not be ${other}`).toBe(false);
    }
  });
});

describe("the content answer writer role holds exactly its intended grant", () => {
  it("holds exactly one table-level grant: INSERT on item_answer_versions", async () => {
    const result = await client.query<{ grant: string }>(
      `select table_name::text || ':' || privilege_type::text as grant
         from information_schema.role_table_grants
        where grantee = $1
        order by 1`,
      [WRITER_ROLE],
    );
    /* Set equality, not a subset check — a new grant anywhere in the schema
       to this role fails here, which is the whole point. */
    expect(result.rows.map((row) => row.grant)).toEqual([...EXPECTED_TABLE_GRANTS]);
  });

  it("holds no column-level grant beyond what its one INSERT implies", async () => {
    /* PostgreSQL's information_schema.column_privileges expands a table-level
       grant into one row per column for privilege types meaningful at column
       granularity — INSERT included — so eight rows (one per
       item_answer_versions column) is the correct shape for exactly one
       table-level INSERT grant, not a second, wider privilege. What matters
       is that every row is that same INSERT on that same table. */
    const result = await client.query<{ table_name: string; privilege_type: string }>(
      `select table_name::text, privilege_type::text
         from information_schema.column_privileges where grantee = $1`,
      [WRITER_ROLE],
    );
    expect(result.rowCount).toBe(8);
    expect(
      result.rows.every(
        (row) => row.table_name === "item_answer_versions" && row.privilege_type === "INSERT",
      ),
    ).toBe(true);
  });

  it("holds no privilege on any other schema's objects", async () => {
    const result = await client.query<{ table_schema: string }>(
      `select distinct table_schema::text from information_schema.role_table_grants
        where grantee = $1 and table_schema <> 'public'`,
      [WRITER_ROLE],
    );
    expect(result.rows).toEqual([]);
  });
});

describe("the answer table stays unreachable to learners", () => {
  it("grants anon and authenticated nothing on item_answer_versions", async () => {
    const result = await client.query(
      `select 1 from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'item_answer_versions'
          and grantee in ('anon', 'authenticated')`,
    );
    expect(result.rowCount).toBe(0);
  });

  it("defines no policy on item_answer_versions naming anon, authenticated or PUBLIC", async () => {
    /* Both mindmosaic_scoring and mindmosaic_content_answer_writer legitimately
       have a policy here now, so "no policy at all" is not the invariant —
       the one that matters is that no policy names a role a learner can
       present. */
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

describe("what the content answer writer role can and cannot actually do", () => {
  it("can insert the answer version it exists to write", async () => {
    await expect(
      asWriter(
        `insert into public.item_answer_versions
           (item_version_id, answer_key, grading_rules, rubric, private_explanation,
            grading_schema_version)
         values ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5, $6)`,
        [
          itemVersionId,
          JSON.stringify({ kind: "single_choice", correctOptionId: "a" }),
          JSON.stringify({}),
          null,
          "RLS fixture explanation",
          1,
        ],
      ),
    ).resolves.toBeUndefined();
  });

  it("cannot select from item_answer_versions — insert-only, no read grant", async () => {
    await expect(
      asWriter("select 1 from public.item_answer_versions"),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it.each([
    [
      "update",
      `update public.item_answer_versions set private_explanation = 'forged'
         where item_version_id = $1`,
    ],
    ["delete", `delete from public.item_answer_versions where item_version_id = $1`],
  ])("cannot %s item_answer_versions — insert-only, no grant for it", async (_label, sql) => {
    /* Belt and suspenders: item_answer_versions_immutable (20260812090000)
       would reject an update from ANY role, but this role additionally holds
       no UPDATE/DELETE grant at all, so the permission check fires first. */
    await expect(asWriter(sql, [itemVersionId])).rejects.toMatchObject({ code: "42501" });
  });

  it.each([
    ["item_versions", "select 1 from public.item_versions"],
    ["items", "select 1 from public.items"],
    ["assessment_sessions", "select 1 from public.assessment_sessions"],
    ["session_responses", "select 1 from public.session_responses"],
    ["profiles", "select 1 from public.profiles"],
    ["assessment_results", "select 1 from public.assessment_results"],
    ["authoring_question_revisions", "select 1 from public.authoring_question_revisions"],
  ])("cannot read %s", async (_label, sql) => {
    await expect(asWriter(sql)).rejects.toMatchObject({ code: "42501" });
  });

  it.each([
    [`create table public.writer_backdoor (id int)`],
    [`create role writer_backdoor`],
  ])("cannot create objects or roles: %s", async (sql) => {
    await expect(asWriter(sql)).rejects.toMatchObject({ code: "42501" });
  });
});

describe("the two boundary roles stay disjoint", () => {
  it("mindmosaic_scoring cannot insert into item_answer_versions", async () => {
    /* The property this whole split exists to guarantee: the role trusted to
       read every learner's pinned answer must not also be able to mint one. */
    await expect(
      asScoring(
        `insert into public.item_answer_versions
           (item_version_id, answer_key, grading_rules, rubric, private_explanation,
            grading_schema_version)
         values ($1, '{}'::jsonb, '{}'::jsonb, null, null, 1)`,
        [itemVersionId],
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("mindmosaic_content_answer_writer cannot read what mindmosaic_scoring reads", async () => {
    for (const sql of [
      "select 1 from public.assessment_session_items",
      "select 1 from public.session_responses",
      "select 1 from public.assessment_sessions",
    ]) {
      await expect(asWriter(sql)).rejects.toMatchObject({ code: "42501" });
    }
  });
});
