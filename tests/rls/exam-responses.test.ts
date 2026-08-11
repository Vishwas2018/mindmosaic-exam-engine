/**
 * Coverage for supabase/migrations/20260811092000_exam_responses_locked_after_submit.sql.
 *
 * exam_responses is the one exam table a student still writes directly, and
 * that is deliberate — it holds only candidate responses, a question index
 * and a flag list. What it must not allow is a rewrite after the fact: once
 * an exam_attempts row exists for the session, the stored responses are the
 * record the attempt was scored from, and exam_attempts itself is immutable
 * by design. The autosave route already refuses a post-submission write
 * (409 already_submitted, src/app/api/exam/session/[id]/responses/route.ts),
 * so these prove the same rule holds against a direct PostgREST call that
 * never goes near the route.
 *
 * Same harness contract as exam-attempts.test.ts: seed as the unrestricted
 * role, impersonate the way PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, seed, SESSION_A, STUDENT_A } from "./fixtures";

let client: Client;

/**
 * A session with no attempt row — the seed fixture's SESSION_A and
 * SESSION_B both already have one, and "still writable before submission"
 * needs a session that has not been submitted.
 */
const OPEN_SESSION = "11111111-0000-0000-0000-0000000000cc";

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await client.query(
    `insert into public.exam_sessions
       (id, student_id, config, seed, selected_question_ids, expires_at)
     values ($1, $2, '{}'::jsonb, 'seed-open', array['q1'], now() + interval '1 hour')`,
    [OPEN_SESSION, STUDENT_A],
  );
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("RLS: exam_responses autosave lock (MM-AUD-SEC-001 step 4)", () => {
  it("a student may still insert an autosave row for an unsubmitted session", async () => {
    await asAuthenticated(client, STUDENT_A);

    const result = await client.query(
      `insert into public.exam_responses (session_id, student_id, responses)
       values ($1, $2, '{"q1":"a"}'::jsonb)
       returning session_id`,
      [OPEN_SESSION, STUDENT_A],
    );
    expect(result.rows).toEqual([{ session_id: OPEN_SESSION }]);
  });

  it("a student may still update an autosave row while the session is unsubmitted", async () => {
    await client.query(
      `insert into public.exam_responses (session_id, student_id, responses)
       values ($1, $2, '{"q1":"a"}'::jsonb)`,
      [OPEN_SESSION, STUDENT_A],
    );
    await asAuthenticated(client, STUDENT_A);

    const result = await client.query(
      `update public.exam_responses set responses = '{"q1":"b"}'::jsonb
       where session_id = $1 returning responses`,
      [OPEN_SESSION],
    );
    expect(result.rows).toEqual([{ responses: { q1: "b" } }]);
  });

  /**
   * The finding itself. SESSION_A has an attempt (seeded), so its autosave
   * row is settled: the UPDATE must not take effect. A plain UPDATE whose
   * USING clause excludes the row simply matches nothing — no error — so
   * this asserts both that zero rows changed and that the stored value is
   * untouched, since "silently did nothing" and "quietly rewrote it" are
   * the two outcomes worth telling apart.
   */
  it("a student cannot rewrite an autosave row once the session has been submitted", async () => {
    await client.query(
      `insert into public.exam_responses (session_id, student_id, responses)
       values ($1, $2, '{"q1":"original"}'::jsonb)`,
      [SESSION_A, STUDENT_A],
    );
    await asAuthenticated(client, STUDENT_A);

    const updated = await client.query(
      `update public.exam_responses set responses = '{"q1":"rewritten"}'::jsonb
       where session_id = $1 returning session_id`,
      [SESSION_A],
    );
    expect(updated.rows).toHaveLength(0);

    const stored = await client.query(
      `select responses from public.exam_responses where session_id = $1`,
      [SESSION_A],
    );
    expect(stored.rows).toEqual([{ responses: { q1: "original" } }]);
  });

  /**
   * The INSERT half. A student who never autosaved mid-exam has no row to
   * update, so guarding UPDATE alone would leave them free to author one
   * after submitting — and the autosave endpoint upserts, so the two halves
   * have to agree.
   */
  it("a student cannot insert an autosave row for an already-submitted session", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(
      client.query(
        `insert into public.exam_responses (session_id, student_id, responses)
         values ($1, $2, '{"q1":"after-the-fact"}'::jsonb)`,
        [SESSION_A, STUDENT_A],
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  /**
   * 20260811093000. Every policy in this file is per-row, and TRUNCATE has
   * no rows to filter — RLS does not apply to it at all, so the table
   * privilege is the only control. exam_responses was the one exam table
   * genuinely exposed: exam_sessions and exam_attempts happen to be
   * referenced by foreign keys, which makes TRUNCATE fail with 0A000 for a
   * reason that has nothing to do with authorisation and would vanish if
   * the schema changed. This asserts the privilege is gone, so a passing
   * result means "not allowed" rather than "not currently possible".
   */
  it("a student cannot truncate exam_responses, wiping every student's autosave", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(client.query("truncate public.exam_responses")).rejects.toThrow(
      /permission denied/i,
    );
  });
});
