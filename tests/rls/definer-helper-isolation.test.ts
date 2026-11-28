/**
 * Cross-account isolation for the three SECURITY DEFINER helpers hardened by
 * supabase/migrations/20261128090000_harden_definer_helpers.sql:
 *   has_active_access(uuid), is_student_profile(uuid), session_has_attempt(uuid).
 * Each answers about a caller-supplied id as the table owner, so each must refuse to answer about ids outside the
 * caller's own relationships, and none may be executable by anon. Everything runs in a rolled-back transaction.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, seed, SESSION_A, SESSION_B, STUDENT_A, STUDENT_B, TEACHER_D } from "./fixtures";

const PARENT_OF_A = "00000000-0000-0000-0000-00000000003a"; // linked to STUDENT_A, trialing
const PARENT_OTHER = "00000000-0000-0000-0000-00000000003b"; // unrelated, trialing

let client: Client;

async function insertParent(id: string, email: string) {
  await client.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)`, [
    id,
    email,
    JSON.stringify({ role: "parent" }),
  ]);
}

async function reset() {
  await client.query("reset role");
}

async function asService() {
  await client.query("set local role service_role");
  await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "service_role" })]);
}

const one = async (sql: string, params: unknown[]) => (await client.query(sql, params)).rows[0].v as boolean;
const access = (p: string) => one(`select public.has_active_access($1) as v`, [p]);
const isStudent = (t: string) => one(`select public.is_student_profile($1) as v`, [t]);
const hasAttempt = (s: string) => one(`select public.session_has_attempt($1) as v`, [s]);

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await insertParent(PARENT_OF_A, "parent-of-a@test.local");
  await insertParent(PARENT_OTHER, "parent-other@test.local");
  await client.query(`insert into public.parent_children (parent_id, child_id) values ($1, $2)`, [PARENT_OF_A, STUDENT_A]);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("has_active_access", () => {
  it("answers for the caller's own parent id", async () => {
    await asAuthenticated(client, PARENT_OF_A);
    expect(await access(PARENT_OF_A)).toBe(true);
  });

  it("answers for a student about their own parent (the production caller)", async () => {
    await asAuthenticated(client, STUDENT_A);
    expect(await access(PARENT_OF_A)).toBe(true);
  });

  it("refuses an unrelated parent's id (reports false even though that parent is entitled)", async () => {
    await asAuthenticated(client, PARENT_OF_A);
    expect(await access(PARENT_OTHER)).toBe(false);
    await reset();
    await asAuthenticated(client, STUDENT_B);
    expect(await access(PARENT_OF_A)).toBe(false);
  });

  it("answers for the service role", async () => {
    await asService();
    expect(await access(PARENT_OTHER)).toBe(true);
  });

  it("is not executable by anon", async () => {
    await asAnon(client);
    await expect(access(PARENT_OF_A)).rejects.toThrow(/permission denied/i);
  });
});

describe("is_student_profile", () => {
  it("answers for a signed-in teacher", async () => {
    await asAuthenticated(client, TEACHER_D);
    expect(await isStudent(STUDENT_A)).toBe(true);
    expect(await isStudent(PARENT_OTHER)).toBe(false);
  });

  it("refuses non-teachers (students and parents learn nothing about other ids)", async () => {
    await asAuthenticated(client, STUDENT_B);
    expect(await isStudent(STUDENT_A)).toBe(false);
    await reset();
    await asAuthenticated(client, PARENT_OTHER);
    expect(await isStudent(STUDENT_A)).toBe(false);
  });

  it("is not executable by anon", async () => {
    await asAnon(client);
    await expect(isStudent(STUDENT_A)).rejects.toThrow(/permission denied/i);
  });
});

describe("session_has_attempt", () => {
  it("answers for the caller's own submitted session", async () => {
    await asAuthenticated(client, STUDENT_A);
    expect(await hasAttempt(SESSION_A)).toBe(true);
  });

  it("refuses another student's session", async () => {
    await asAuthenticated(client, STUDENT_A);
    expect(await hasAttempt(SESSION_B)).toBe(false);
  });

  it("keeps the submit lock intact: a student still cannot write responses to their submitted session", async () => {
    await asAuthenticated(client, STUDENT_A);
    await client.query("savepoint w");
    await expect(
      client.query(
        `insert into public.exam_responses (session_id, student_id, responses) values ($1, $2, '{}'::jsonb)`,
        [SESSION_A, STUDENT_A],
      ),
    ).rejects.toThrow(/row-level security|violates/i);
    await client.query("rollback to savepoint w");
  });

  it("is not executable by anon", async () => {
    await asAnon(client);
    await expect(hasAttempt(SESSION_A)).rejects.toThrow(/permission denied/i);
  });
});
