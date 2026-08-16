import type { Client } from "pg";

import { asAuthenticated } from "./fixtures";

/**
 * Fixture helpers for building a REAL target-model sitting against a real
 * database: published content, a cohort the student is in, a session created by
 * `create_assessment_session`, and the served-item ledger read back.
 *
 * Shared rather than copied because four suites need it — resume state (A1),
 * the marking write path (A2), assignment linkage (A3) and the end-to-end proof
 * (A6) — and four private copies of "how do you make a target sitting" is four
 * places for the answer to drift from what the create RPC actually does.
 *
 * Nothing here writes a target table directly except where a comment says so
 * and says why. The point of these suites is that the sanctioned write paths
 * work; a fixture that inserted around them would be testing itself.
 */

export interface SeededItem {
  readonly itemId: string;
  readonly itemVersionId: string;
  readonly itemCode: string;
}

export interface ServedItem {
  readonly sessionItemId: string;
  readonly itemCode: string;
  /** 1-based, as the ledger records it; the client's index is this minus one. */
  readonly ordinal: number;
  readonly marksAvailable: number;
}

/**
 * Retires whatever published content the database already holds, so a fixture's
 * own items are the only eligible ones.
 *
 * `create_assessment_session` allocates from the whole published bank in scope
 * (ADR-006 Amendment B1), and a developer database that has had
 * `npm run projection:apply` run against it holds well over a thousand rows. A
 * suite that needs to know WHICH items were served — because it is about a
 * manual-review item, or about the flags on a specific ordinal — would otherwise
 * pass or fail depending on whether the machine happened to have projected
 * content. Retiring rather than deleting, because `items` is referenced from
 * several directions and the selection predicate already reads `retired_at`;
 * every caller runs in a transaction that rolls back.
 */
export async function isolatePublishedBank(client: Client): Promise<void> {
  await client.query("reset role");
  await client.query(`update public.items set retired_at = now() where retired_at is null`);
}

/** A 64-hex content hash derived from a label, so a fixture is reproducible. */
function contentHash(label: string): string {
  const base = [...label]
    .map((character) => character.codePointAt(0)!.toString(16).padStart(2, "0"))
    .join("");
  return (base + "0".repeat(64)).slice(0, 64);
}

/**
 * One published, scoreable item in the year-5 / naplan_style / numeracy scope
 * the fixtures below request.
 *
 * `kind: "manual"` produces an item the scorer will report as `manual_review` —
 * which is what the marking suites need, and which cannot be faked by writing a
 * status onto a response row: §14.3's three-way blank/attempted/manual is
 * derived from the pinned answer key, so the key has to be real.
 */
export async function seedPublishedItem(
  client: Client,
  label: string,
  kind: "single_option" | "manual" = "single_option",
  marks = 1,
): Promise<SeededItem> {
  const itemCode = `tgt-${label}`;
  const item = await client.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'original_seed', 'curated_git_authored') returning id`,
    [itemCode],
  );
  const itemId = item.rows[0]!.id;

  const version = await client.query<{ id: string }>(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic, source_tags, source_skill,
        min_words, max_words)
     values ($1, 1, $2, $3, $4::jsonb, '{"altTextProvided":true}'::jsonb,
             60, 'easy', $5, 1, $6, 'curated_git_authored', now(), 5, 'naplan_style', 'numeracy',
             $7, 'number', 'addition', array['worded'], 'addition', $8, $9)
     returning id`,
    [
      itemId,
      kind === "manual" ? "essay" : "multiple_choice",
      `Prompt ${label}`,
      kind === "manual"
        ? JSON.stringify({ options: [] })
        : JSON.stringify({ options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] }),
      marks,
      contentHash(label),
      kind,
      kind === "manual" ? 20 : null,
      kind === "manual" ? 300 : null,
    ],
  );
  const itemVersionId = version.rows[0]!.id;

  await client.query(
    `insert into public.item_answer_versions (item_version_id, answer_key) values ($1, $2::jsonb)`,
    [
      itemVersionId,
      kind === "manual"
        ? JSON.stringify({
            kind: "manual",
            rubric: "Award marks for a clear explanation of the method used.",
            maxWords: 300,
          })
        : JSON.stringify({ kind: "single_option", optionId: "b" }),
    ],
  );

  return { itemId, itemVersionId, itemCode };
}

export const TARGET_CONFIG = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 2,
  timing: "untimed",
} as const;

/**
 * Opens the cutover cohort for the duration of a test transaction.
 *
 * `cohort_mode = 'student_ids'` with one named student rather than `'all'`,
 * because that is the shape a real first cohort takes and because it exercises
 * the membership predicate rather than bypassing it. Every caller runs inside a
 * transaction that rolls back, so the shipped `enabled = false` posture is never
 * actually changed in any database (ADR-006 Amendment C5).
 */
export async function openTestCohort(client: Client, studentId: string): Promise<void> {
  await client.query("reset role");
  await client.query(
    `update public.platform_flags set enabled = true, cohort_mode = 'student_ids'
      where key = 'target_session_model'`,
  );
  await client.query(
    `insert into public.assessment_cutover_cohort (student_id) values ($1)
     on conflict do nothing`,
    [studentId],
  );
}

/** Creates a target sitting through the sanctioned RPC, as the student. */
export async function createTargetSession(
  client: Client,
  studentId: string,
  idempotencyKey: string,
  config: Record<string, unknown> = TARGET_CONFIG,
): Promise<string> {
  await asAuthenticated(client, studentId);
  const created = await client.query<{ body: { sessionId: string } }>(
    `select public.create_assessment_session($1::jsonb, $2) as body`,
    [JSON.stringify(config), idempotencyKey],
  );
  return created.rows[0]!.body.sessionId;
}

/**
 * The served-item ledger for a sitting, in served order.
 *
 * Read as the unrestricted role on purpose: `assessment_session_items` is not
 * learner-readable and must not become so (§17.1), so a test that could read it
 * as the learner would be proving the wrong thing.
 */
export async function servedItems(client: Client, sessionId: string): Promise<ServedItem[]> {
  await client.query("reset role");
  const result = await client.query<{
    session_item_id: string;
    item_code: string;
    ordinal: number;
    marks_available: number;
  }>(
    `select si.id as session_item_id, i.item_code, si.global_ordinal as ordinal,
            iv.marks_available
       from public.assessment_session_items si
       join public.items i on i.id = si.item_id
       join public.item_versions iv on iv.id = si.item_version_id
      where si.session_id = $1
      order by si.global_ordinal`,
    [sessionId],
  );
  return result.rows.map((row) => ({
    sessionItemId: row.session_item_id,
    itemCode: row.item_code,
    ordinal: row.ordinal,
    marksAvailable: row.marks_available,
  }));
}

/**
 * Scores and submits a sitting the way the scoring module does.
 *
 * The real module connects as `mindmosaic_scoring` from TypeScript and is
 * proved in `tests/rls/assessment-scoring.test.ts`; reproducing its outcome here
 * as the owner keeps these suites about the write paths they are testing rather
 * than about scoring, and keeps them runnable without the scoring credential.
 * What it must not do is invent the manual/objective split — that comes from the
 * pinned answer kind, read back below, exactly as the scorer derives it.
 */
export async function scoreAndSubmit(client: Client, sessionId: string): Promise<void> {
  await client.query("reset role");

  await client.query(
    `update public.session_responses sr
        set score_status = case
              when iv.answer_kind = 'manual' then 'manual_review'
              when sr.response_value is null then 'unanswered'
              when sr.response_value #>> '{}' = 'b' then 'correct'
              else 'incorrect'
            end,
            /* §14.3: a manual item is stored WITHOUT fabricated correctness. */
            is_correct = case
              when iv.answer_kind = 'manual' then null
              when sr.response_value is null then false
              else sr.response_value #>> '{}' = 'b'
            end,
            awarded_marks = case
              when iv.answer_kind = 'manual' then null
              when sr.response_value #>> '{}' = 'b' then iv.marks_available
              else 0
            end,
            available_marks = iv.marks_available,
            scored_at = now()
       from public.assessment_session_items si
       join public.item_versions iv on iv.id = si.item_version_id
      where si.id = sr.session_item_id and sr.session_id = $1`,
    [sessionId],
  );

  const totals = await client.query<{
    total_items: number;
    attempted_items: number;
    auto_marked_items: number;
    manual_review_items: number;
    correct_count: number;
    incorrect_count: number;
    unanswered_count: number;
    awarded: number;
    available: number;
    pending_marks: number;
    student_id: string;
  }>(
    `select
       count(*)::int                                                          as total_items,
       count(*) filter (where r.response_value is not null)::int              as attempted_items,
       count(*) filter (where iv.answer_kind <> 'manual')::int                as auto_marked_items,
       count(*) filter (where iv.answer_kind = 'manual')::int                 as manual_review_items,
       count(*) filter (where r.score_status = 'correct')::int                as correct_count,
       count(*) filter (where r.score_status = 'incorrect')::int              as incorrect_count,
       count(*) filter (where r.score_status is null
                           or r.score_status = 'unanswered')::int             as unanswered_count,
       coalesce(sum(r.awarded_marks), 0)::int                                 as awarded,
       coalesce(sum(iv.marks_available)
                  filter (where iv.answer_kind <> 'manual'), 0)::int          as available,
       /* The SUM of marks on attempted-but-unmarked manual items, matching
          legacy ExamResult's pendingManualMarks (exam-report.ts) and the fixed
          answer-access.ts summarise() — not a count of manual items. An
          unanswered manual item has no session_responses row at all (the real
          scoring module leaves none, and scoreAndSubmit above mirrors that),
          so the left join already excludes it here without a separate case. */
       coalesce(sum(iv.marks_available)
                  filter (where r.score_status = 'manual_review'), 0)::int    as pending_marks,
       max(s.student_id::text)::uuid                                          as student_id
     from public.assessment_session_items si
     join public.item_versions iv on iv.id = si.item_version_id
     join public.assessment_sessions s on s.id = si.session_id
left join public.session_responses r on r.session_item_id = si.id
    where si.session_id = $1`,
    [sessionId],
  );
  const t = totals.rows[0]!;

  await client.query(
    `insert into public.assessment_results
       (session_id, student_id, scoring_algorithm_version, total_items, attempted_items,
        auto_marked_items, manual_review_items, correct_count, incorrect_count,
        unanswered_count, objective_awarded_marks, objective_available_marks,
        objective_percentage, pending_manual_marks, time_taken_seconds,
        started_at, submitted_at, submission_reason)
     values ($1, $2, 'question-scorers.v1', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 600,
             now() - interval '10 minutes', now(), 'user_submitted')`,
    [
      sessionId,
      t.student_id,
      t.total_items,
      t.attempted_items,
      t.auto_marked_items,
      t.manual_review_items,
      t.correct_count,
      t.incorrect_count,
      t.unanswered_count,
      t.awarded,
      t.available,
      t.available === 0 ? 0 : Math.round((t.awarded / t.available) * 100),
      t.pending_marks,
    ],
  );

  await client.query(
    `update public.assessment_sessions
        set status = 'submitted', submitted_at = now(), version = version + 1
      where id = $1`,
    [sessionId],
  );
}

/** Puts a teacher in a class with the given students, so is_teacher_of_student holds. */
export async function teachClass(
  client: Client,
  teacherId: string,
  studentIds: readonly string[],
): Promise<string> {
  await client.query("reset role");
  const klass = await client.query<{ id: string }>(
    `insert into public.classes (teacher_id, name) values ($1, 'Class 5A') returning id`,
    [teacherId],
  );
  const classId = klass.rows[0]!.id;
  for (const studentId of studentIds) {
    await client.query(
      `insert into public.class_students (class_id, student_id) values ($1, $2)`,
      [classId, studentId],
    );
  }
  return classId;
}
