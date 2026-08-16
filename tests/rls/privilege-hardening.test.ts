/**
 * Coverage for supabase/migrations/20260819100000_privilege_hardening_real_tables.sql
 * (Gate A item A13, docs/phase2-cutover-readiness-checklist.md; external
 * review #1, original audit #3).
 *
 * `20260811093000` closed TRUNCATE/UPDATE/DELETE on the three legacy exam
 * tables and recorded the rest of the schema as outstanding
 * (docs/adr/phase0-legacy-session-inventory.md §7). This is that follow-up
 * for seven tables: `classes`, `class_students`, `assignments`,
 * `assignment_students`, `parent_children`, `profiles`, `subscriptions`.
 *
 * `essay_marks` is deliberately absent from every assertion here — its
 * TRUNCATE + DELETE closure is Gate B item B3, not this one (see the
 * migration's own header). A test asserting essay_marks were revoked would
 * fail correctly today and would keep failing the moment this migration ever
 * touched it, which is exactly backwards from what this migration promises.
 *
 * The distinction the second describe block turns on is the same one
 * tests/rls/runtime-content.test.ts uses: a 42501 (permission denied) means no
 * privilege exists at all; an empty result set would mean the privilege still
 * exists and only a policy is filtering it. TRUNCATE has no policy to filter
 * it — RLS cannot cover TRUNCATE — so 42501 is the only guarantee available.
 *
 * Same harness contract as the other suites here: seed as the unrestricted
 * role, impersonate the way PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, PARENT_C, seed, STUDENT_A, TEACHER_D } from "./fixtures";

let client: Client;

const HARDENED_TABLES = [
  "classes",
  "class_students",
  "assignments",
  "assignment_students",
  "parent_children",
  "profiles",
  "subscriptions",
] as const;

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("catalog: TRUNCATE/REFERENCES/TRIGGER are gone from the seven hardened tables", () => {
  it("grants anon and authenticated none of the three on any of them", async () => {
    const result = await client.query<{ table_name: string; grantee: string; privilege_type: string }>(
      `select table_name, grantee, privilege_type
         from information_schema.role_table_grants
        where table_schema = 'public'
          and grantee in ('anon', 'authenticated')
          and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')
          and table_name = any($1)`,
      [[...HARDENED_TABLES]],
    );
    expect(result.rows).toEqual([]);
  });

  it("still grants no write privilege at all to anon on any of the seven", async () => {
    const result = await client.query(
      `select 1 from information_schema.role_table_grants
        where table_schema = 'public' and grantee = 'anon'
          and privilege_type <> 'SELECT'
          and table_name = any($1)`,
      [[...HARDENED_TABLES]],
    );
    expect(result.rowCount).toBe(0);
  });
});

describe("catalog: each table's authenticated grant matches exactly what a live policy or route uses", () => {
  it.each([
    ["classes", ["DELETE", "INSERT", "SELECT", "UPDATE"]],
    ["class_students", ["DELETE", "INSERT", "SELECT"]],
    ["assignments", ["DELETE", "INSERT", "SELECT", "UPDATE"]],
    ["assignment_students", ["DELETE", "INSERT", "SELECT"]],
    ["parent_children", ["SELECT"]],
    ["profiles", ["SELECT"]],
    ["subscriptions", ["SELECT", "UPDATE"]],
  ])("%s", async (table, expected) => {
    const result = await client.query<{ privilege_type: string }>(
      `select distinct privilege_type from information_schema.role_table_grants
        where table_schema = 'public' and table_name = $1 and grantee = 'authenticated'
        order by privilege_type`,
      [table],
    );
    expect(result.rows.map((row) => row.privilege_type)).toEqual(expected);
  });

  it("leaves essay_marks untouched — Gate B item B3, not this migration", async () => {
    const result = await client.query<{ privilege_type: string }>(
      `select distinct privilege_type from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'essay_marks' and grantee = 'authenticated'
        order by privilege_type`,
    );
    expect(result.rows.map((row) => row.privilege_type)).toEqual([
      "DELETE",
      "INSERT",
      "REFERENCES",
      "SELECT",
      "TRIGGER",
      "TRUNCATE",
      "UPDATE",
    ]);
  });
});

describe("behavior: TRUNCATE is refused outright, not merely policy-filtered", () => {
  it.each(HARDENED_TABLES)("on %s", async (table) => {
    await client.query("savepoint sp");
    await asAuthenticated(client, TEACHER_D);
    await expect(
      client.query(`truncate public.${table}`),
      `${table} must refuse TRUNCATE with no privilege at all`,
    ).rejects.toMatchObject({ code: "42501" });
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");
  });
});

describe("behavior: the writes this migration revoked from parent_children and profiles are gone", () => {
  it("a parent cannot INSERT a parent_children link directly — the admin client is the only writer", async () => {
    await asAuthenticated(client, PARENT_C);
    await expect(
      client.query(
        `insert into public.parent_children (parent_id, child_id) values ($1, $2)`,
        [PARENT_C, STUDENT_A],
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("a parent cannot DELETE a parent_children link directly", async () => {
    await asAuthenticated(client, PARENT_C);
    await expect(
      client.query(`delete from public.parent_children where parent_id = $1`, [PARENT_C]),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("a signed-in caller cannot INSERT into profiles directly", async () => {
    await asAuthenticated(client, STUDENT_A);
    await expect(
      client.query(
        `insert into public.profiles (id, role, display_name) values (gen_random_uuid(), 'student', 'forged')`,
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("a signed-in caller cannot DELETE a profiles row directly", async () => {
    await asAuthenticated(client, STUDENT_A);
    await expect(
      client.query(`delete from public.profiles where id = $1`, [STUDENT_A]),
    ).rejects.toMatchObject({ code: "42501" });
  });
});
