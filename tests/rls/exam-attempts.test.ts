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
 * MM-AUD-SEC-001 changed HOW a forbidden write to exam_sessions /
 * exam_attempts fails, without changing THAT it fails. Before
 * 20260811091000 these inserts were granted to `authenticated` and refused
 * by an insert policy ("new row violates row-level security policy");
 * afterwards the INSERT privilege itself is gone, so Postgres refuses at
 * the grant level ("permission denied for table ...") and never reaches a
 * policy. Both are the boundary holding. Matching either keeps these cases
 * asserting the security property rather than the wording of the refusal.
 */
const DENIED_WRITE = /permission denied|row-level security/i;

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
    ).rejects.toThrow(DENIED_WRITE);
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
   * MM-AUTH-01: a teacher or parent must not be able to create an exam
   * session for themselves. The role condition originally lived in the
   * "exam_sessions: student creates own" insert policy
   * (20260724090000); since 20260811091000 dropped that policy along with
   * the INSERT grant, the refusal now comes from the missing privilege,
   * and the role check itself moved into public.create_exam_session (the
   * MM-AUD-SEC-001 cases below cover it there). The property asserted here
   * is unchanged — these identities cannot write a session row — which is
   * why the matcher accepts either form of refusal.
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
    ).rejects.toThrow(DENIED_WRITE);
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
    ).rejects.toThrow(DENIED_WRITE);
  });

  /**
   * MM-AUD-SEC-001 — the trust boundary itself.
   *
   * This case used to assert the opposite ("a genuine student can still
   * create their own exam session"), which encoded the vulnerability as
   * intended behaviour: the insert policy could only constrain who the row
   * belonged to, never that selected_question_ids was the server's own
   * selection, so a student who could insert directly could choose their
   * own paper and then sit it through the normal resume/submit flow.
   *
   * A student creating a session is still a supported operation — it just
   * has to go through public.create_exam_session, proven below.
   */
  it("MM-AUD-SEC-001: a student cannot insert an exam_sessions row directly", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(
      client.query(
        `insert into public.exam_sessions
           (student_id, config, seed, selected_question_ids, expires_at)
         values ($1, '{}'::jsonb, 'seed-student', array['q-of-my-choosing'], now() + interval '1 hour')`,
        [STUDENT_A],
      ),
    ).rejects.toThrow(DENIED_WRITE);
  });

  /**
   * The other half of the same boundary, and the more serious one:
   * `result` IS the score. The dropped "exam_attempts: student submits own"
   * policy checked ownership of the session and nothing about `responses`
   * or `result`, so a student could write a finished, full-marks attempt
   * for their own genuine session without answering anything — and every
   * parent, teacher and admin surface reads that row as authentic.
   */
  it("MM-AUD-SEC-001: a student cannot insert an exam_attempts row with a self-authored result", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(
      client.query(
        `insert into public.exam_attempts (session_id, student_id, responses, result)
         values ($1, $2, '{}'::jsonb, $3::jsonb)`,
        [
          SESSION_A,
          STUDENT_A,
          JSON.stringify({ status: "completed", score: 40, maxScore: 40 }),
        ],
      ),
    ).rejects.toThrow(DENIED_WRITE);
  });

  /**
   * ...and the same student, through the sanctioned path, still can — so
   * the two cases above prove a closed door rather than a broken feature.
   * SESSION_A already has an attempt (the seed fixture), so this uses a
   * fresh session created by the function itself, which also demonstrates
   * that student_id comes from auth.uid() rather than from any argument.
   */
  it("MM-AUD-SEC-001: a student can still create a session and record an attempt through the definer RPCs", async () => {
    await asAuthenticated(client, STUDENT_A);

    const created = await client.query(
      `select public.create_exam_session(
         '{}'::jsonb, 'seed-rpc', array['q1'], now() + interval '1 hour'
       ) as session_id`,
    );
    const sessionId = created.rows[0].session_id as string;
    expect(sessionId).toBeTruthy();

    const owner = await client.query(
      `select student_id from public.exam_sessions where id = $1`,
      [sessionId],
    );
    expect(owner.rows).toEqual([{ student_id: STUDENT_A }]);

    const attempt = await client.query(
      `select public.record_exam_attempt($1, '{}'::jsonb, '{}'::jsonb) as attempt_id`,
      [sessionId],
    );
    expect(attempt.rows[0].attempt_id).toBeTruthy();
  });

  it("MM-AUD-SEC-001: create_exam_session refuses a non-student caller (MM002)", async () => {
    await asAuthenticated(client, TEACHER_D);

    await expect(
      client.query(
        `select public.create_exam_session(
           '{}'::jsonb, 'seed-teacher-rpc', array['q1'], now() + interval '1 hour'
         )`,
      ),
    ).rejects.toMatchObject({ code: "MM002" });
  });

  it("MM-AUD-SEC-001: record_exam_attempt refuses another student's session (MM003)", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(
      client.query(`select public.record_exam_attempt($1, '{}'::jsonb, '{}'::jsonb)`, [SESSION_B]),
    ).rejects.toMatchObject({ code: "MM003" });
  });

  /**
   * 20260811093000. Phase 0 records the intent in a comment — "No
   * update/delete policies: a session is immutable once created", and the
   * same for an attempt — but the privileges were still granted, so the
   * immutability rested entirely on no policy existing. RLS made that
   * safe (the statement matches zero rows), which is exactly why it went
   * unnoticed: a successful UPDATE affecting nothing looks identical to a
   * refusal. These assert the privilege is gone, so the guarantee no
   * longer depends on nobody ever adding a policy for another reason.
   */
  it("MM-AUD-SEC-001: a student cannot rewrite a recorded attempt's result", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(
      client.query(`update public.exam_attempts set result = '{"score":99}'::jsonb`),
    ).rejects.toThrow(/permission denied/i);
  });

  /* Separate test rather than a second assertion in the one above: the
     failed UPDATE aborts the transaction, so anything following it in the
     same test fails with "current transaction is aborted" instead of the
     refusal being asserted. */
  it("MM-AUD-SEC-001: a student cannot delete a recorded attempt", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(client.query("delete from public.exam_attempts")).rejects.toThrow(
      /permission denied/i,
    );
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
