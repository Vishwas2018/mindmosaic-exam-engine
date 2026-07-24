/**
 * Executable form of docs/RLS_TEST_PLAN.md's R1-R5. Requires a local
 * Supabase Postgres instance with the two migrations applied — see that
 * doc, or the README in this directory, for exact run instructions.
 *
 * Each test opens its own connection, BEGINs, seeds the shared fixture as
 * the unrestricted `postgres` role, impersonates a signed-in user the way
 * PostgREST does, and always ROLLBACKs — no data is left behind.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import {
  asAnon,
  asAuthenticated,
  PARENT_C,
  seed,
  SESSION_A,
  SESSION_B,
  STUDENT_A,
  STUDENT_B,
  TEACHER_D,
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

/**
 * R3's own rule: permission-denied and empty-result-set are both a pass.
 * Runs inside a savepoint so a permission-denied error on one check doesn't
 * abort the outer transaction and cascade into the next check.
 */
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

describe("RLS: exam_attempts / profiles impersonation (docs/RLS_TEST_PLAN.md)", () => {
  it("R1 (required): student cannot read another student's attempt", async () => {
    await asAuthenticated(client, STUDENT_A);

    const own = await client.query("select student_id from public.exam_attempts");
    expect(own.rows).toEqual([{ student_id: STUDENT_A }]);

    const other = await client.query(
      "select * from public.exam_attempts where student_id = $1",
      [STUDENT_B],
    );
    expect(other.rows).toHaveLength(0);
  });

  it("R2 (required): parent cannot read an unlinked child's attempt", async () => {
    await asAuthenticated(client, PARENT_C);

    const linked = await client.query("select student_id from public.exam_attempts");
    expect(linked.rows).toEqual([{ student_id: STUDENT_A }]);

    const unlinked = await client.query(
      "select * from public.exam_attempts where student_id = $1",
      [STUDENT_B],
    );
    expect(unlinked.rows).toHaveLength(0);
  });

  it("R3: anon reads nothing", async () => {
    await asAnon(client);

    await expectDeniedOrEmpty("select * from public.profiles");
    await expectDeniedOrEmpty("select * from public.exam_attempts");
    await expectDeniedOrEmpty("select * from public.exam_sessions");
  });

  it("R4: student cannot forge an attempt against another student's session", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(
      client.query(
        `insert into public.exam_attempts (session_id, student_id, responses, result)
         values ($1, $2, '{}'::jsonb, '{}'::jsonb)`,
        [SESSION_B, STUDENT_A],
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("R5: student cannot escalate their own role", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(
      client.query(`update public.profiles set role = 'admin' where id = $1`, [STUDENT_A]),
    ).rejects.toThrow(/permission denied/i);
  });

  /**
   * MM-SEC-02 (duplicate exam submission): schema-level proof that
   * supabase/migrations/20260722100000_exam_attempts_unique_session_id.sql's
   * unique constraint on exam_attempts.session_id is actually present and
   * enforced, independent of the submit route's own application-level
   * pre-check and 23505-handling (covered separately by
   * src/tests/unit/exam-submit-route.test.ts). Runs as the unrestricted
   * seeding role (no impersonation) — this is a schema assertion, not an
   * RLS check — against the seed fixture's own SESSION_A/STUDENT_A attempt
   * row, so a regression here can only mean the constraint itself is
   * missing or was weakened, never an RLS policy blocking the insert.
   */
  /**
   * MM-AUTH-01: supabase/migrations/20260724090000_exam_sessions_student_role_gate.sql
   * adds a role = 'student' condition to "exam_sessions: student creates
   * own" — previously the policy checked only student_id = auth.uid(), so
   * a teacher or parent inserting a row with themselves as student_id
   * satisfied it just as well as a real student. These prove the insert
   * is now rejected purely on role, independent of
   * src/app/api/exam/session/route.ts's own application-level check
   * (covered separately by src/tests/unit/exam-session-create-route.test.ts).
   */
  it("MM-AUTH-01: a teacher cannot create an exam session for themselves", async () => {
    await asAuthenticated(client, TEACHER_D);

    await expect(
      client.query(
        `insert into public.exam_sessions
           (student_id, config, seed, selected_question_ids, expires_at)
         values ($1, '{}'::jsonb, 'seed-teacher', array['q1'], now() + interval '1 hour')`,
        [TEACHER_D],
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("MM-AUTH-01: a parent (other than the linked child) cannot create an exam session for themselves", async () => {
    await asAuthenticated(client, PARENT_C);

    await expect(
      client.query(
        `insert into public.exam_sessions
           (student_id, config, seed, selected_question_ids, expires_at)
         values ($1, '{}'::jsonb, 'seed-parent', array['q1'], now() + interval '1 hour')`,
        [PARENT_C],
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("MM-AUTH-01: a genuine student can still create their own exam session", async () => {
    await asAuthenticated(client, STUDENT_A);

    const result = await client.query(
      `insert into public.exam_sessions
         (student_id, config, seed, selected_question_ids, expires_at)
       values ($1, '{}'::jsonb, 'seed-student', array['q1'], now() + interval '1 hour')
       returning student_id`,
      [STUDENT_A],
    );
    expect(result.rows).toEqual([{ student_id: STUDENT_A }]);
  });

  it("MM-SEC-02: exam_attempts.session_id is unique — a second attempt for the same session is rejected at the database level", async () => {
    await expect(
      client.query(
        `insert into public.exam_attempts (session_id, student_id, responses, result)
         values ($1, $2, '{}'::jsonb, '{}'::jsonb)`,
        [SESSION_A, STUDENT_A],
      ),
    ).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});
