/**
 * Step 8's four verifications, against a real database (spec §12.7 step 8).
 *
 * §12.7 step 8 says a dependent workflow moves only when it has been "verified
 * on the target model before its legacy reader is removed". That is four
 * distinct claims, and each is checked here as its own describe block:
 *
 *   1. REGRESSION — with the cohort empty, every moved consumer produces
 *      exactly what it produced before. The admin views are checked against
 *      their pre-step-8 SQL, re-stated literally in this file, because "the
 *      numbers did not change" is not something a rewritten view can assert
 *      about itself.
 *   2. TARGET-AWARE — with a seeded cohort, each consumer counts a target
 *      sitting once, from its origin, and does not double-count a backfilled
 *      one.
 *   3. CONSISTENCY — the learner-facing history and the admin aggregates agree
 *      on the count and identity of the same sitting. One product, one notion
 *      of a sitting.
 *   4. ERASURE — an erased child leaves no reversible link in either model,
 *      across every surface §17.5 names.
 *
 * Harness contract as elsewhere: seed as the unrestricted role, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, seed, PARENT_C, STUDENT_A, STUDENT_B, TEACHER_D } from "./fixtures";

let client: Client;

const LEGACY_SESSION = "88888888-0000-0000-0000-00000000000a";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";

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

/**
 * The six admin views EXACTLY as 20260718120000 defined them, before step 8.
 *
 * Copied rather than referenced on purpose: the point of a regression check is
 * to compare the new definition against the old one, and the old one no longer
 * exists in the database to compare with. If these queries and the live views
 * ever disagree on legacy-only data, one of them changed behaviour — which is
 * the failure this file exists to catch.
 */
const PRE_STEP8 = {
  platformTotals: `
    select
      count(*)::bigint as total_attempts,
      count(distinct a.student_id)::bigint as active_students,
      (select count(*) from public.exam_sessions)::bigint as total_sessions,
      round(avg((a.result ->> 'objectivePercentage')::numeric), 1) as avg_score_pct,
      round(avg((a.result ->> 'timeTakenSeconds')::numeric), 0) as avg_time_seconds
    from public.exam_attempts a`,
  weeklyActivity: `
    select
      date_trunc('week', a.submitted_at)::date as week_start,
      count(*)::bigint as attempts,
      count(distinct a.student_id)::bigint as active_students,
      round(avg((a.result ->> 'objectivePercentage')::numeric), 1) as avg_score_pct,
      round(avg((a.result ->> 'timeTakenSeconds')::numeric), 0) as avg_time_seconds
    from public.exam_attempts a
    group by 1 order by 1`,
  scoreDistribution: `
    select
      least(90, (floor((a.result ->> 'objectivePercentage')::numeric / 15) * 15))::int as band_start,
      count(*)::bigint as attempts
    from public.exam_attempts a
    group by 1 order by 1`,
  subjectPerformance: `
    select
      b.key as subject,
      count(*)::bigint as attempts,
      sum((b.value ->> 'total')::bigint) as questions_total,
      sum((b.value ->> 'correct')::bigint) as questions_correct,
      sum((b.value ->> 'objectiveMarksEarned')::numeric) as marks_earned,
      sum((b.value ->> 'objectiveMarksAvailable')::numeric) as marks_available
    from public.exam_attempts a
    cross join lateral jsonb_each(a.result -> 'breakdowns' -> 'bySubject') as b(key, value)
    group by b.key order by b.key`,
  questionStats: `
    select
      qd.value ->> 'questionId' as question_id,
      count(*)::bigint as attempts,
      count(*) filter (where qd.value ->> 'status' = 'correct')::bigint as correct,
      count(*) filter (where (qd.value ->> 'pendingManualReview')::boolean)::bigint as pending_manual
    from public.exam_attempts a
    cross join lateral jsonb_array_elements(a.result -> 'questionDetails') as qd(value)
    group by 1 order by 1`,
};

function legacyResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    totalQuestions: 2,
    attemptedQuestions: 2,
    autoMarkedQuestions: 2,
    manualReviewQuestions: 0,
    correctCount: 1,
    incorrectCount: 1,
    unansweredCount: 0,
    objectiveMarksEarned: 1,
    objectiveMarksAvailable: 2,
    objectivePercentage: 50,
    pendingManualMarks: 0,
    timeTakenSeconds: 600,
    submissionReason: "user_submitted",
    questionDetails: [
      {
        questionId: "q1",
        status: "correct",
        attempted: true,
        requiresManualMarking: false,
        pendingManualReview: false,
        awardedMarks: 1,
        availableMarks: 1,
      },
      {
        questionId: "q2",
        status: "incorrect",
        attempted: true,
        requiresManualMarking: false,
        pendingManualReview: false,
        awardedMarks: 0,
        availableMarks: 1,
      },
    ],
    breakdowns: {
      bySubject: {
        numeracy: {
          total: 2,
          attempted: 2,
          correct: 1,
          incorrect: 1,
          unanswered: 0,
          manualReview: 0,
          objectiveMarksEarned: 1,
          objectiveMarksAvailable: 2,
        },
      },
      bySkill: {
        addition: {
          total: 2,
          attempted: 2,
          correct: 1,
          incorrect: 1,
          unanswered: 0,
          manualReview: 0,
          objectiveMarksEarned: 1,
          objectiveMarksAvailable: 2,
        },
      },
    },
    ...overrides,
  };
}

async function seedItem(target: Client, label: string): Promise<void> {
  const item = await target.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'original_seed', 'curated_git_authored') returning id`,
    [`res-${label}`],
  );
  const version = await target.query<{ id: string }>(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic, source_tags, source_skill)
     values ($1, 1, 'multiple_choice', $2, '{"options":[]}'::jsonb, '{"altTextProvided":true}'::jsonb,
             60, 'easy', 1, 1, $3, 'curated_git_authored', now(), 5, 'naplan_style', 'numeracy',
             'single_option', 'number', 'addition', array['worded'], 'addition')
     returning id`,
    [item.rows[0]!.id, `Prompt ${label}`, label.padEnd(64, "0").slice(0, 64).replace(/[^0-9a-f]/g, "1")],
  );
  await target.query(
    `insert into public.item_answer_versions (item_version_id, answer_key)
     values ($1, '{"kind":"single_option","optionId":"b"}'::jsonb)`,
    [version.rows[0]!.id],
  );
}

async function seedTerminalLegacySitting(target: Client, studentId: string): Promise<void> {
  await target.query(
    `insert into public.exam_sessions
       (id, student_id, config, seed, selected_question_ids, created_at, expires_at)
     values ($1, $2, $3::jsonb, 'legacy-seed', array['q1','q2'],
             now() - interval '2 hours', now() - interval '1 hour')`,
    [LEGACY_SESSION, studentId, JSON.stringify({ ...CONFIG, bankId: "curated" })],
  );
  await target.query(
    `insert into public.exam_attempts (session_id, student_id, responses, result, submitted_at)
     values ($1, $2, '{"q1":"a"}'::jsonb, $3::jsonb, now() - interval '1 hour')`,
    [LEGACY_SESSION, studentId, JSON.stringify(legacyResult())],
  );
}

async function runBackfill(target: Client): Promise<void> {
  await asOwner(target);
  await target.query(`select public.backfill_legacy_terminal_sessions()`);
}

async function createTargetSitting(target: Client, studentId: string): Promise<string> {
  await asOwner(target);
  await target.query(
    `update public.platform_flags set enabled = true, cohort_mode = 'all'
      where key = 'target_session_model'`,
  );
  await asAuthenticated(target, studentId);
  const created = await target.query<{ body: { sessionId: string } }>(
    `select public.create_assessment_session($1::jsonb, $2) as body`,
    [JSON.stringify(CONFIG), `resolution-${studentId}`],
  );
  const sessionId = created.rows[0]!.body.sessionId;

  /* A sitting nobody submitted is not in anyone's history, so give it a result
     the way the scoring module would — as the owner, because the learner has no
     privilege to write one and must not have. */
  await asOwner(target);
  await target.query(
    `insert into public.assessment_results
       (session_id, student_id, scoring_algorithm_version, total_items, attempted_items,
        auto_marked_items, manual_review_items, correct_count, incorrect_count,
        unanswered_count, objective_awarded_marks, objective_available_marks,
        objective_percentage, pending_manual_marks, time_taken_seconds,
        started_at, submitted_at, submission_reason)
     values ($1, $2, 'question-scorers.v1', 2, 2, 2, 0, 1, 1, 0, 1, 2, 50, 0, 600,
             now() - interval '30 minutes', now() - interval '20 minutes', 'user_submitted')`,
    [sessionId, studentId],
  );
  /* created -> submitted -> processed. The transition guard refuses the jump,
     which is §12.8's lifecycle doing its job, so the fixture walks it. */
  await target.query(
    `update public.assessment_sessions
        set status = 'submitted', submitted_at = now() - interval '20 minutes', version = version + 1
      where id = $1`,
    [sessionId],
  );
  await target.query(
    `update public.assessment_sessions set status = 'processed', version = version + 1
      where id = $1`,
    [sessionId],
  );
  return sessionId;
}

async function makeAdmin(target: Client): Promise<void> {
  await asOwner(target);
  await target.query(`insert into auth.users (id, email) values ($1, 'admin@test.local')`, [ADMIN]);
  await target.query(`update public.profiles set role = 'admin' where id = $1`, [ADMIN]);
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await seedItem(client, "aa");
  await seedItem(client, "bb");
  await makeAdmin(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("1. regression — with the cohort empty, nothing moved", () => {
  beforeEach(async () => {
    await seedTerminalLegacySitting(client, STUDENT_A);
  });

  it("every admin view returns exactly what its pre-step-8 definition returns", async () => {
    /* The comparison the whole step turns on. The views were rewritten from
       `exam_attempts` to `resolved_sittings`; on legacy-only data those must be
       the same rows, or a cutover step has silently changed a dashboard. */
    const cases: [string, string][] = [
      ["admin_platform_totals", PRE_STEP8.platformTotals],
      ["admin_weekly_activity", PRE_STEP8.weeklyActivity],
      ["admin_score_distribution", PRE_STEP8.scoreDistribution],
    ];

    for (const [view, legacySql] of cases) {
      await asOwner(client);
      const expected = await client.query(legacySql);
      await asAuthenticated(client, ADMIN);
      const actual = await client.query(
        `select * from public.${view} order by 1`,
      );
      expect(actual.rows, view).toEqual(expected.rows);
    }
  });

  it("keeps the subject and question aggregates identical too", async () => {
    await asOwner(client);
    const subjects = await client.query(PRE_STEP8.subjectPerformance);
    const questions = await client.query(PRE_STEP8.questionStats);

    await asAuthenticated(client, ADMIN);
    const liveSubjects = await client.query(
      `select subject, attempts, questions_total, questions_correct, marks_earned, marks_available
         from public.admin_subject_performance order by subject`,
    );
    const liveQuestions = await client.query(
      `select question_id, attempts, correct, pending_manual
         from public.admin_question_stats order by question_id`,
    );

    expect(liveSubjects.rows).toEqual(subjects.rows);
    expect(liveQuestions.rows).toEqual(questions.rows);
  });

  it("shows the learner the same one sitting through the shared view", async () => {
    await asAuthenticated(client, STUDENT_A);
    const direct = await client.query<{ n: string }>(
      `select count(*)::text as n from public.exam_attempts`,
    );
    const resolved = await client.query<{ n: string }>(
      `select count(*)::text as n from public.visible_sittings where submitted_at is not null`,
    );
    expect(resolved.rows[0]!.n).toBe(direct.rows[0]!.n);
  });
});

describe("2. target-aware — a seeded cohort is counted once, from its origin", () => {
  let targetSession: string;

  beforeEach(async () => {
    await seedTerminalLegacySitting(client, STUDENT_A);
    await runBackfill(client);
    targetSession = await createTargetSitting(client, STUDENT_A);
  });

  it("counts the backfilled sitting once and the target sitting once", async () => {
    await asAuthenticated(client, STUDENT_A);
    const rows = await client.query<{ origin: string; n: string }>(
      `select origin, count(*)::text as n from public.visible_sittings
        where submitted_at is not null group by origin order by origin`,
    );
    /* Two legacy sittings — the shared fixture's and this file's — and exactly
       one target sitting. The two backfill copies appear nowhere. */
    expect(rows.rows).toEqual([
      { origin: "legacy", n: "2" },
      { origin: "version_pinned", n: "1" },
    ]);
  });

  it("counts the target sitting in the admin totals, once", async () => {
    await asAuthenticated(client, ADMIN);
    const totals = await client.query<{ total_attempts: string }>(
      `select total_attempts::text from public.admin_platform_totals`,
    );
    /* Four submitted sittings across all students: the shared fixture's one
       each for STUDENT_A and STUDENT_B, this file's legacy sitting, and the
       target sitting. A presence-probe rule would have said six — the two
       backfill copies counted a second time. */
    expect(totals.rows[0]!.total_attempts).toBe("4");
  });

  it("derives the target sitting's subject breakdown without a stored blob", async () => {
    await asAuthenticated(client, STUDENT_A);
    const row = await client.query<{ breakdowns: Record<string, unknown> }>(
      `select breakdowns from public.visible_sittings where session_id = $1`,
      [targetSession],
    );
    const bySubject = (row.rows[0]!.breakdowns as { bySubject: Record<string, unknown> }).bySubject;
    expect(Object.keys(bySubject)).toContain("numeracy");
  });

  it("still returns nothing for a learner who owns none of it", async () => {
    await asAuthenticated(client, STUDENT_B);
    const rows = await client.query<{ n: string }>(
      `select count(*)::text as n from public.visible_sittings where student_id = $1`,
      [STUDENT_A],
    );
    expect(rows.rows[0]!.n).toBe("0");
  });

  it("refuses anon every resolution view", async () => {
    await asAnon(client);
    for (const view of ["visible_sittings", "visible_sitting_questions", "visible_manual_marks"]) {
      await inSavepoint(() =>
        expect(client.query(`select * from public.${view}`)).rejects.toMatchObject({
          code: "42501",
        }),
      );
    }
  });

  it("keeps the shared views themselves ungranted", async () => {
    /* `resolved_*` sees both models whole. A learner grant on one would be every
       child's results, which is why access is applied per audience in a wrapper
       rather than shared along with the rule. */
    await asAuthenticated(client, STUDENT_A);
    for (const view of ["resolved_sittings", "resolved_sitting_questions", "resolved_manual_marks"]) {
      await inSavepoint(() =>
        expect(client.query(`select * from public.${view}`)).rejects.toMatchObject({
          code: "42501",
        }),
      );
    }
  });

  it("shows a linked parent their child's sittings and a teacher their student's", async () => {
    await asAuthenticated(client, PARENT_C);
    const parentView = await client.query<{ n: string }>(
      `select count(*)::text as n from public.visible_sittings where student_id = $1`,
      [STUDENT_A],
    );
    expect(Number(parentView.rows[0]!.n)).toBeGreaterThan(0);

    /* A teacher with no class containing this student sees nothing, which is
       the same answer the base policies give. */
    await asAuthenticated(client, TEACHER_D);
    const teacherView = await client.query<{ n: string }>(
      `select count(*)::text as n from public.visible_sittings where student_id = $1`,
      [STUDENT_A],
    );
    expect(teacherView.rows[0]!.n).toBe("0");
  });

  it("keeps per-question MARKS teacher-only", async () => {
    /* essay_marks has exactly one policy, and manual_marks restated it: a
       student or parent predicate on the union would be a product change
       smuggled in as a migration. */
    await asAuthenticated(client, STUDENT_A);
    const own = await client.query<{ n: string }>(
      `select count(*)::text as n from public.visible_manual_marks`,
    );
    expect(own.rows[0]!.n).toBe("0");
  });
});

describe("3. consistency — one product, one notion of a sitting", () => {
  beforeEach(async () => {
    await seedTerminalLegacySitting(client, STUDENT_A);
    await runBackfill(client);
    await createTargetSitting(client, STUDENT_A);
  });

  it("the learner's history and the admin totals count the same sittings", async () => {
    await asAuthenticated(client, STUDENT_A);
    const learner = await client.query<{ n: string }>(
      `select count(*)::text as n from public.visible_sittings where submitted_at is not null`,
    );

    await asAuthenticated(client, ADMIN);
    const admin = await client.query<{ total_attempts: string }>(
      `select total_attempts::text from public.admin_platform_totals`,
    );

    /* STUDENT_A is the only student with sittings beyond the shared fixture's
       one for STUDENT_B, so the admin figure is the learner's plus that one. */
    expect(Number(admin.rows[0]!.total_attempts)).toBe(Number(learner.rows[0]!.n) + 1);
  });

  it("agrees on the identity of a sitting, not just the count", async () => {
    await asOwner(client);
    const fromResolution = await client.query<{ session_id: string }>(
      `select session_id from public.resolved_sittings
        where student_id = $1 and submitted_at is not null order by session_id`,
      [STUDENT_A],
    );
    const fromQuestions = await client.query<{ session_id: string }>(
      `select distinct session_id from public.resolved_sitting_questions
        where student_id = $1 order by session_id`,
      [STUDENT_A],
    );
    /* Every sitting with questions is a sitting the sitting-level view knows
       about. A per-question view that could name a sitting the other could not
       would be the two halves disagreeing about what exists. */
    for (const row of fromQuestions.rows) {
      expect(fromResolution.rows.map((r) => r.session_id)).toContain(row.session_id);
    }
  });
});

describe("4. erasure — no reversible link in either model", () => {
  let targetSession: string;

  beforeEach(async () => {
    await seedTerminalLegacySitting(client, STUDENT_A);
    await runBackfill(client);
    targetSession = await createTargetSitting(client, STUDENT_A);
  });

  it("removes the child from both models and from the identity table", async () => {
    await asOwner(client);
    const summary = await client.query<{ body: Record<string, number> }>(
      `select public.erase_student($1, 'ticket-123') as body`,
      [STUDENT_A],
    );
    expect(summary.rows[0]!.body.targetSessionsDeleted).toBeGreaterThan(0);
    expect(summary.rows[0]!.body.legacySessionsDeleted).toBeGreaterThan(0);

    const remaining = await client.query<Record<string, string>>(
      `select
         (select count(*)::text from public.exam_sessions where student_id = $1) as legacy_sessions,
         (select count(*)::text from public.exam_attempts where student_id = $1) as legacy_attempts,
         (select count(*)::text from public.exam_responses where student_id = $1) as legacy_responses,
         (select count(*)::text from public.assessment_sessions where student_id = $1) as target_sessions,
         (select count(*)::text from public.assessment_results where student_id = $1) as target_results,
         (select count(*)::text from public.assessment_session_items where session_id = $2) as ledger,
         (select count(*)::text from public.session_responses where session_id = $2) as target_responses,
         (select count(*)::text from public.profiles where id = $1) as profiles,
         (select count(*)::text from auth.users where id = $1) as identities,
         (select count(*)::text from public.parent_children where child_id = $1) as links,
         (select count(*)::text from public.idempotency_keys where actor_id = $1) as idempotency`,
      [STUDENT_A, targetSession],
    );
    for (const [surface, count] of Object.entries(remaining.rows[0]!)) {
      expect(count, surface).toBe("0");
    }
  });

  it("leaves the child in no aggregate or resolution view", async () => {
    await asOwner(client);
    await client.query(`select public.erase_student($1, null)`, [STUDENT_A]);

    const resolved = await client.query<{ n: string }>(
      `select count(*)::text as n from public.resolved_sittings where student_id = $1`,
      [STUDENT_A],
    );
    expect(resolved.rows[0]!.n).toBe("0");

    const questions = await client.query<{ n: string }>(
      `select count(*)::text as n from public.resolved_sitting_questions where student_id = $1`,
      [STUDENT_A],
    );
    expect(questions.rows[0]!.n).toBe("0");

    await asAuthenticated(client, ADMIN);
    const totals = await client.query<{ total_attempts: string }>(
      `select total_attempts::text from public.admin_platform_totals`,
    );
    /* Only STUDENT_B's fixture sitting is left. An aggregate that still counted
       the erased child would be a record of them surviving the erasure. */
    expect(totals.rows[0]!.total_attempts).toBe("1");
  });

  it("records the event and nothing about the person", async () => {
    await asOwner(client);
    await client.query(`select public.erase_student($1, 'ticket-123')`, [STUDENT_A]);

    const audit = await client.query<Record<string, unknown>>(
      `select * from public.erasure_audit where subject_id = $1`,
      [STUDENT_A],
    );
    expect(audit.rowCount).toBe(1);

    const serialised = JSON.stringify(audit.rows[0]);
    /* No name, no email, no answer, no score, no config — §17.5 step 7. */
    expect(serialised).not.toMatch(/student-a@test\.local/);
    expect(serialised).not.toMatch(/objectivePercentage|questionDetails|breakdowns/);
    expect(serialised).toContain("ticket-123");
  });

  it("is not reachable by a learner or by anon", async () => {
    for (const actor of [STUDENT_B, null]) {
      if (actor) await asAuthenticated(client, actor);
      else await asAnon(client);
      await inSavepoint(() =>
        expect(client.query(`select public.erase_student($1, null)`, [STUDENT_A])).rejects.toMatchObject(
          { code: "42501" },
        ),
      );
    }
  });

  it("cannot be defeated by the backfill's restrict edges", async () => {
    /* The ordering trap: assessment_sessions.legacy_session_id is ON DELETE
       RESTRICT, so deleting the legacy sitting first raises. A workflow that got
       this wrong would fail on exactly the children who had been through the
       cutover — the ones with a backfill copy. */
    await asOwner(client);
    await inSavepoint(async () => {
      await expect(
        client.query(`delete from public.exam_sessions where student_id = $1`, [STUDENT_A]),
      ).rejects.toMatchObject({ code: "23503" });
    });

    /* And the function, which deletes in the order the constraints require,
       succeeds on the same data. */
    await expect(
      client.query(`select public.erase_student($1, null) as body`, [STUDENT_A]),
    ).resolves.toBeTruthy();
  });
});

describe("5. erasure — the whole graph, not just the two exam models (Gate A item A4; external review #8)", () => {
  /**
   * Block 4 above proves erase_student reaches the two sitting models
   * themselves and the identity row. External review #8's concern is broader:
   * spec §17.5 step 4 names "sessions, responses, results, marks,
   * assignments, analytics, exports, caches" as surfaces a link must be
   * removed from, and erase_student's own comments claim assignment links
   * and marks explicitly (20260815110000) — but nothing before this test
   * actually seeded a real row in `assignment_students`, `class_students`,
   * `manual_marks`, `essay_marks` or `session_ui_state` and checked it was
   * gone afterward. Those claims were true by code inspection, not proven.
   *
   * `assessment_cutover_cohort`, `assessment_session_stages` and
   * `stage_transitions` are included for the same reason `outbox_events` is
   * checked below even though nothing writes to it yet: the cascade is
   * correct today, and the moment adaptive delivery or the outbox gets a real
   * producer, this test already covers it rather than needing to be
   * remembered.
   *
   * `caches`, `exports` and a `search index` are deliberately NOT seeded or
   * checked here, and that omission is not an oversight: a source-wide check
   * (no `create table` matching those names anywhere under
   * `supabase/migrations/`) confirms none of those subsystems exist in this
   * repository yet. Fine-grained interaction telemetry likewise does not
   * exist (ADR-012 §6: "none yet — n/a, the obligation attaches when
   * telemetry ships"). There is nothing in the database for erase_student to
   * reach for any of the four, and a test asserting zero rows in a table
   * that cannot exist would prove nothing.
   */
  it("also empties assignment links, class membership, manual marks, essay marks, UI state, the cohort table, and every future-facing table wired to cascade", async () => {
    await seedTerminalLegacySitting(client, STUDENT_A);
    await runBackfill(client);
    const targetSession = await createTargetSitting(client, STUDENT_A);

    await asOwner(client);

    /* createTargetSitting opens the cohort with cohort_mode = 'all', which
       needs no per-student row, so a real one is inserted directly here --
       'student_ids' mode is the shape a first real cohort takes
       (openTestCohort in target-sitting.ts), and either way the table can
       carry a live row erasure must reach. */
    await client.query(
      `insert into public.assessment_cutover_cohort (student_id) values ($1) on conflict do nothing`,
      [STUDENT_A],
    );

    const klass = await client.query<{ id: string }>(
      `insert into public.classes (teacher_id, name) values ($1, 'Whole-graph 5A') returning id`,
      [TEACHER_D],
    );
    await client.query(`insert into public.class_students (class_id, student_id) values ($1, $2)`, [
      klass.rows[0]!.id,
      STUDENT_A,
    ]);

    const assignment = await client.query<{ id: string }>(
      `insert into public.assignments (class_id, created_by, config) values ($1, $2, '{}'::jsonb) returning id`,
      [klass.rows[0]!.id, TEACHER_D],
    );
    await client.query(`insert into public.assignment_students (assignment_id, student_id) values ($1, $2)`, [
      assignment.rows[0]!.id,
      STUDENT_A,
    ]);
    await asAuthenticated(client, STUDENT_A);
    await client.query(
      `select public.link_assessment_session_to_assignment($1::uuid, $2::uuid)`,
      [assignment.rows[0]!.id, targetSession],
    );

    await asOwner(client);
    /* legacy_question_id branch: proves the cascade without needing a real
       served item from this fixture's own ledger. */
    await client.query(
      `insert into public.manual_marks (session_id, legacy_question_id, marked_by, awarded_marks, max_marks, feedback)
       values ($1, 'q-whole-graph', $2, 1, 1, 'seeded for erasure coverage')`,
      [targetSession, TEACHER_D],
    );

    const legacyAttempt = await client.query<{ id: string }>(
      `select id from public.exam_attempts where student_id = $1`,
      [STUDENT_A],
    );
    await client.query(
      `insert into public.essay_marks (attempt_id, question_id, marked_by, awarded_marks, max_marks)
       values ($1, 'q-whole-graph', $2, 1, 1)`,
      [legacyAttempt.rows[0]!.id, TEACHER_D],
    );

    /* A second, non-terminal sitting: session_ui_state's own trigger refuses a
       write to a terminal session for every role (the same no-exemption
       posture as the response lock), and createTargetSitting's fixture is
       always left 'processed'. This is testing whether erasure reaches
       session_ui_state, not the write path A1 already covers, so a plain
       active sitting is the honest way to get a real row there. */
    await asAuthenticated(client, STUDENT_A);
    const uiStateSession = await client.query<{ body: { sessionId: string } }>(
      `select public.create_assessment_session($1::jsonb, $2) as body`,
      [JSON.stringify(CONFIG), `whole-graph-uistate-${STUDENT_A}`],
    );
    const uiStateSessionId = uiStateSession.rows[0]!.body.sessionId;
    await asOwner(client);
    await client.query(
      `insert into public.session_ui_state (session_id, current_question_index, flagged_session_item_ids, client_sequence)
       values ($1, 1, '{}'::uuid[], 1)`,
      [uiStateSessionId],
    );

    await asOwner(client);
    const before = await client.query<Record<string, string>>(
      `select
         (select count(*)::text from public.class_students where student_id = $1) as class_students,
         (select count(*)::text from public.assignment_students where student_id = $1) as assignment_students,
         (select count(*)::text from public.manual_marks where session_id = $2) as manual_marks,
         (select count(*)::text from public.essay_marks where attempt_id = $3) as essay_marks,
         (select count(*)::text from public.session_ui_state where session_id = $4) as session_ui_state,
         (select count(*)::text from public.assessment_cutover_cohort where student_id = $1) as cohort`,
      [STUDENT_A, targetSession, legacyAttempt.rows[0]!.id, uiStateSessionId],
    );
    /* Guards the fixture itself: a table already empty before erasure would
       make the assertion after erasure vacuously true. */
    for (const [surface, count] of Object.entries(before.rows[0]!)) {
      expect(Number(count), `fixture did not actually seed ${surface}`).toBeGreaterThan(0);
    }

    await asOwner(client);
    await client.query(`select public.erase_student($1, 'whole-graph-ticket')`, [STUDENT_A]);

    const after = await client.query<Record<string, string>>(
      `select
         (select count(*)::text from public.class_students where student_id = $1) as class_students,
         (select count(*)::text from public.assignment_students where student_id = $1) as assignment_students,
         (select count(*)::text from public.manual_marks where session_id = $2) as manual_marks,
         (select count(*)::text from public.essay_marks where attempt_id = $3) as essay_marks,
         (select count(*)::text from public.session_ui_state where session_id = $4) as session_ui_state,
         (select count(*)::text from public.assessment_cutover_cohort where student_id = $1) as cohort,
         (select count(*)::text from public.assessment_session_items where session_id = $2) as ledger,
         (select count(*)::text from public.assessment_session_stages where session_id = $2) as stages,
         (select count(*)::text from public.stage_transitions where session_id = $2) as transitions,
         (select count(*)::text from public.outbox_events where session_id = $2) as outbox`,
      [STUDENT_A, targetSession, legacyAttempt.rows[0]!.id, uiStateSessionId],
    );
    for (const [surface, count] of Object.entries(after.rows[0]!)) {
      expect(count, surface).toBe("0");
    }
  });

  it("has no table with a live FK to profiles(id) that this suite (or block 4 above) does not account for", async () => {
    /* A durable guard, not a snapshot: if a future migration adds a new table
       naming a child directly, this fails until someone adds it to the
       accounted-for list below, rather than silently shipping a link
       erase_student was never taught to sever. Every table here is either
       walked by name in block 4, walked by name in the test above, or listed
       as a known-safe non-child reference (a teacher/admin/parent actor
       column, not the child being erased). */
    await asOwner(client);
    const linked = await client.query<{ table_name: string; column_name: string }>(
      `select tc.table_name, kcu.column_name
         from information_schema.table_constraints tc
         join information_schema.key_column_usage kcu
           on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
         join information_schema.referential_constraints rc
           on rc.constraint_name = tc.constraint_name and rc.constraint_schema = tc.table_schema
         join information_schema.constraint_column_usage ccu
           on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
        where tc.constraint_type = 'FOREIGN KEY'
          and tc.table_schema = 'public'
          and ccu.table_name = 'profiles'
          and ccu.column_name = 'id'
        order by tc.table_name, kcu.column_name`,
    );

    const CHILD_IDENTITY_COLUMNS_ACCOUNTED_FOR = new Set([
      "assessment_cutover_cohort.student_id",
      "assessment_results.student_id",
      "assessment_sessions.student_id",
      "assignment_students.student_id",
      "class_students.student_id",
      "exam_attempts.student_id",
      "exam_responses.student_id",
      "exam_sessions.student_id",
      "idempotency_keys.actor_id",
      "parent_children.child_id",
    ]);
    /* Actor columns: the profile named is whoever performed the action
       (teacher, admin, parent, assignment author), never the child being
       erased. Erasing a child must not, and does not, touch these rows. */
    const NON_CHILD_ACTOR_COLUMNS = new Set([
      "assignments.created_by",
      "classes.teacher_id",
      "erasure_requests.cancelled_by",
      "erasure_requests.requested_by",
      "essay_marks.marked_by",
      "manual_marks.marked_by",
      "parent_children.parent_id",
      "subscriptions.parent_id",
    ]);

    const unaccounted = linked.rows
      .map((row) => `${row.table_name}.${row.column_name}`)
      .filter(
        (key) =>
          !CHILD_IDENTITY_COLUMNS_ACCOUNTED_FOR.has(key) && !NON_CHILD_ACTOR_COLUMNS.has(key),
      );
    expect(unaccounted, "new FK(s) to profiles(id) not yet classified as child-identity or actor").toEqual([]);
  });
});
