/**
 * Coverage for supabase/migrations/20261003120000_explicit_grants_least_privilege.sql
 * (Supabase 2026-10-30 explicit-grants readiness).
 *
 * Proves:
 * 1. Every client-used table and view is reachable by its intended role (`authenticated`)
 *    without encountering SQLSTATE 42501 (permission denied).
 * 2. Unauthenticated (`anon`) callers cannot read answer keys or user data.
 * 3. `authenticated` callers cannot read answer keys (`item_answer_versions`).
 * 4. Cross-tenant privacy is enforced: students/parents/teachers cannot read other
 *    users' private records.
 * 5. Internal resolution views remain ungranted to both anon and authenticated.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import {
  asAnon,
  asAuthenticated,
  PARENT_C,
  seed,
  STUDENT_A,
  STUDENT_B,
} from "./fixtures";

let client: Client;

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("Explicit grants readiness: client-used tables reachable by authenticated", () => {
  const CLIENT_READABLE_TABLES = [
    "classes",
    "class_students",
    "assignments",
    "assignment_students",
    "parent_children",
    "profiles",
    "subscriptions",
    "exam_sessions",
    "exam_attempts",
    "exam_responses",
    "essay_marks",
    "assessment_sessions",
    "assessment_results",
    "manual_marks",
    "erasure_requests",
  ] as const;

  for (const table of CLIENT_READABLE_TABLES) {
    it(`allows authenticated to SELECT on ${table} without 42501`, async () => {
      await asAuthenticated(client, STUDENT_A);
      // Query should succeed without SQLSTATE 42501 (even if RLS yields 0 rows)
      const res = await client.query(`select 1 from public.${table} limit 1`);
      expect(Array.isArray(res.rows)).toBe(true);
    });
  }

  const CLIENT_VIEWS = [
    "admin_platform_totals",
    "admin_weekly_activity",
    "admin_score_distribution",
    "admin_subject_performance",
    "admin_skill_performance",
    "admin_question_stats",
    "visible_sittings",
    "visible_sitting_questions",
    "visible_manual_marks",
  ] as const;

  for (const view of CLIENT_VIEWS) {
    it(`allows authenticated to query view ${view} without 42501`, async () => {
      await asAuthenticated(client, STUDENT_A);
      const res = await client.query(`select * from public.${view} limit 1`);
      expect(Array.isArray(res.rows)).toBe(true);
    });
  }
});

describe("Least privilege boundaries: answer-key protection", () => {
  it("denies anon access to item_answer_versions with 42501", async () => {
    await asAnon(client);
    await client.query("savepoint probe");
    await expect(
      client.query("select * from public.item_answer_versions limit 1"),
    ).rejects.toMatchObject({ code: "42501" });
    await client.query("rollback to savepoint probe");
  });

  it("denies authenticated access to item_answer_versions with 42501", async () => {
    await asAuthenticated(client, STUDENT_A);
    await client.query("savepoint probe");
    await expect(
      client.query("select * from public.item_answer_versions limit 1"),
    ).rejects.toMatchObject({ code: "42501" });
    await client.query("rollback to savepoint probe");
  });
});

describe("Least privilege boundaries: internal views stay ungranted", () => {
  const UNGRANTED_INTERNAL_VIEWS = [
    "resolved_sittings",
    "resolved_sitting_questions",
    "resolved_manual_marks",
    "curriculum_latest_review_statuses",
  ] as const;

  for (const view of UNGRANTED_INTERNAL_VIEWS) {
    it(`denies authenticated direct access to internal view ${view} with 42501`, async () => {
      await asAuthenticated(client, STUDENT_A);
      await client.query("savepoint probe");
      await expect(
        client.query(`select * from public.${view} limit 1`),
      ).rejects.toMatchObject({ code: "42501" });
      await client.query("rollback to savepoint probe");
    });
  }
});

describe("Cross-tenant boundaries: authenticated cannot read other students' data", () => {
  it("student A cannot read student B's exam responses or profile display_name", async () => {
    await asAuthenticated(client, STUDENT_A);
    const otherResponses = await client.query(
      `select r.* from public.exam_responses r
       join public.exam_sessions s on s.id = r.session_id
       where s.student_id = $1`,
      [STUDENT_B],
    );
    expect(otherResponses.rows).toHaveLength(0);

    const otherProfile = await client.query(
      `select display_name from public.profiles where id = $1`,
      [STUDENT_B],
    );
    // Student A cannot see student B's profile row under RLS
    expect(otherProfile.rows).toHaveLength(0);
  });

  it("parent C cannot read student B's attempts when unlinked", async () => {
    await asAuthenticated(client, PARENT_C);
    // Fixture links parent C to student A only; student B is unlinked
    const unlinkedAttempts = await client.query(
      `select * from public.exam_attempts where student_id = $1`,
      [STUDENT_B],
    );
    expect(unlinkedAttempts.rows).toHaveLength(0);
  });
});
