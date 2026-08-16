/**
 * Regression coverage for the pendingManualMarks count-vs-sum bug, surfaced
 * while building Gate A item A9 and fixed at its source in
 * `src/server/scoring/answer-access.ts`'s `summarise()`.
 *
 * The essay in this suite is deliberately worth SEVEN marks — not one — so a
 * count-based computation and a sum-based one produce different numbers.
 * Every prior test in this repo that exercised a manual item happened to give
 * it exactly one mark, which is exactly how a `.length` bug hides: count and
 * sum agree until they don't.
 *
 * Four surfaces, checked against the same sum:
 *
 *   1. The scored summary  — scoreAssessmentSession's own return value.
 *   2. The stored result   — assessment_results.pending_manual_marks.
 *   3. History              — resolved_sittings.pending_manual_marks (which
 *                              reads the stored column verbatim; this is what
 *                              proves no view-level transformation
 *                              reintroduces the bug).
 *   4. The A9 HTTP result  — already covered, not duplicated here.
 *                              tests/rls/target-http-lifecycle.test.ts's own
 *                              "submit" test seeds its essay at
 *                              `ESSAY_MARKS = 4` (not 1) and asserts
 *                              `result.pendingManualMarks === ESSAY_MARKS`
 *                              through the real submit route — the same
 *                              count-vs-sum distinction, proven through HTTP,
 *                              already green. Duplicating that suite's whole
 *                              route-mocking harness here for a fifth
 *                              assertion of the same fact was tried and
 *                              dropped: two files that each `vi.mock(
 *                              "@/lib/supabase/server", ...)` at module scope
 *                              and both import real route handlers raced
 *                              under this config's `isolate: false`, and nothing
 *                              here needs the HTTP layer to prove the fix — 1-3
 *                              below never go near a route handler.
 *
 * A fifth check compares against legacy's own ExamResult on equivalent
 * content, the contract every surface above is matching.
 *
 * Same harness contract as the other suites here: seed as the unrestricted
 * role, impersonate the way PostgREST does. This suite COMMITS rather than
 * rolling back, for the same reason target-sitting-end-to-end.test.ts does:
 * scoring opens its own connection as `mindmosaic_scoring`, which cannot see
 * uncommitted fixtures.
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { publishedExamBank } from "@/content/questions/practice-bank";
import { buildExamResult } from "@/features/exam-engine/scoring";
import type { Question } from "@/schemas/question.schema";
import { scoreAssessmentSession } from "@/server/scoring/answer-access";

import { connect, scoringDbUrl } from "./db";

const STUDENT = "77770000-0000-0000-0000-0000000000c1";
const ESSAY_MARKS = 7;
const YEAR_LEVEL = 4;
const EXAM_STYLE = "icas_style";
/* Two real published-bank ids, borrowed as item codes — see
   target-session-writes.ts's own comment on why a target sitting's review
   reveal needs a code the compiled bank actually knows (not exercised
   directly by this file, but the item_versions rows below are the same
   shape a real target sitting's are, and should resolve the same way).
   Excludes the bank's first five entries because
   target-http-lifecycle.test.ts borrows `publishedExamBank.slice(0, 3)` for
   its own fixtures — without this exclusion the two suites can pick the
   SAME item code (`g3-nap-num-data-001`, observed directly) and collide on
   `items.item_code`'s unique constraint when both run in one process
   (isolate: false). */
const RESERVED_BY_OTHER_SUITES = new Set(publishedExamBank.slice(0, 5).map((question) => question.id));
const ITEM_CODES = publishedExamBank
  .filter(
    (question) =>
      question.examStyle === "icas_style" &&
      question.metadata.subject === "numeracy" &&
      !RESERVED_BY_OTHER_SUITES.has(question.id),
  )
  .slice(0, 2)
  .map((question) => question.id);

let client: Client;
let scoringUrlBefore: string | undefined;

async function asOwner(): Promise<void> {
  await client.query("reset role");
}

async function asStudent(): Promise<void> {
  await client.query("set role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: STUDENT, role: "authenticated" }),
  ]);
}

async function resetFixtures(): Promise<void> {
  await asOwner();
  await client.query(
    `update public.platform_flags set enabled = false, cohort_mode = 'off'
      where key = 'target_session_model'`,
  );
  await client.query(`delete from public.assessment_cutover_cohort where student_id = $1`, [STUDENT]);
  await client.query(`delete from auth.users where id = $1`, [STUDENT]);
  await client.query(
    `delete from public.item_answer_versions
      where item_version_id in (
        select iv.id from public.item_versions iv
        join public.items i on i.id = iv.item_id where i.item_code = any($1::text[]))`,
    [ITEM_CODES],
  );
  await client.query(
    `delete from public.item_versions
      where item_id in (select id from public.items where item_code = any($1::text[]))`,
    [ITEM_CODES],
  );
  await client.query(`delete from public.items where item_code = any($1::text[])`, [ITEM_CODES]);
}

async function seedItem(itemCode: string, kind: "single_option" | "manual", marks: number): Promise<void> {
  const item = await client.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'original_seed', 'curated_git_authored') returning id`,
    [itemCode],
  );
  const version = await client.query<{ id: string }>(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic, source_tags, source_skill, max_words)
     values ($1, 1, $2, $3, $4::jsonb, '{"altTextProvided":true}'::jsonb,
             60, 'easy', $5, 1, $6, 'curated_git_authored', now(), $7, $8, 'numeracy',
             $9, 'number', 'addition', array['worded'], 'addition', $10)
     returning id`,
    [
      item.rows[0]!.id,
      kind === "manual" ? "essay" : "multiple_choice",
      `Consistency prompt ${itemCode}`,
      kind === "manual"
        ? JSON.stringify({ options: [] })
        : JSON.stringify({ options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] }),
      marks,
      `pmm${itemCode}`.padEnd(64, "0").replace(/[^0-9a-f]/g, "1").slice(0, 64),
      YEAR_LEVEL,
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
        ? JSON.stringify({ kind: "manual", rubric: "Award marks for showing the method.", maxWords: 300 })
        : JSON.stringify({ kind: "single_option", optionId: "b" }),
    ],
  );
}

let sessionId: string;

beforeAll(async () => {
  scoringUrlBefore = process.env.SCORING_DB_URL;
  process.env.SCORING_DB_URL = scoringDbUrl();

  client = await connect();
  await resetFixtures();

  await asOwner();
  await client.query(`insert into auth.users (id, email) values ($1, $2)`, [
    STUDENT,
    "pending-marks@test.local",
  ]);

  await seedItem(ITEM_CODES[0]!, "single_option", 1);
  await seedItem(ITEM_CODES[1]!, "manual", ESSAY_MARKS);

  await client.query(
    `update public.platform_flags set enabled = true, cohort_mode = 'student_ids' where key = 'target_session_model'`,
  );
  await client.query(`insert into public.assessment_cutover_cohort (student_id) values ($1)`, [STUDENT]);

  await asStudent();
  const created = await client.query<{ body: { sessionId: string } }>(
    `select public.create_assessment_session($1::jsonb, $2) as body`,
    [
      JSON.stringify({
        yearLevel: YEAR_LEVEL,
        examStyle: EXAM_STYLE,
        subject: "numeracy",
        questionCount: 2,
        timing: "untimed",
      }),
      "pmm-consistency-create",
    ],
  );
  sessionId = created.rows[0]!.body.sessionId;

  const served = await client.query<{ body: { items: { sessionItemId: string; answerKind: string }[] } }>(
    `select public.get_assessment_session($1::uuid) as body`,
    [sessionId],
  );
  const items = served.rows[0]!.body.items;
  const essay = items.find((item) => item.answerKind === "manual")!;
  const objective = items.find((item) => item.answerKind !== "manual")!;

  await client.query(
    `select public.commit_assessment_responses($1::uuid, $2::jsonb, 1, 0, '{}'::uuid[])`,
    [
      sessionId,
      JSON.stringify({
        [objective.sessionItemId]: "b",
        [essay.sessionItemId]: "A worked answer, awaiting a person's judgement.",
      }),
    ],
  );
}, 60_000);

afterAll(async () => {
  await resetFixtures();
  await client.end();
  if (scoringUrlBefore === undefined) delete process.env.SCORING_DB_URL;
  else process.env.SCORING_DB_URL = scoringUrlBefore;
});

describe("pendingManualMarks agrees across every surface — the sum, not the count", () => {
  it("1: the scored summary reports the essay's marks, not the count of essays", async () => {
    const summary = await scoreAssessmentSession(sessionId, STUDENT);
    expect(summary.manualReviewItems).toBe(1);
    expect(summary.pendingManualMarks).toBe(ESSAY_MARKS);
  });

  it("2: the stored assessment_results column agrees", async () => {
    await asOwner();
    const stored = await client.query<{ pending_manual_marks: number }>(
      `select pending_manual_marks from public.assessment_results where session_id = $1`,
      [sessionId],
    );
    expect(stored.rows[0]!.pending_manual_marks).toBe(ESSAY_MARKS);
  });

  it("3: resolved_sittings — every history/admin consumer's own source — agrees", async () => {
    await asOwner();
    const history = await client.query<{ pending_manual_marks: number }>(
      `select pending_manual_marks from public.resolved_sittings where session_id = $1`,
      [sessionId],
    );
    expect(history.rows[0]!.pending_manual_marks).toBe(ESSAY_MARKS);
  });

  it("5: legacy's own ExamResult reports the same sum for equivalent content", () => {
    const objective = publishedExamBank.find((question) => question.id === ITEM_CODES[0])!;
    /* A synthetic manual question, same shape a real one would have, worth
       the same ESSAY_MARKS — legacy's buildExamResult is pure and needs no
       database, which is what makes this the direct contract comparison. */
    const essay: Question = {
      ...objective,
      id: "pmm-legacy-essay",
      type: "essay",
      answerKey: { kind: "manual", rubric: "Award marks for showing the method." } as Question["answerKey"],
      metadata: { ...objective.metadata, marks: ESSAY_MARKS },
    };

    const result = buildExamResult(
      [objective, essay],
      { [objective.id]: "b", [essay.id]: "A worked answer, awaiting a person's judgement." },
      { startedAt: Date.now() - 60_000, submittedAt: Date.now(), submissionReason: "user_submitted" },
    );

    expect(result.pendingManualMarks).toBe(ESSAY_MARKS);
  });
});
