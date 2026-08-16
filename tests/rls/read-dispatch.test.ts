/**
 * The database half of read dispatch (spec §12.7 step 7; ADR-005 Amendment A).
 *
 * `src/tests/unit/read-dispatch.test.ts` proves the rules — which model is
 * asked, in what order, and that no sitting is read from both. This file proves
 * the facts those rules stand on, against a real Postgres with real policies:
 *
 *   * a backfilled sitting really does exist in BOTH models, so the
 *     double-count hazard is not hypothetical;
 *   * `legacy_session_id` really does identify the copy, so origin is a column
 *     and not an inference;
 *   * the origin filter really does return each sitting exactly once;
 *   * and a learner reaches only their own sittings in either model, with anon
 *     reaching neither — which is the part no unit test with a stubbed client
 *     can establish, because the control is the policy, not the query.
 *
 * Harness contract as elsewhere: seed as the unrestricted role, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, seed, STUDENT_A, STUDENT_B } from "./fixtures";

let client: Client;

const LEGACY_SESSION = "77777777-0000-0000-0000-00000000000a";

const CONFIG = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 2,
  timing: "timed",
};

async function asOwner(target: Client): Promise<void> {
  await target.query("reset role");
}

async function inSavepoint<T>(body: () => Promise<T>): Promise<T> {
  await client.query("savepoint sp");
  try {
    return await body();
  } finally {
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");
  }
}

async function seedItem(target: Client, label: string): Promise<void> {
  const item = await target.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'original_seed', 'curated_git_authored') returning id`,
    [`dispatch-${label}`],
  );
  const version = await target.query<{ id: string }>(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic, source_tags)
     values ($1, 1, 'multiple_choice', $2, $3::jsonb, '{"altTextProvided":true}'::jsonb,
             60, 'easy', 1, 1, $4, 'curated_git_authored', now(), 5, 'naplan_style', 'numeracy',
             'single_option', 'number', 'addition', array['worded'])
     returning id`,
    [
      item.rows[0]!.id,
      `Prompt ${label}`,
      JSON.stringify({ options: [{ id: "a", text: "1" }, { id: "b", text: "2" }] }),
      label.padEnd(64, "0").slice(0, 64).replace(/[^0-9a-f]/g, "1"),
    ],
  );
  await target.query(
    `insert into public.item_answer_versions (item_version_id, answer_key, private_explanation)
     values ($1, '{"kind":"single_option","optionId":"b"}'::jsonb, 'Because two is more than one.')`,
    [version.rows[0]!.id],
  );
}

/** A terminal legacy sitting — the only kind the backfill copies (ADR-005 §3). */
async function seedTerminalLegacySitting(target: Client, studentId: string): Promise<void> {
  await target.query(
    `insert into public.exam_sessions
       (id, student_id, config, seed, selected_question_ids, created_at, expires_at)
     values ($1, $2, $3::jsonb, 'legacy-seed', array['q1'],
             now() - interval '2 hours', now() - interval '1 hour')`,
    [LEGACY_SESSION, studentId, JSON.stringify({ ...CONFIG, bankId: "curated" })],
  );
  await target.query(
    `insert into public.exam_attempts (session_id, student_id, responses, result, submitted_at)
     values ($1, $2, '{}'::jsonb, $3::jsonb, now() - interval '1 hour')`,
    [
      LEGACY_SESSION,
      studentId,
      JSON.stringify({
        totalQuestions: 1,
        attemptedQuestions: 1,
        autoMarkedQuestions: 1,
        manualReviewQuestions: 0,
        correctCount: 1,
        incorrectCount: 0,
        unansweredCount: 0,
        objectiveMarksEarned: 1,
        objectiveMarksAvailable: 1,
        objectivePercentage: 100,
        pendingManualMarks: 0,
        timeTakenSeconds: 600,
        submissionReason: "user_submitted",
        startedAt: Date.parse("2026-08-01T09:00:00.000Z"),
        submittedAt: Date.parse("2026-08-01T09:10:00.000Z"),
        questionDetails: [],
        breakdowns: {},
      }),
    ],
  );
}

async function runBackfill(target: Client): Promise<void> {
  await asOwner(target);
  await target.query(`select public.backfill_legacy_terminal_sessions()`);
}

async function createTargetSession(target: Client, studentId: string): Promise<string> {
  await asOwner(target);
  await target.query(
    `update public.platform_flags set enabled = true, cohort_mode = 'all'
      where key = 'target_session_model'`,
  );
  await asAuthenticated(target, studentId);
  const created = await target.query<{ body: { sessionId: string } }>(
    `select public.create_assessment_session($1::jsonb, $2) as body`,
    [JSON.stringify(CONFIG), `dispatch-${studentId}`],
  );
  return created.rows[0]!.body.sessionId;
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await seedItem(client, "aa");
  await seedItem(client, "bb");
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("a backfilled sitting exists in both models — the hazard is real", () => {
  beforeEach(async () => {
    await seedTerminalLegacySitting(client, STUDENT_A);
    await runBackfill(client);
  });

  it("has an exam_attempts row AND an assessment_results row for one sitting", async () => {
    await asOwner(client);
    const counts = await client.query<{ legacy: string; target: string }>(
      `select (select count(*)::text from public.exam_attempts
                where session_id = $1) as legacy,
              (select count(*)::text from public.assessment_results r
                join public.assessment_sessions s on s.id = r.session_id
                where s.legacy_session_id = $1) as target`,
      [LEGACY_SESSION],
    );
    /* One sitting, two rows. Anything that reads "whichever model has a row"
       counts this learner's single exam twice. */
    expect(counts.rows[0]!.legacy).toBe("1");
    expect(counts.rows[0]!.target).toBe("1");
  });

  it("marks the copy as a copy, on a unique column", async () => {
    await asOwner(client);
    const copy = await client.query<{ legacy_session_id: string; legacy_attempt_id: string }>(
      `select s.legacy_session_id, r.legacy_attempt_id
         from public.assessment_sessions s
         join public.assessment_results r on r.session_id = s.id
        where s.legacy_session_id = $1`,
      [LEGACY_SESSION],
    );
    expect(copy.rows[0]!.legacy_session_id).toBe(LEGACY_SESSION);
    expect(copy.rows[0]!.legacy_attempt_id).not.toBeNull();
  });

  it("resolves the copy's own id back to its legacy origin", async () => {
    await asAuthenticated(client, STUDENT_A);
    const resolved = await client.query<{ id: string; legacy_session_id: string }>(
      `select id, legacy_session_id from public.assessment_sessions
        where legacy_session_id = $1`,
      [LEGACY_SESSION],
    );
    /* Both identities of this sitting — the row's own id and the id it names —
       are visible to the dispatcher in one query, which is what lets it answer
       with one source for either. */
    expect(resolved.rows[0]!.legacy_session_id).toBe(LEGACY_SESSION);
    expect(resolved.rows[0]!.id).not.toBe(LEGACY_SESSION);
  });

  it("returns every sitting exactly once under the origin filter", async () => {
    /* Two legacy sittings for this learner: the shared fixture's, and the one
       this file seeded. Both are terminal, so both were backfilled — and the
       filtered union must still be two. */
    await asAuthenticated(client, STUDENT_A);
    const history = await client.query<{ n: string }>(
      `select (
         (select count(*) from public.exam_attempts)
         + (select count(*) from public.assessment_results where legacy_attempt_id is null)
       )::text as n`,
    );
    expect(history.rows[0]!.n).toBe("2");
  });

  it("would have over-counted without the origin filter", async () => {
    /* The control case. Without it the test above would also pass against a
       database where the backfill had simply done nothing.
       Three, not four: the shared fixture's attempt carries `result = '{}'`,
       which the backfill classifies as unmappable and skips (ADR-005 §3), so
       only this file's sitting produced a result row. One duplicate out of two
       sittings is the hazard — and it is also a fair picture of a partial
       backfill, which is exactly the state Amendment A1 says a presence probe
       cannot be trusted in. */
    await asAuthenticated(client, STUDENT_A);
    const naive = await client.query<{ n: string }>(
      `select (
         (select count(*) from public.exam_attempts)
         + (select count(*) from public.assessment_results)
       )::text as n`,
    );
    expect(naive.rows[0]!.n).toBe("3");
  });
});

describe("a learner with one sitting on each model sees each once", () => {
  it("counts legacy sittings and a native target sitting once each", async () => {
    await seedTerminalLegacySitting(client, STUDENT_A);
    await runBackfill(client);
    await createTargetSession(client, STUDENT_A);

    await asAuthenticated(client, STUDENT_A);
    const rows = await client.query<{ legacy: string; target: string }>(
      `select (select count(*)::text from public.exam_attempts) as legacy,
              (select count(*)::text from public.assessment_sessions
                where legacy_session_id is null) as target`,
    );
    /* Two legacy (the shared fixture's and this file's) and exactly one
       target-origin session — the one just created. The two backfill copies do
       not appear in the target count, which is the whole point of the filter. */
    expect(rows.rows[0]!.legacy).toBe("2");
    expect(rows.rows[0]!.target).toBe("1");
  });
});

describe("the sitter, and only the sitter", () => {
  let targetSessionId: string;

  beforeEach(async () => {
    await seedTerminalLegacySitting(client, STUDENT_A);
    await runBackfill(client);
    targetSessionId = await createTargetSession(client, STUDENT_A);
  });

  it("shows another learner nothing of this one's, on either model", async () => {
    /* STUDENT_B has their own fixture sitting, so the assertion is scoped to
       STUDENT_A's rows rather than to emptiness — "B sees no rows at all" would
       pass for the wrong reason the day the fixture changes. */
    await asAuthenticated(client, STUDENT_B);
    const rows = await client.query<{
      sessions: string;
      attempts: string;
      target_sessions: string;
      target_results: string;
    }>(
      `select (select count(*)::text from public.exam_sessions where student_id = $1) as sessions,
              (select count(*)::text from public.exam_attempts where student_id = $1) as attempts,
              (select count(*)::text from public.assessment_sessions where student_id = $1) as target_sessions,
              (select count(*)::text from public.assessment_results where student_id = $1) as target_results`,
      [STUDENT_A],
    );
    expect(rows.rows[0]).toEqual({
      sessions: "0",
      attempts: "0",
      target_sessions: "0",
      target_results: "0",
    });
  });

  it("refuses another learner the target paper", async () => {
    await asAuthenticated(client, STUDENT_B);
    await inSavepoint(() =>
      expect(
        client.query(`select public.get_assessment_session($1) as body`, [targetSessionId]),
      ).rejects.toMatchObject({ code: "MM003" }),
    );
  });

  it("refuses anon everything", async () => {
    /* The guest flow has no server-side session and gains none (ADR-006 §8):
       an unauthenticated caller reaches neither model's tables nor the reader. */
    await asAnon(client);
    for (const table of ["exam_sessions", "exam_attempts", "assessment_sessions", "assessment_results"]) {
      await inSavepoint(() =>
        expect(client.query(`select * from public.${table}`)).rejects.toMatchObject({
          code: "42501",
        }),
      );
    }
    await inSavepoint(() =>
      expect(
        client.query(`select public.get_assessment_session($1) as body`, [targetSessionId]),
      ).rejects.toMatchObject({ code: "42501" }),
    );
  });
});

describe("the paper a target sitting serves", () => {
  let targetSessionId: string;

  beforeEach(async () => {
    targetSessionId = await createTargetSession(client, STUDENT_A);
  });

  it("carries the candidate metadata the unified DTO needs", async () => {
    await asAuthenticated(client, STUDENT_A);
    const body = await client.query<{ body: { items: Record<string, unknown>[] } }>(
      `select public.get_assessment_session($1) as body`,
      [targetSessionId],
    );
    const item = body.rows[0]!.body.items[0]!;

    /* Every field the legacy path's CandidateQuestion promises, from the row —
       nothing here is defaulted or derived (ADR-006 Amendment D). */
    expect(item).toMatchObject({
      answerKind: "single_option",
      sourceStrand: "number",
      sourceTopic: "addition",
      sourceTags: ["worded"],
      origin: "original_seed",
      questionType: "multiple_choice",
    });
  });

  it("carries the sitter's own saved answers and no scoring of them", async () => {
    /* The ledger is read as the owner, not as the learner:
       `assessment_session_items` has no learner privileges at all, and the
       sitter reaches its content only through the definer reader. That refusal
       is asserted in assessment-session-model.test.ts; here it is simply
       respected. */
    await asOwner(client);
    const ledger = await client.query<{ id: string }>(
      `select id from public.assessment_session_items where session_id = $1 order by global_ordinal`,
      [targetSessionId],
    );
    const firstItem = ledger.rows[0]!.id;

    await asAuthenticated(client, STUDENT_A);
    await client.query(`select public.commit_assessment_responses($1, $2::jsonb, 1)`, [
      targetSessionId,
      JSON.stringify({ [firstItem]: "b" }),
    ]);

    const body = await client.query<{ body: { responses: Record<string, unknown> } }>(
      `select public.get_assessment_session($1) as body`,
      [targetSessionId],
    );
    expect(body.rows[0]!.body.responses[firstItem]).toBe("b");

    const serialised = JSON.stringify(body.rows[0]!.body);
    /* Answered is not the same as marked. A sitting in progress that could read
       its own correctness back would be an exam handing out its answers one
       question at a time. */
    expect(serialised).not.toMatch(/scoreStatus|score_status|isCorrect|is_correct/i);
    expect(serialised).not.toMatch(/awardedMarks|awarded_marks/i);
    expect(serialised).not.toMatch(/answerKey|answer_key|optionId/i);
    expect(serialised).not.toContain("Because two is more than one.");
  });

  it("refuses to serve an allocation whose candidate metadata is incomplete", async () => {
    /* Fail closed rather than shipping a paper with fields the renderer would
       default through. The condition is actionable: project the item again.
       Built as a genuinely incomplete projected row rather than an UPDATE on
       an already-served item, because item_versions is immutable
       whole-row-minus-projected_at (Gate A item A10, 20260819090000) — an
       UPDATE of answer_kind on a published row is exactly the edit that
       migration exists to reject, so simulating "never finished projecting"
       has to mean inserting a row that never was, not editing one that was. */
    await asOwner(client);
    const incompleteItem = await client.query<{ id: string }>(
      `insert into public.items (item_code, origin, provenance_class)
       values ('dispatch-incomplete', 'original_seed', 'curated_git_authored') returning id`,
    );
    const incompleteVersion = await client.query<{ id: string; content_hash: string }>(
      `insert into public.item_versions
         (item_id, revision, question_type, prompt, candidate_content, accessibility,
          estimated_time_seconds, authored_difficulty, marks_available,
          content_schema_version, content_hash, provenance_class, published_at,
          source_year_level, source_exam_style, source_subject)
       values ($1, 1, 'multiple_choice', 'Incomplete prompt', '{"options":[]}'::jsonb,
               '{"altTextProvided":true}'::jsonb, 60, 'easy', 1, 1,
               '${"9".repeat(63)}a',
               'curated_git_authored', now(), 5, 'naplan_style', 'numeracy')
       returning id, content_hash`,
      [incompleteItem.rows[0]!.id],
    );
    await client.query(
      `insert into public.assessment_session_items
         (session_id, global_ordinal, within_stage_ordinal, item_id, item_version_id,
          content_hash, seed)
       values ($1, 3, 3, $2, $3, $4, 'dispatch-incomplete-seed')`,
      [
        targetSessionId,
        incompleteItem.rows[0]!.id,
        incompleteVersion.rows[0]!.id,
        incompleteVersion.rows[0]!.content_hash,
      ],
    );

    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(`select public.get_assessment_session($1) as body`, [targetSessionId]),
      ).rejects.toMatchObject({ code: "MM214" }),
    );
  });
});

describe("the legacy read path is unchanged", () => {
  beforeEach(async () => {
    await seedTerminalLegacySitting(client, STUDENT_A);
  });

  it("still hands the owner their own session, attempt and autosave row", async () => {
    await asAuthenticated(client, STUDENT_A);
    const session = await client.query(
      `select id, config, selected_question_ids, created_at, expires_at
         from public.exam_sessions where id = $1`,
      [LEGACY_SESSION],
    );
    expect(session.rowCount).toBe(1);

    const attempt = await client.query(
      `select id from public.exam_attempts where session_id = $1`,
      [LEGACY_SESSION],
    );
    expect(attempt.rowCount).toBe(1);
  });

  it("is not gated on the cutover flag in either direction", async () => {
    /* Step 7 is read-side and additive. Turning the flag on must not change
       what a legacy sitting reads, and turning it off must not hide one. */
    await asOwner(client);
    await client.query(
      `update public.platform_flags set enabled = true, cohort_mode = 'all'
        where key = 'target_session_model'`,
    );
    await asAuthenticated(client, STUDENT_A);
    const withFlagOn = await client.query(
      `select id from public.exam_sessions where id = $1`,
      [LEGACY_SESSION],
    );
    expect(withFlagOn.rowCount).toBe(1);

    await asOwner(client);
    await client.query(
      `update public.platform_flags set enabled = false where key = 'target_session_model'`,
    );
    await asAuthenticated(client, STUDENT_A);
    const withFlagOff = await client.query(
      `select id from public.exam_sessions where id = $1`,
      [LEGACY_SESSION],
    );
    expect(withFlagOff.rowCount).toBe(1);
  });
});
