/**
 * Gate A item A6: one target sitting, all the way through, in one test.
 *
 * Every step of the target model has been proven on its own — create and serve
 * (2b), responses (2b), scoring (2b), read dispatch (7), the resolution rule
 * (8), and now resume state (A1), the marking write (A2) and assignment linkage
 * (A3). What none of those shows is that they COMPOSE: that the session one RPC
 * creates is the session the next one serves, that the ledger the scorer reads
 * is the ledger the marking queue lists from, and that the sitting a learner
 * sees once in their history is the same sitting the admin totals count once.
 *
 * So this walks a single sitting from nothing to a marked, attributed,
 * historically visible result:
 *
 *     create (test cohort) → serve → respond → leave → resume → respond again
 *       → submit → score → history and admin totals agree, once
 *       → a manual item marked → attributed to an assignment
 *
 * WHY THIS SUITE COMMITS, like `assessment-scoring.test.ts` and unlike every
 * other file here. Step "score" is the real scoring module, which opens its OWN
 * connection as `mindmosaic_scoring` — that is the whole point of it, and a
 * second connection cannot see uncommitted fixtures. An end-to-end proof that
 * substituted a hand-written UPDATE for the scorer would be proving the fixture.
 *
 * WHAT THAT COSTS AND HOW IT IS PAID. Committed fixtures must be cleaned up, and
 * one of them is the cutover flag — which ships off, and whose staying off is a
 * Gate A invariant. So `resetFixtures` runs before the suite as well as after,
 * it restores the flag to `enabled = false, cohort_mode = 'off'` and empties the
 * cohort table, and the last test in the file asserts that the flag really is
 * back off. Every other identifier is namespaced to this file.
 *
 * THE CONTENT SCOPE IS DELIBERATELY UNIQUE. `create_assessment_session`
 * allocates from the whole published bank in scope, so a developer database
 * with projected content would otherwise serve real items instead of this
 * file's. The transactional suites solve that by retiring everything and rolling
 * back; this one cannot roll back, so it scopes on an exam style no real content
 * carries rather than touching the shared bank at all.
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { scoreAssessmentSession } from "@/server/scoring/answer-access";

import { connect, scoringDbUrl } from "./db";

const STUDENT = "77777777-0000-0000-0000-0000000000e6";
const TEACHER = "77777777-0000-0000-0000-0000000000e7";
const ADMIN = "77777777-0000-0000-0000-0000000000e8";
const ITEM_PREFIX = "e2e-suite-";
/** No projected item carries this, so the allocation can only pick this file's. */
const EXAM_STYLE = "e2e_suite_style";
const ESSAY_MARKS = 6;

const CONFIG = {
  yearLevel: 5,
  examStyle: EXAM_STYLE,
  subject: "numeracy",
  questionCount: 3,
  timing: "untimed",
};

let client: Client;
let sessionId: string;
let assignmentId: string;
let served: { sessionItemId: string; itemCode: string; marks: number }[] = [];
let scoringUrlBefore: string | undefined;

async function asOwner(): Promise<void> {
  await client.query("reset role");
}

async function asUser(sub: string): Promise<void> {
  await client.query("set role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub, role: "authenticated" }),
  ]);
}

async function resetFixtures(target: Client): Promise<void> {
  await target.query("reset role");
  /* The flag first, and unconditionally: it is the one piece of shared state
     this suite touches, and leaving it enabled would route real students to the
     target model on a machine where nothing else did. */
  await target.query(
    `update public.platform_flags set enabled = false, cohort_mode = 'off'
      where key = 'target_session_model'`,
  );
  await target.query(`delete from public.assessment_cutover_cohort where student_id = $1`, [
    STUDENT,
  ]);
  /* auth.users cascades through profiles to sessions, results, marks and
     assignment rows; the content it pinned is ON DELETE RESTRICT and therefore
     goes afterwards. */
  await target.query(`delete from auth.users where id = any($1::uuid[])`, [
    [STUDENT, TEACHER, ADMIN],
  ]);
  await target.query(
    `delete from public.item_answer_versions
      where item_version_id in (
        select iv.id from public.item_versions iv
        join public.items i on i.id = iv.item_id where i.item_code like $1)`,
    [`${ITEM_PREFIX}%`],
  );
  await target.query(
    `delete from public.item_versions
      where item_id in (select id from public.items where item_code like $1)`,
    [`${ITEM_PREFIX}%`],
  );
  await target.query(`delete from public.items where item_code like $1`, [`${ITEM_PREFIX}%`]);
}

async function seedItem(label: string, kind: "single_option" | "manual", marks: number) {
  const item = await client.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'original_seed', 'curated_git_authored') returning id`,
    [`${ITEM_PREFIX}${label}`],
  );
  const version = await client.query<{ id: string }>(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic, source_tags, source_skill, max_words)
     values ($1, 1, $2, $3, $4::jsonb, '{"altTextProvided":true}'::jsonb,
             60, 'easy', $5, 1, $6, 'curated_git_authored', now(), 5, $7, 'numeracy',
             $8, 'number', 'addition', array['worded'], 'addition', $9)
     returning id`,
    [
      item.rows[0]!.id,
      kind === "manual" ? "essay" : "multiple_choice",
      `E2E prompt ${label}`,
      kind === "manual"
        ? JSON.stringify({ options: [] })
        : JSON.stringify({ options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] }),
      marks,
      `e2e${label}`.padEnd(64, "0").replace(/[^0-9a-f]/g, "1").slice(0, 64),
      EXAM_STYLE,
      kind,
      kind === "manual" ? 300 : null,
    ],
  );
  await client.query(
    `insert into public.item_answer_versions (item_version_id, answer_key) values ($1, $2::jsonb)`,
    [
      version.rows[0]!.id,
      kind === "manual"
        ? JSON.stringify({
            kind: "manual",
            rubric: "Award marks for a clear explanation of the method used.",
            maxWords: 300,
          })
        : JSON.stringify({ kind: "single_option", optionId: "b" }),
    ],
  );
}

beforeAll(async () => {
  /* The scoring module reads its credential from the environment at call time.
     Set here rather than relied on from the shell because `isolate: false`
     (vitest.rls.config.ts) puts every suite in ONE process, and
     `assessment-scoring.test.ts` deletes this variable in its own teardown —
     which, run before this file, would otherwise make step 6 fail with "not
     set" on a machine where it plainly was. Restored to whatever it was. */
  scoringUrlBefore = process.env.SCORING_DB_URL;
  process.env.SCORING_DB_URL = scoringDbUrl();

  client = await connect();
  await resetFixtures(client);

  await asOwner();
  await client.query(
    `insert into auth.users (id, email) values ($1, $2), ($3, $4), ($5, $6)`,
    [
      STUDENT,
      "e2e-student@test.local",
      TEACHER,
      "e2e-teacher@test.local",
      ADMIN,
      "e2e-admin@test.local",
    ],
  );
  await client.query(`update public.profiles set role = 'teacher' where id = $1`, [TEACHER]);
  await client.query(`update public.profiles set role = 'admin' where id = $1`, [ADMIN]);

  const klass = await client.query<{ id: string }>(
    `insert into public.classes (teacher_id, name) values ($1, 'E2E class') returning id`,
    [TEACHER],
  );
  await client.query(
    `insert into public.class_students (class_id, student_id) values ($1, $2)`,
    [klass.rows[0]!.id, STUDENT],
  );

  const assignment = await client.query<{ id: string }>(
    `insert into public.assignments (class_id, created_by, config)
     values ($1, $2, $3::jsonb) returning id`,
    [klass.rows[0]!.id, TEACHER, JSON.stringify({ ...CONFIG, bankId: "curated", title: "E2E" })],
  );
  assignmentId = assignment.rows[0]!.id;
  await client.query(
    `insert into public.assignment_students (assignment_id, student_id) values ($1, $2)`,
    [assignmentId, STUDENT],
  );

  await seedItem("obj1", "single_option", 1);
  await seedItem("obj2", "single_option", 1);
  await seedItem("essay", "manual", ESSAY_MARKS);

  /* The test cohort: named students, one of them, exactly the shape a real first
     cohort takes. Restored to off by resetFixtures. */
  await client.query(
    `update public.platform_flags set enabled = true, cohort_mode = 'student_ids'
      where key = 'target_session_model'`,
  );
  await client.query(`insert into public.assessment_cutover_cohort (student_id) values ($1)`, [
    STUDENT,
  ]);
}, 60_000);

afterAll(async () => {
  await resetFixtures(client);
  await client.end();
  if (scoringUrlBefore === undefined) delete process.env.SCORING_DB_URL;
  else process.env.SCORING_DB_URL = scoringUrlBefore;
});

describe("A6 — one target sitting, end to end", () => {
  it("1. creates on the target model, because the cohort says so", async () => {
    await asUser(STUDENT);
    const created = await client.query<{ body: { sessionId: string; itemCount: number } }>(
      `select public.create_assessment_session($1::jsonb, $2) as body`,
      [JSON.stringify(CONFIG), "e2e-create"],
    );
    sessionId = created.rows[0]!.body.sessionId;
    expect(sessionId).toBeTruthy();

    await asOwner();
    const row = await client.query<{ storage_model: string; legacy_session_id: string | null }>(
      `select storage_model, legacy_session_id from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    /* Native to the target model, and provably not a backfill copy — which is
       what makes every "read from the model that created it" step below resolve
       here rather than to a legacy row. */
    expect(row.rows[0]!.storage_model).toBe("version_pinned");
    expect(row.rows[0]!.legacy_session_id).toBeNull();
  });

  it("2. serves the sitter a paper, and no answer key with it", async () => {
    await asUser(STUDENT);
    const result = await client.query<{ body: Record<string, unknown> }>(
      `select public.get_assessment_session($1::uuid) as body`,
      [sessionId],
    );
    const body = result.rows[0]!.body;
    const items = body.items as Record<string, unknown>[];

    expect(items).toHaveLength(3);
    /* Every field the renderer dispatches on is present (ADR-006 Amendment D),
       and nothing that would tell the candidate the answer is. */
    for (const item of items) {
      expect(item.answerKind).toBeTruthy();
      expect(item.sourceStrand).toBeTruthy();
    }
    const serialised = JSON.stringify(body);
    expect(serialised).not.toMatch(/answerKey|optionId|rubric|Award marks for a clear/);

    served = items.map((item) => ({
      sessionItemId: String(item.sessionItemId),
      itemCode: String(item.itemCode),
      marks: Number(item.marksAvailable),
    }));
  });

  it("3. records answers and the UI state around them", async () => {
    const first = served[0]!;
    await asUser(STUDENT);
    const applied = await client.query<{ body: Record<string, unknown> }>(
      `select public.commit_assessment_responses($1::uuid, $2::jsonb, 1, 1, $3::uuid[]) as body`,
      [sessionId, JSON.stringify({ [first.sessionItemId]: "b" }), [served[2]!.sessionItemId]],
    );
    expect(applied.rows[0]!.body.applied).toBe(1);
    expect(applied.rows[0]!.body.uiStateApplied).toBe(true);
  });

  it("4. resumes mid-way to the same question and the same flags (A1)", async () => {
    /* The learner leaves and comes back. Before A1 this returned question one
       with nothing flagged, however far through the paper they actually were. */
    await asUser(STUDENT);
    const result = await client.query<{ body: Record<string, unknown> }>(
      `select public.get_assessment_session($1::uuid) as body`,
      [sessionId],
    );
    const body = result.rows[0]!.body;

    expect(body.currentQuestionIndex).toBe(1);
    expect(body.flaggedSessionItemIds).toEqual([served[2]!.sessionItemId]);
    expect(Object.keys(body.responses as Record<string, unknown>)).toEqual([
      served[0]!.sessionItemId,
    ]);
    expect(body.status).toBe("active");
  });

  it("5. finishes the paper, one answer per served item", async () => {
    const essay = served.find((item) => item.marks === ESSAY_MARKS)!;
    const objectives = served.filter((item) => item.marks !== ESSAY_MARKS);

    await asUser(STUDENT);
    await client.query(
      `select public.commit_assessment_responses($1::uuid, $2::jsonb, 2, 2, '{}'::uuid[])`,
      [
        sessionId,
        JSON.stringify({
          [objectives[0]!.sessionItemId]: "b",
          /* One right, one wrong, so the percentage below is a real computation
             rather than a constant. */
          [objectives[1]!.sessionItemId]: "a",
          [essay.sessionItemId]: "I added the tens first, then the units.",
        }),
      ],
    );

    await asOwner();
    const stored = await client.query<{ n: string }>(
      `select count(*)::text as n from public.session_responses where session_id = $1`,
      [sessionId],
    );
    expect(stored.rows[0]!.n).toBe("3");
  });

  it("6. submits and scores through the real scoring module", async () => {
    /* The module opens its own connection as `mindmosaic_scoring`. Everything
       above was written by the learner's own RPCs; this is the first and only
       step that reads an answer key, and it is the only credential that can. */
    const summary = await scoreAssessmentSession(sessionId, STUDENT);

    expect(summary.totalItems).toBe(3);
    expect(summary.correctCount).toBe(1);
    expect(summary.incorrectCount).toBe(1);
    expect(summary.manualReviewItems).toBe(1);
    /* §14.3: the essay is excluded from the objective denominator until marked,
       so this is 1 of 2 objective marks, not 1 of 8. */
    expect(summary.objectiveAvailableMarks).toBe(2);
    expect(summary.objectivePercentage).toBe(50);
    expect(summary.pendingManualMarks).toBe(1);

    await asOwner();
    const session = await client.query<{ status: string }>(
      `select status from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    expect(session.rows[0]!.status).toBe("submitted");
  });

  it("7. appears exactly once in the learner's history and in the admin totals", async () => {
    await asUser(STUDENT);
    const history = await client.query<{ session_id: string; objective_percentage: number }>(
      `select session_id, objective_percentage from public.visible_sittings
        where student_id = $1 and submitted_at is not null`,
      [STUDENT],
    );
    expect(history.rows).toHaveLength(1);
    expect(history.rows[0]!.session_id).toBe(sessionId);
    expect(history.rows[0]!.objective_percentage).toBe(50);

    /* The consistency claim step 8 closed, re-asserted on a sitting that has
       been through every write path: one product, one notion of a sitting. A
       presence-probe resolution rule would count this twice the first time the
       backfill ran. */
    await asOwner();
    const resolved = await client.query<{ n: string }>(
      `select count(*)::text as n from public.resolved_sittings where student_id = $1`,
      [STUDENT],
    );
    expect(resolved.rows[0]!.n).toBe("1");

    await asUser(ADMIN);
    const totals = await client.query<{ total_attempts: string }>(
      `select total_attempts::text from public.admin_platform_totals`,
    );
    /* The admin figure counts every student's sittings, so the assertion is a
       delta rather than an absolute: this sitting is one of them, once. */
    await asOwner();
    const everything = await client.query<{ n: string }>(
      `select count(*)::text as n from public.resolved_sittings where submitted_at is not null`,
    );
    expect(totals.rows[0]!.total_attempts).toBe(everything.rows[0]!.n);
  });

  it("8. puts the essay in the teacher's queue, and a mark clears it (A2)", async () => {
    const essay = served.find((item) => item.marks === ESSAY_MARKS)!;

    await asUser(TEACHER);
    const pending = await client.query<{ question_key: string; session_item_id: string }>(
      `select question_key, session_item_id from public.visible_sitting_questions
        where session_id = $1 and pending_manual`,
      [sessionId],
    );
    /* Before A2 the queue was filtered to legacy origin, so this row did not
       exist — a target essay was invisible rather than unclearable. */
    expect(pending.rows).toHaveLength(1);
    expect(pending.rows[0]!.session_item_id).toBe(essay.sessionItemId);

    /* And the marker can read the work, without the answer table being opened. */
    const view = await client.query<{ body: Record<string, unknown> }>(
      `select public.get_manual_review_response($1::uuid, $2::uuid) as body`,
      [sessionId, essay.sessionItemId],
    );
    expect(view.rows[0]!.body.responseValue).toBe("I added the tens first, then the units.");
    expect(JSON.stringify(view.rows[0]!.body)).not.toMatch(/Award marks for a clear/);

    const marked = await client.query<{ body: Record<string, unknown> }>(
      `select public.record_manual_mark($1::uuid, $2::uuid, 5::numeric, 'Clear method.') as body`,
      [sessionId, essay.sessionItemId],
    );
    expect(Number(marked.rows[0]!.body.maxMarks)).toBe(ESSAY_MARKS);

    const stillPending = await client.query<{ n: string }>(
      `select count(*)::text as n
         from public.visible_sitting_questions q
         left join public.visible_manual_marks m
           on m.session_id = q.session_id and m.question_key = q.question_key
        where q.session_id = $1 and q.pending_manual and m.question_key is null`,
      [sessionId],
    );
    expect(stillPending.rows[0]!.n).toBe("0");
  });

  it("9. is attributed to the assignment, once (A3)", async () => {
    await asUser(STUDENT);
    await client.query(
      `select public.link_assessment_session_to_assignment($1::uuid, $2::uuid)`,
      [assignmentId, sessionId],
    );

    const attributed = await client.query<{ percentage: number; sittings: string }>(
      `select max(vs.objective_percentage) as percentage, count(vs.session_id)::text as sittings
         from public.assignment_students ast
         left join public.visible_sittings vs
           on (ast.attempt_id is not null and vs.attempt_id = ast.attempt_id)
           or (ast.session_id is not null and vs.session_id = ast.session_id)
        where ast.student_id = $1 and ast.assignment_id = $2`,
      [STUDENT, assignmentId],
    );
    expect(attributed.rows[0]!.percentage).toBe(50);
    expect(Number(attributed.rows[0]!.sittings)).toBe(1);
  });

  it("10. the sitting never acquired a second identity along the way", async () => {
    /* The invariant ADR-005 §1 exists to protect, checked at the END rather than
       at creation: nine steps of writes later, this sitting still has exactly
       one row in one model, and the legacy tables know nothing about it. */
    await asOwner();
    const counts = await client.query<Record<string, string>>(
      `select
         (select count(*)::text from public.assessment_sessions where student_id = $1) as target_sessions,
         (select count(*)::text from public.exam_sessions where student_id = $1)       as legacy_sessions,
         (select count(*)::text from public.exam_attempts where student_id = $1)       as legacy_attempts,
         (select count(*)::text from public.exam_responses where student_id = $1)      as legacy_responses,
         (select count(*)::text from public.assessment_results where session_id = $2)  as results,
         (select count(*)::text from public.manual_marks where session_id = $2)        as marks`,
      [STUDENT, sessionId],
    );
    expect(counts.rows[0]).toEqual({
      target_sessions: "1",
      legacy_sessions: "0",
      legacy_attempts: "0",
      legacy_responses: "0",
      results: "1",
      marks: "1",
    });
  });

  it("11. leaves the cutover cohort empty and the flag off", async () => {
    /* The Gate A invariant this suite temporarily suspends, put back. Asserted
       rather than assumed, because a committing test that enabled the cohort and
       did not restore it would arm the cutover on whatever database it ran on. */
    await resetFixtures(client);

    await asOwner();
    const flag = await client.query<{ enabled: boolean; cohort_mode: string; members: string }>(
      `select f.enabled, f.cohort_mode,
              (select count(*)::text from public.assessment_cutover_cohort) as members
         from public.platform_flags f where f.key = 'target_session_model'`,
    );
    expect(flag.rows[0]).toEqual({ enabled: false, cohort_mode: "off", members: "0" });
  });
});
