/**
 * `npm run cutover:verify` — the Phase 2 exit gate (spec §12.7 step 5, §22;
 * ADR-005 §5).
 *
 * "Shadow verification is a gate, not a report." Any unexplained mismatch exits
 * non-zero. "Explained" means recorded here with a reason, not silenced — the
 * report prints explained differences too, so a reader can disagree with the
 * explanation.
 *
 * IT NEVER COMMITS. Everything below runs inside one transaction that is rolled
 * back unconditionally, including the two backfill passes used to prove
 * idempotency. That makes the gate safe to point at production: it verifies the
 * state that is there, proves a backfill would be a no-op, and leaves nothing
 * behind. Persisting a backfill is a separate, explicit command
 * (`npm run cutover:backfill`).
 *
 * `--fixture` seeds a small synthetic legacy dataset first, also inside the
 * rolled-back transaction. CI uses it, because a fresh CI database has no legacy
 * rows at all and a reconciliation over zero sittings is a green light that
 * proves nothing. With the fixture, every comparison below runs against real
 * rows on every push.
 */
import { connect } from "./migrations/verify";

interface Finding {
  /** Which comparison produced this. */
  readonly check: string;
  /** The row or pair it concerns. */
  readonly subject: string;
  readonly detail: string;
  /**
   * Present when the difference is intended. An explained finding is reported
   * and does not block; an unexplained one blocks. There is deliberately no
   * "warning" tier — a difference is either understood or it is a defect.
   */
  readonly reason?: string;
}

const findings: Finding[] = [];
const counts: Record<string, number | string> = {};

function record(finding: Finding): void {
  findings.push(finding);
}

const useFixture = process.argv.includes("--fixture");

const client = await connect();

/** Impersonates a signed-in learner exactly as PostgREST does. */
async function asAuthenticated(sub: string): Promise<void> {
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub, role: "authenticated" }),
  ]);
}

async function asOwner(): Promise<void> {
  await client.query("reset role");
}

/* ------------------------------------------------------------------------ */
/* Fixture                                                                    */
/* ------------------------------------------------------------------------ */

const FIXTURE_STUDENT = "88888888-0000-0000-0000-0000000000a1";
const FIXTURE_OTHER = "88888888-0000-0000-0000-0000000000a2";

async function seedFixture(): Promise<void> {
  /* Deliberately shaped to exercise every branch the reconciliation has an
     opinion about: a submitted sitting with a correct, an unanswered and a
     manual-review question; an expired sitting with no attempt; and an ACTIVE
     sitting that must not be copied at all. */
  await client.query(`insert into auth.users (id, email) values ($1, $2), ($3, $4)`, [
    FIXTURE_STUDENT,
    "cutover-fixture@test.local",
    FIXTURE_OTHER,
    "cutover-other@test.local",
  ]);

  const questionDetails = [
    { questionId: "fx-1", status: "correct", awardedMarks: 1, availableMarks: 1 },
    { questionId: "fx-2", status: "unanswered", awardedMarks: 0, availableMarks: 1 },
    /* awardedMarks 0 on a pending essay is the legacy model's fabricated zero —
       the one difference the target model corrects, and one the report has to
       explain rather than flag. */
    { questionId: "fx-3", status: "manual_review", awardedMarks: 0, availableMarks: 5 },
  ].map((detail) => ({
    ...detail,
    attempted: detail.status !== "unanswered",
    requiresManualMarking: detail.status === "manual_review",
    pendingManualReview: detail.status === "manual_review",
  }));

  const result = {
    totalQuestions: 3,
    attemptedQuestions: 2,
    autoMarkedQuestions: 2,
    manualReviewQuestions: 1,
    correctCount: 1,
    incorrectCount: 0,
    unansweredCount: 1,
    objectiveMarksEarned: 1,
    objectiveMarksAvailable: 2,
    objectivePercentage: 50,
    pendingManualMarks: 1,
    timeTakenSeconds: 600,
    submissionReason: "user_submitted",
    startedAt: Date.parse("2026-08-01T09:00:00.000Z"),
    submittedAt: Date.parse("2026-08-01T09:10:00.000Z"),
    questionDetails,
    breakdowns: {},
  };

  const submitted = await client.query<{ id: string }>(
    `insert into public.exam_sessions
       (student_id, config, seed, selected_question_ids, created_at, expires_at)
     values ($1, '{"yearLevel":5}'::jsonb, 'fx-seed', array['fx-1','fx-2','fx-3'],
             now() - interval '3 hours', now() - interval '1 hour')
     returning id`,
    [FIXTURE_STUDENT],
  );
  const attempt = await client.query<{ id: string }>(
    `insert into public.exam_attempts (session_id, student_id, responses, result, submitted_at)
     values ($1, $2, '{"fx-1":"b","fx-3":"an essay"}'::jsonb, $3::jsonb, now() - interval '2 hours')
     returning id`,
    [submitted.rows[0]!.id, FIXTURE_STUDENT, JSON.stringify(result)],
  );
  await client.query(
    `insert into public.essay_marks (attempt_id, question_id, marked_by, awarded_marks, max_marks, feedback)
     values ($1, 'fx-3', $2, 4, 5, 'Clear argument.')`,
    [attempt.rows[0]!.id, FIXTURE_OTHER],
  );

  /* Expired, never submitted — must land as 'abandoned' with its autosave. */
  const expired = await client.query<{ id: string }>(
    `insert into public.exam_sessions
       (student_id, config, seed, selected_question_ids, created_at, expires_at)
     values ($1, '{}'::jsonb, 'fx-seed-2', array['fx-1','fx-2'],
             now() - interval '5 hours', now() - interval '4 hours')
     returning id`,
    [FIXTURE_OTHER],
  );
  await client.query(
    `insert into public.exam_responses
       (session_id, student_id, responses, current_question_index, flagged_question_ids)
     values ($1, $2, '{"fx-1":"c"}'::jsonb, 1, array[]::text[])`,
    [expired.rows[0]!.id, FIXTURE_OTHER],
  );

  /* Active. The one row this phase must not touch. */
  await client.query(
    `insert into public.exam_sessions
       (student_id, config, seed, selected_question_ids, created_at, expires_at)
     values ($1, '{}'::jsonb, 'fx-seed-3', array['fx-1'],
             now() - interval '10 minutes', now() + interval '2 hours')`,
    [FIXTURE_STUDENT],
  );
}

/* ------------------------------------------------------------------------ */
/* Checks                                                                     */
/* ------------------------------------------------------------------------ */

/** §12.7 step 3: only terminal sittings, and every one of them. */
async function checkCoverage(): Promise<void> {
  const missed = await client.query<{ id: string; reason: string }>(
    `select es.id,
            case when exists (select 1 from public.exam_attempts a where a.session_id = es.id)
                 then 'has an attempt' else 'past expires_at' end as reason
       from public.exam_sessions es
      where (exists (select 1 from public.exam_attempts a where a.session_id = es.id)
             or es.expires_at < now())
        and not exists (
          select 1 from public.assessment_sessions s where s.legacy_session_id = es.id
        )`,
  );
  for (const row of missed.rows) {
    record({
      check: "coverage",
      subject: `exam_sessions ${row.id}`,
      detail: `terminal (${row.reason}) but not backfilled`,
    });
  }

  const premature = await client.query<{ id: string }>(
    `select es.id from public.exam_sessions es
      join public.assessment_sessions s on s.legacy_session_id = es.id
     where not exists (select 1 from public.exam_attempts a where a.session_id = es.id)
       and es.expires_at > now()`,
  );
  for (const row of premature.rows) {
    record({
      check: "coverage",
      subject: `exam_sessions ${row.id}`,
      detail: "ACTIVE session was backfilled — a live sitting must never be copied (ADR-005 §1)",
    });
  }

  const totals = await client.query<{
    legacy_terminal: string;
    backfilled: string;
    legacy_active: string;
  }>(
    `select
       (select count(*) from public.exam_sessions es
         where exists (select 1 from public.exam_attempts a where a.session_id = es.id)
            or es.expires_at < now())::text as legacy_terminal,
       (select count(*) from public.assessment_sessions where legacy_session_id is not null)::text as backfilled,
       (select count(*) from public.exam_sessions es
         where not exists (select 1 from public.exam_attempts a where a.session_id = es.id)
           and es.expires_at > now())::text as legacy_active`,
  );
  counts["legacy terminal sessions"] = Number(totals.rows[0]!.legacy_terminal);
  counts["backfilled sessions"] = Number(totals.rows[0]!.backfilled);
  counts["legacy active sessions (untouched)"] = Number(totals.rows[0]!.legacy_active);
}

/** Ownership and the timestamps ADR-005 §5 names. */
async function checkSessionFields(): Promise<void> {
  const mismatches = await client.query<{
    id: string;
    field: string;
    legacy: string;
    target: string;
  }>(
    `select es.id, x.field, x.legacy, x.target
       from public.exam_sessions es
       join public.assessment_sessions s on s.legacy_session_id = es.id
       cross join lateral (values
         ('student_id', es.student_id::text, s.student_id::text),
         ('created_at', es.created_at::text, s.created_at::text),
         ('expires_at', es.expires_at::text, s.expires_at::text),
         ('seed', es.seed, s.seed),
         ('config', es.config::text, s.config::text)
       ) as x(field, legacy, target)
      where x.legacy is distinct from x.target`,
  );
  for (const row of mismatches.rows) {
    record({
      check: "session fields",
      subject: `session ${row.id}`,
      detail: `${row.field}: legacy ${row.legacy} vs target ${row.target}`,
    });
  }

  /* The submission timestamp comes from the attempt, not the session. */
  const submitted = await client.query<{ id: string; legacy: string; target: string }>(
    `select es.id, att.submitted_at::text as legacy, s.submitted_at::text as target
       from public.exam_sessions es
       join public.assessment_sessions s on s.legacy_session_id = es.id
       join public.exam_attempts att on att.session_id = es.id
      where s.submitted_at is distinct from att.submitted_at`,
  );
  for (const row of submitted.rows) {
    record({
      check: "session fields",
      subject: `session ${row.id}`,
      detail: `submitted_at: legacy ${row.legacy} vs target ${row.target}`,
    });
  }

  const lifecycle = await client.query<{ id: string; status: string; has_attempt: boolean }>(
    `select es.id, s.status,
            exists (select 1 from public.exam_attempts a where a.session_id = es.id) as has_attempt
       from public.exam_sessions es
       join public.assessment_sessions s on s.legacy_session_id = es.id
      where (exists (select 1 from public.exam_attempts a where a.session_id = es.id)
             and s.status <> 'submitted')
         or (not exists (select 1 from public.exam_attempts a where a.session_id = es.id)
             and s.status <> 'abandoned')`,
  );
  for (const row of lifecycle.rows) {
    record({
      check: "lifecycle",
      subject: `session ${row.id}`,
      detail: `status ${row.status} for a sitting that ${row.has_attempt ? "has" : "has no"} attempt`,
    });
  }
}

/** Served questions and the values recorded against them. */
async function checkResponses(): Promise<void> {
  const coverage = await client.query<{ id: string; served: string; stored: string }>(
    `select es.id,
            array_length(es.selected_question_ids, 1)::text as served,
            (select count(*) from public.session_responses r where r.session_id = s.id)::text as stored
       from public.exam_sessions es
       join public.assessment_sessions s on s.legacy_session_id = es.id
      where array_length(es.selected_question_ids, 1)
            is distinct from (select count(*)::integer from public.session_responses r where r.session_id = s.id)`,
  );
  for (const row of coverage.rows) {
    record({
      check: "response coverage",
      subject: `session ${row.id}`,
      detail: `${row.served} question(s) served but ${row.stored} response row(s) stored`,
    });
  }

  /* Served ORDER. For a bound sitting the ledger carries it; for an unversioned
     one there is no ordinal column to compare, so order degrades to set
     membership — recorded in the report rather than quietly skipped. */
  const order = await client.query<{ id: string; detail: string }>(
    `select es.id,
            'ledger order ' || array_agg(si.global_ordinal::text order by si.global_ordinal)::text
              || ' vs served ' || es.selected_question_ids::text as detail
       from public.exam_sessions es
       join public.assessment_sessions s on s.legacy_session_id = es.id
       join public.assessment_session_items si on si.session_id = s.id
       join public.items i on i.id = si.item_id
      where s.content_identity = 'version_pinned'
      group by es.id, es.selected_question_ids
     having array_agg(i.item_code order by si.global_ordinal) is distinct from es.selected_question_ids`,
  );
  for (const row of order.rows) {
    record({
      check: "served order",
      subject: `session ${row.id}`,
      detail: row.detail,
    });
  }

  const values = await client.query<{
    id: string;
    question_id: string;
    legacy: string | null;
    target: string | null;
  }>(
    `select es.id, q.question_id,
            (coalesce(att.responses, er.responses) -> q.question_id)::text as legacy,
            r.response_value::text as target
       from public.exam_sessions es
       join public.assessment_sessions s on s.legacy_session_id = es.id
       cross join lateral unnest(es.selected_question_ids) as q(question_id)
       left join public.exam_attempts att on att.session_id = es.id
       left join public.exam_responses er on er.session_id = es.id
       left join public.session_responses r
         on r.session_id = s.id and r.legacy_question_id = q.question_id
      where s.content_identity = 'legacy_unversioned'
        and (coalesce(att.responses, er.responses) -> q.question_id)::text
            is distinct from r.response_value::text`,
  );
  for (const row of values.rows) {
    record({
      check: "response values",
      subject: `session ${row.id} / ${row.question_id}`,
      detail: `legacy ${row.legacy ?? "null"} vs target ${row.target ?? "null"}`,
    });
  }
}

/** Result totals and per-question statuses, against the preserved blob. */
async function checkResults(): Promise<void> {
  const orphaned = await client.query<{ attempt_id: string }>(
    `select att.id as attempt_id
       from public.exam_attempts att
       join public.assessment_sessions s on s.legacy_session_id = att.session_id
      where not exists (
        select 1 from public.assessment_results r where r.legacy_attempt_id = att.id
      )`,
  );
  for (const row of orphaned.rows) {
    const mappable = await client.query<{ ok: boolean }>(
      `select public.legacy_result_is_mappable(result) as ok from public.exam_attempts where id = $1`,
      [row.attempt_id],
    );
    record({
      check: "result coverage",
      subject: `exam_attempts ${row.attempt_id}`,
      detail: mappable.rows[0]!.ok
        ? "a mappable attempt produced no target result row"
        : "result blob is not mappable onto the typed columns; no row was written and no value invented",
    });
  }

  /* Verbatim preservation — the whole basis on which a legacy_unversioned
     sitting is compared at all (§12.7 step 4). */
  const blob = await client.query<{ attempt_id: string }>(
    `select att.id as attempt_id
       from public.exam_attempts att
       join public.assessment_results r on r.legacy_attempt_id = att.id
      where r.legacy_result is distinct from att.result`,
  );
  for (const row of blob.rows) {
    record({
      check: "result blob",
      subject: `exam_attempts ${row.attempt_id}`,
      detail: "preserved legacy_result differs from exam_attempts.result — history was rewritten",
    });
  }

  const totals = await client.query<{ attempt_id: string; field: string; legacy: string; target: string }>(
    `select att.id as attempt_id, x.field, x.legacy, x.target
       from public.exam_attempts att
       join public.assessment_results r on r.legacy_attempt_id = att.id
       cross join lateral (values
         ('totalQuestions', att.result ->> 'totalQuestions', r.total_items::text),
         ('attemptedQuestions', att.result ->> 'attemptedQuestions', r.attempted_items::text),
         ('correctCount', att.result ->> 'correctCount', r.correct_count::text),
         ('incorrectCount', att.result ->> 'incorrectCount', r.incorrect_count::text),
         ('unansweredCount', att.result ->> 'unansweredCount', r.unanswered_count::text),
         ('manualReviewQuestions', att.result ->> 'manualReviewQuestions', r.manual_review_items::text),
         ('objectiveMarksEarned', att.result ->> 'objectiveMarksEarned', r.objective_awarded_marks::text),
         ('objectiveMarksAvailable', att.result ->> 'objectiveMarksAvailable', r.objective_available_marks::text),
         ('objectivePercentage', att.result ->> 'objectivePercentage', r.objective_percentage::text),
         ('pendingManualMarks', att.result ->> 'pendingManualMarks', r.pending_manual_marks::text),
         ('timeTakenSeconds', att.result ->> 'timeTakenSeconds', r.time_taken_seconds::text),
         ('submissionReason', att.result ->> 'submissionReason', r.submission_reason)
       ) as x(field, legacy, target)
      where x.legacy is distinct from x.target`,
  );
  for (const row of totals.rows) {
    record({
      check: "result totals",
      subject: `exam_attempts ${row.attempt_id}`,
      detail: `${row.field}: legacy ${row.legacy} vs target ${row.target}`,
    });
  }

  /* Per-question statuses, plus the one difference that IS expected. */
  const perQuestion = await client.query<{
    attempt_id: string;
    question_id: string;
    legacy_status: string;
    target_status: string | null;
    legacy_awarded: string;
    target_awarded: string | null;
  }>(
    `select att.id as attempt_id,
            d ->> 'questionId' as question_id,
            d ->> 'status' as legacy_status,
            r.score_status as target_status,
            d ->> 'awardedMarks' as legacy_awarded,
            r.awarded_marks::text as target_awarded
       from public.exam_attempts att
       join public.assessment_sessions s on s.legacy_session_id = att.session_id
       cross join lateral jsonb_array_elements(coalesce(att.result -> 'questionDetails', '[]'::jsonb)) as d
       left join public.session_responses r
         on r.session_id = s.id and r.legacy_question_id = d ->> 'questionId'
      where r.score_status is distinct from d ->> 'status'
         or r.awarded_marks::text is distinct from d ->> 'awardedMarks'`,
  );
  for (const row of perQuestion.rows) {
    const isManualZero =
      row.legacy_status === "manual_review" &&
      row.target_status === "manual_review" &&
      row.target_awarded === null;
    record({
      check: "per-question outcome",
      subject: `exam_attempts ${row.attempt_id} / ${row.question_id}`,
      detail:
        `status ${row.legacy_status} vs ${row.target_status ?? "null"}, ` +
        `awarded ${row.legacy_awarded} vs ${row.target_awarded ?? "null"}`,
      /* The deliberate correction, not a mismatch: buildExamResult coalesces a
         manual item's null marks to 0, and §14.3 forbids that fabricated
         correctness on an unmarked item. The legacy blob keeps its own 0. */
      reason: isManualZero
        ? "manual-review item: legacy stores a fabricated 0, target stores NULL per §14.3"
        : undefined,
    });
  }
}

/** Manual marks. */
async function checkManualMarks(): Promise<void> {
  const missing = await client.query<{ id: string }>(
    `select em.id from public.essay_marks em
       join public.exam_attempts att on att.id = em.attempt_id
       join public.assessment_sessions s on s.legacy_session_id = att.session_id
      where not exists (
        select 1 from public.manual_marks m where m.legacy_essay_mark_id = em.id
      )`,
  );
  for (const row of missing.rows) {
    record({
      check: "manual marks",
      subject: `essay_marks ${row.id}`,
      detail: "not backfilled into manual_marks",
    });
  }

  const differing = await client.query<{ id: string; detail: string }>(
    `select em.id,
            'awarded ' || em.awarded_marks::text || ' vs ' || m.awarded_marks::text ||
            ', max ' || em.max_marks::text || ' vs ' || m.max_marks::text as detail
       from public.essay_marks em
       join public.manual_marks m on m.legacy_essay_mark_id = em.id
      where em.awarded_marks is distinct from m.awarded_marks
         or em.max_marks is distinct from m.max_marks
         or em.marked_by is distinct from m.marked_by
         or em.feedback is distinct from m.feedback`,
  );
  for (const row of differing.rows) {
    record({ check: "manual marks", subject: `essay_marks ${row.id}`, detail: row.detail });
  }
}

/** §12.7 step 4 / ADR-005 §4: labelled honestly, and never recomputed. */
async function checkContentIdentity(): Promise<void> {
  const split = await client.query<{ pinned: string; unversioned: string; ledger: string }>(
    `select
       (select count(*) from public.assessment_sessions
         where legacy_session_id is not null and content_identity = 'version_pinned')::text as pinned,
       (select count(*) from public.assessment_sessions
         where legacy_session_id is not null and content_identity = 'legacy_unversioned')::text as unversioned,
       (select count(*) from public.assessment_session_items si
         join public.assessment_sessions s on s.id = si.session_id
        where s.legacy_session_id is not null)::text as ledger`,
  );
  counts["backfilled: version_pinned"] = Number(split.rows[0]!.pinned);
  counts["backfilled: legacy_unversioned"] = Number(split.rows[0]!.unversioned);
  counts["backfilled ledger rows"] = Number(split.rows[0]!.ledger);

  /* ADR-005 §5's specific check: a session that is neither pinned nor labelled
     is the failure this exists to find. */
  const unlabelled = await client.query<{ id: string }>(
    `select s.id from public.assessment_sessions s
      where s.legacy_session_id is not null
        and s.content_identity = 'legacy_unversioned'
        and exists (select 1 from public.assessment_session_items si where si.session_id = s.id)`,
  );
  for (const row of unlabelled.rows) {
    record({
      check: "content identity",
      subject: `session ${row.id}`,
      detail: "labelled legacy_unversioned yet carries ledger rows — a fabricated exposure ledger",
    });
  }

  const pinnedWithoutLedger = await client.query<{ id: string }>(
    `select s.id from public.assessment_sessions s
      where s.legacy_session_id is not null
        and s.content_identity = 'version_pinned'
        and not exists (select 1 from public.assessment_session_items si where si.session_id = s.id)`,
  );
  for (const row of pinnedWithoutLedger.rows) {
    record({
      check: "content identity",
      subject: `session ${row.id}`,
      detail: "claims version_pinned with no ledger — an unprovable claim of reproducibility",
    });
  }

  /* Never recomputed, asserted two independent ways. */
  const recomputable = await client.query<{ id: string; version: string }>(
    `select s.id, s.scoring_algorithm_version as version
       from public.assessment_sessions s
      where s.legacy_session_id is not null
        and s.scoring_algorithm_version = 'question-scorers.v1'`,
  );
  for (const row of recomputable.rows) {
    record({
      check: "never recomputed",
      subject: `session ${row.id}`,
      detail: `pins ${row.version}, an algorithm the scoring module WILL run`,
    });
  }

  const rescored = await client.query<{ id: string }>(
    `select s.id from public.assessment_sessions s
       join public.assessment_results r on r.session_id = s.id
      where s.legacy_session_id is not null and r.legacy_result is null`,
  );
  for (const row of rescored.rows) {
    record({
      check: "never recomputed",
      subject: `session ${row.id}`,
      detail: "backfilled sitting has a result with no preserved legacy blob — it was recomputed",
    });
  }
}

/**
 * The 2a lesson: a schema-side check cannot see a policy-visibility gap. These
 * connect as the roles whose access is actually in question.
 */
async function checkRoleVisibility(): Promise<void> {
  const owners = await client.query<{ student_id: string; session_id: string }>(
    `select s.student_id, s.id as session_id
       from public.assessment_sessions s
      where s.legacy_session_id is not null
      order by s.created_at limit 1`,
  );
  if (owners.rowCount === 0) {
    record({
      check: "role visibility",
      subject: "backfilled sessions",
      detail: "no backfilled session to check visibility against",
      reason: "nothing terminal in this database; run with --fixture to exercise the checks",
    });
    return;
  }

  const { student_id: owner, session_id: sessionId } = owners.rows[0]!;

  await asAuthenticated(owner);
  const own = await client.query(
    `select 1 from public.assessment_sessions where id = $1`,
    [sessionId],
  );
  if (own.rowCount !== 1) {
    record({
      check: "role visibility",
      subject: `session ${sessionId}`,
      detail:
        "the owning student cannot read their own backfilled session — a grant without a " +
        "matching policy is not a narrower permission, it is zero rows",
    });
  }

  const ownResult = await client.query(
    `select 1 from public.assessment_results where session_id = $1`,
    [sessionId],
  );
  const hasResult = await (async () => {
    await asOwner();
    const r = await client.query(`select 1 from public.assessment_results where session_id = $1`, [
      sessionId,
    ]);
    await asAuthenticated(owner);
    return r.rowCount === 1;
  })();
  if (hasResult && ownResult.rowCount !== 1) {
    record({
      check: "role visibility",
      subject: `session ${sessionId}`,
      detail: "the owning student cannot read their own backfilled result",
    });
  }

  /* And the negative: somebody else's sitting must not be visible. */
  const stranger = await client.query<{ id: string }>(
    `select id from public.profiles where id <> $1 limit 1`,
    [owner],
  );
  if (stranger.rowCount === 1) {
    await asAuthenticated(stranger.rows[0]!.id);
    const leaked = await client.query(
      `select 1 from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    if (leaked.rowCount !== 0) {
      record({
        check: "role visibility",
        subject: `session ${sessionId}`,
        detail: `visible to unrelated profile ${stranger.rows[0]!.id}`,
      });
    }
  }
  await asOwner();

  /* The scoring role must be able to SEE a backfilled sitting and still refuse
     it. If it could not see it, "never recomputed" would be true for the wrong
     reason and would stop being true the day a policy widened. */
  const scoringSees = await client.query<{ visible: boolean }>(
    `select has_table_privilege('mindmosaic_scoring', 'public.assessment_sessions', 'SELECT')
            as visible`,
  );
  if (!scoringSees.rows[0]!.visible) {
    record({
      check: "role visibility",
      subject: "mindmosaic_scoring",
      detail: "cannot select assessment_sessions, so its refusal to rescore proves nothing",
    });
  }
}

/** §22: backfill twice, change nothing. */
async function checkIdempotency(): Promise<void> {
  const fingerprint = async (): Promise<string> =>
    (
      await client.query<{ digest: string }>(
        `select md5(
                  coalesce((select string_agg(t::text, '|' order by t::text) from public.assessment_sessions t), '') ||
                  coalesce((select string_agg(t::text, '|' order by t::text) from public.assessment_session_items t), '') ||
                  coalesce((select string_agg(t::text, '|' order by t::text) from public.session_responses t), '') ||
                  coalesce((select string_agg(t::text, '|' order by t::text) from public.assessment_results t), '') ||
                  coalesce((select string_agg(t::text, '|' order by t::text) from public.manual_marks t), '')
                ) as digest`,
      )
    ).rows[0]!.digest;

  const legacyFingerprint = async (): Promise<string> =>
    (
      await client.query<{ digest: string }>(
        `select md5(
                  coalesce((select string_agg(t::text, '|' order by t::text) from public.exam_sessions t), '') ||
                  coalesce((select string_agg(t::text, '|' order by t::text) from public.exam_attempts t), '') ||
                  coalesce((select string_agg(t::text, '|' order by t::text) from public.exam_responses t), '') ||
                  coalesce((select string_agg(t::text, '|' order by t::text) from public.essay_marks t), '')
                ) as digest`,
      )
    ).rows[0]!.digest;

  const legacyBefore = await legacyFingerprint();

  const first = await client.query<{ summary: Record<string, number> }>(
    `select public.backfill_legacy_terminal_sessions() as summary`,
  );
  const afterFirst = await fingerprint();

  const second = await client.query<{ summary: Record<string, number> }>(
    `select public.backfill_legacy_terminal_sessions() as summary`,
  );
  const afterSecond = await fingerprint();

  counts["backfill pass 1 sessions inserted"] = first.rows[0]!.summary.sessionsInserted;
  counts["backfill pass 2 sessions inserted"] = second.rows[0]!.summary.sessionsInserted;

  for (const [metric, value] of Object.entries(second.rows[0]!.summary)) {
    if (metric.endsWith("Inserted") && value !== 0) {
      record({
        check: "idempotency",
        subject: "second backfill pass",
        detail: `${metric} = ${value}; a re-run must insert nothing`,
      });
    }
  }

  if (afterSecond !== afterFirst) {
    record({
      check: "idempotency",
      subject: "second backfill pass",
      detail: "target state changed on the second pass — settled evidence was mutated (§5.3)",
    });
  }

  /* The hard invariant, checked around the whole operation rather than trusted:
     the backfill reads the legacy tables and writes none of them. */
  if ((await legacyFingerprint()) !== legacyBefore) {
    record({
      check: "legacy immutability",
      subject: "exam_sessions/exam_attempts/exam_responses/essay_marks",
      detail: "a legacy row changed during the backfill — this step is read-only against legacy",
    });
  }

  const rowCounts = await client.query<Record<string, string>>(
    `select
       (select count(*) from public.exam_sessions)::text as exam_sessions,
       (select count(*) from public.assessment_sessions)::text as assessment_sessions,
       (select count(*) from public.exam_attempts)::text as exam_attempts,
       (select count(*) from public.assessment_results)::text as assessment_results,
       (select count(*) from public.exam_responses)::text as exam_responses,
       (select count(*) from public.session_responses)::text as session_responses,
       (select count(*) from public.essay_marks)::text as essay_marks,
       (select count(*) from public.manual_marks)::text as manual_marks`,
  );
  for (const [table, value] of Object.entries(rowCounts.rows[0]!)) {
    counts[`rows: ${table}`] = Number(value);
  }
}

/* ------------------------------------------------------------------------ */
/* Run                                                                        */
/* ------------------------------------------------------------------------ */

let exitCode = 0;

try {
  /* Everything, including both backfill passes, inside one rolled-back
     transaction — so this is safe to point at a production database. */
  await client.query("begin");

  if (useFixture) await seedFixture();

  await checkIdempotency();
  await checkCoverage();
  await checkSessionFields();
  await checkResponses();
  await checkResults();
  await checkManualMarks();
  await checkContentIdentity();
  await checkRoleVisibility();

  const blocking = findings.filter((finding) => finding.reason === undefined);
  const explained = findings.filter((finding) => finding.reason !== undefined);

  console.log(`\n=== Phase 2 cutover reconciliation (spec §12.7 step 5) ===`);
  console.log(useFixture ? "Mode: synthetic fixture (rolled back)\n" : "Mode: live data (rolled back)\n");
  console.table(Object.entries(counts).map(([metric, value]) => ({ metric, value })));

  if (explained.length > 0) {
    console.log(`\n--- Explained differences (${explained.length}) — reported, not blocking ---`);
    console.table(
      explained.map((f) => ({ check: f.check, subject: f.subject, detail: f.detail, reason: f.reason })),
    );
  }

  if (blocking.length > 0) {
    console.error(`\n--- BLOCKING discrepancies (${blocking.length}) ---`);
    console.table(blocking.map((f) => ({ check: f.check, subject: f.subject, detail: f.detail })));
    console.error(
      `\nRECONCILIATION FAILED. Any unexplained mismatch blocks cutover (ADR-005 §5).\n`,
    );
    exitCode = 1;
  } else {
    console.log(
      `\nRECONCILIATION CLEAN. ${counts["backfilled sessions"]} backfilled sitting(s); ` +
        `${counts["backfilled: version_pinned"]} version-pinned, ` +
        `${counts["backfilled: legacy_unversioned"]} legacy_unversioned; ` +
        `backfill idempotent; legacy tables unmodified.\n`,
    );
  }
} finally {
  /* Unconditional. The gate observes; it does not change the world. */
  await client.query("rollback").catch(() => undefined);
  await client.end();
}

process.exit(exitCode);
