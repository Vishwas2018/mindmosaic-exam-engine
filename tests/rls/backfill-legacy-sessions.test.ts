/**
 * The terminal backfill and the content-identity classifier
 * (supabase/migrations/20260812140000_backfill_legacy_sessions.sql; spec §12.7
 * steps 3–4, §5.3, §14.3; ADR-005 §3–§4).
 *
 * Three things here are worth more than the rest:
 *
 *   * **The classifier's bound branch is exercised.** ADR-005 §4 predicts that
 *     no legacy row carries the evidence needed to pin content, and it is right
 *     — so a test that only asserted "everything is legacy_unversioned" would
 *     pass identically against a classifier hardcoded to return nothing. One
 *     fixture below carries `config.contentHashes` matching real projected
 *     item_versions, and asserts it binds and produces a ledger. That is the
 *     difference between "the evidence is absent" and "the code cannot see it".
 *
 *   * **Active sessions are proved untouched**, not assumed. A session with no
 *     attempt and an expiry in the future is the one thing this phase must not
 *     copy (ADR-005 §1).
 *
 *   * **The legacy tables are proved unmodified**, by hashing their contents
 *     before and after. "Read-only against legacy" is the hard invariant of the
 *     whole step, and it is checkable rather than merely intended.
 *
 * Harness contract as elsewhere: seed as the unrestricted role, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, seed, STUDENT_A, STUDENT_B } from "./fixtures";

let client: Client;

/** Legacy sessions this file creates, by role in the story. */
const SUBMITTED = "66666666-0000-0000-0000-00000000000a";
const EXPIRED_NO_ATTEMPT = "66666666-0000-0000-0000-00000000000b";
const STILL_ACTIVE = "66666666-0000-0000-0000-00000000000c";
const PINNABLE = "66666666-0000-0000-0000-00000000000d";
const MALFORMED_RESULT = "66666666-0000-0000-0000-00000000000e";

interface BackfillSummary {
  sessionsInserted: number;
  ledgerRowsInserted: number;
  responsesInserted: number;
  resultsInserted: number;
  manualMarksInserted: number;
  sessionsSubmitted: number;
  sessionsAbandoned: number;
  backfilledVersionPinned: number;
  backfilledLegacyUnversioned: number;
  resultsSkippedUnmappable: number;
}

/** A well-formed legacy ExamResult, the shape buildExamResult actually emits. */
function legacyResult(
  details: { questionId: string; status: string; awarded: number; available: number }[],
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const objectiveEarned = details
    .filter((d) => d.status !== "manual_review")
    .reduce((t, d) => t + d.awarded, 0);
  const objectiveAvailable = details
    .filter((d) => d.status !== "manual_review")
    .reduce((t, d) => t + d.available, 0);
  return {
    totalQuestions: details.length,
    attemptedQuestions: details.filter((d) => d.status !== "unanswered").length,
    autoMarkedQuestions: details.filter((d) => d.status !== "manual_review").length,
    manualReviewQuestions: details.filter((d) => d.status === "manual_review").length,
    correctCount: details.filter((d) => d.status === "correct").length,
    incorrectCount: details.filter((d) => d.status === "incorrect").length,
    unansweredCount: details.filter((d) => d.status === "unanswered").length,
    objectiveMarksEarned: objectiveEarned,
    objectiveMarksAvailable: objectiveAvailable,
    objectivePercentage:
      objectiveAvailable === 0 ? 0 : Math.round((objectiveEarned / objectiveAvailable) * 100),
    /* The sum of marks on pending items, not their count — matches what
       buildExamResult (exam-report.ts) and the fixed answer-access.ts
       actually compute; this fixture's own docstring claims that shape. */
    pendingManualMarks: details
      .filter((d) => d.status === "manual_review")
      .reduce((sum, d) => sum + d.available, 0),
    timeTakenSeconds: 600,
    submissionReason: "user_submitted",
    startedAt: Date.parse("2026-08-01T09:00:00.000Z"),
    submittedAt: Date.parse("2026-08-01T09:10:00.000Z"),
    questionDetails: details.map((d) => ({
      questionId: d.questionId,
      status: d.status,
      attempted: d.status !== "unanswered",
      requiresManualMarking: d.status === "manual_review",
      pendingManualReview: d.status === "manual_review",
      /* The legacy blob coalesces a manual item's null marks to 0 — the exact
         fabrication §14.3 forbids, and the one difference the target model
         deliberately corrects to NULL. */
      awardedMarks: d.awarded,
      availableMarks: d.available,
    })),
    breakdowns: {},
    ...overrides,
  };
}

async function insertLegacySession(
  target: Client,
  id: string,
  studentId: string,
  questionIds: string[],
  options: { expiresIn?: string; config?: Record<string, unknown> } = {},
): Promise<void> {
  const { expiresIn = "-1 hour", config = {} } = options;
  await target.query(
    `insert into public.exam_sessions
       (id, student_id, config, seed, selected_question_ids, created_at, expires_at)
     values ($1, $2, $3::jsonb, 'legacy-seed', $4,
             now() - interval '2 hours', now() + $5::interval)`,
    [id, studentId, JSON.stringify(config), questionIds, expiresIn],
  );
}

async function insertLegacyAttempt(
  target: Client,
  sessionId: string,
  studentId: string,
  responses: Record<string, unknown>,
  result: Record<string, unknown>,
): Promise<string> {
  const row = await target.query<{ id: string }>(
    `insert into public.exam_attempts (session_id, student_id, responses, result, submitted_at)
     values ($1, $2, $3::jsonb, $4::jsonb, now() - interval '1 hour') returning id`,
    [sessionId, studentId, JSON.stringify(responses), JSON.stringify(result)],
  );
  return row.rows[0]!.id;
}

/** Projects one item so the classifier has something real to bind against. */
async function seedProjectedItem(
  target: Client,
  itemCode: string,
  hash: string,
): Promise<void> {
  const item = await target.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'test_seed', 'curated_git_authored') returning id`,
    [itemCode],
  );
  await target.query(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic)
     values ($1, 1, 'multiple_choice', $2, '{"options":[]}'::jsonb,
             '{"altTextProvided":true}'::jsonb, 60, 'easy', 1, 1, $3,
             'curated_git_authored', now(), 5, 'naplan_style', 'numeracy',
             'single_option', 'number', 'addition')`,
    [item.rows[0]!.id, `Prompt ${itemCode}`, hash],
  );
}

async function runBackfill(target: Client): Promise<BackfillSummary> {
  const result = await target.query<{ summary: BackfillSummary }>(
    `select public.backfill_legacy_terminal_sessions() as summary`,
  );
  return result.rows[0]!.summary;
}

/** A fingerprint of every legacy row, so "read-only" can be proved not asserted. */
async function legacyFingerprint(target: Client): Promise<string> {
  const result = await target.query<{ digest: string }>(
    `select md5(
              coalesce((select string_agg(t::text, '|' order by t::text) from public.exam_sessions t), '') ||
              coalesce((select string_agg(t::text, '|' order by t::text) from public.exam_attempts t), '') ||
              coalesce((select string_agg(t::text, '|' order by t::text) from public.exam_responses t), '') ||
              coalesce((select string_agg(t::text, '|' order by t::text) from public.essay_marks t), '')
            ) as digest`,
  );
  return result.rows[0]!.digest;
}

const PINNED_HASH_A = "c".repeat(64);
const PINNED_HASH_B = "d".repeat(64);

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);

  /* The shared fixture already creates two attempts whose result is `{}` — a
     blob that cannot be mapped. Kept rather than worked around: it is a free,
     realistic instance of the skip path. */

  await insertLegacySession(client, SUBMITTED, STUDENT_A, ["q-alpha", "q-beta", "q-gamma"]);
  await insertLegacyAttempt(
    client,
    SUBMITTED,
    STUDENT_A,
    { "q-alpha": "b", "q-gamma": "an essay answer" },
    legacyResult([
      { questionId: "q-alpha", status: "correct", awarded: 1, available: 1 },
      { questionId: "q-beta", status: "unanswered", awarded: 0, available: 1 },
      { questionId: "q-gamma", status: "manual_review", awarded: 0, available: 5 },
    ]),
  );

  await insertLegacySession(client, EXPIRED_NO_ATTEMPT, STUDENT_B, ["q-alpha", "q-beta"]);
  await client.query(
    `insert into public.exam_responses
       (session_id, student_id, responses, current_question_index, flagged_question_ids)
     values ($1, $2, '{"q-alpha":"c"}'::jsonb, 1, array[]::text[])`,
    [EXPIRED_NO_ATTEMPT, STUDENT_B],
  );

  await insertLegacySession(client, STILL_ACTIVE, STUDENT_A, ["q-alpha"], {
    expiresIn: "+2 hours",
  });

  await insertLegacySession(client, MALFORMED_RESULT, STUDENT_B, ["q-alpha"]);
  await insertLegacyAttempt(client, MALFORMED_RESULT, STUDENT_B, {}, { notAResult: true });
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("only terminal sittings are backfilled (§12.7 step 3)", () => {
  it("copies a submitted session and an expired one, and leaves an active one alone", async () => {
    await runBackfill(client);

    const copied = await client.query<{ legacy_session_id: string; status: string }>(
      `select legacy_session_id, status from public.assessment_sessions
        where legacy_session_id is not null order by legacy_session_id`,
    );
    const byLegacy = new Map(copied.rows.map((r) => [r.legacy_session_id, r.status]));

    expect(byLegacy.get(SUBMITTED)).toBe("submitted");
    /* Expired without an attempt is abandoned, not submitted — calling it
       submitted would assert a submission that never happened. */
    expect(byLegacy.get(EXPIRED_NO_ATTEMPT)).toBe("abandoned");
    expect(byLegacy.has(STILL_ACTIVE)).toBe(false);
  });

  it("never touches an active session's legacy row either", async () => {
    await runBackfill(client);
    const active = await client.query(
      `select 1 from public.exam_sessions where id = $1`,
      [STILL_ACTIVE],
    );
    expect(active.rowCount).toBe(1);
  });
});

describe("the legacy tables are read and never written", () => {
  it("leaves every legacy row byte-identical across a backfill", async () => {
    /* The hard invariant of the whole step, checked rather than intended: if the
       backfill ever gained an UPDATE — a status column, a "backfilled_at"
       marker — this digest would move. */
    const before = await legacyFingerprint(client);
    await runBackfill(client);
    const after = await legacyFingerprint(client);
    expect(after).toBe(before);
  });

  it("leaves the legacy row counts unchanged", async () => {
    const counts = async () =>
      (
        await client.query<{ c: string }>(
          `select (select count(*) from public.exam_sessions)::text
                  || ',' || (select count(*) from public.exam_attempts)::text
                  || ',' || (select count(*) from public.exam_responses)::text
                  || ',' || (select count(*) from public.essay_marks)::text as c`,
        )
      ).rows[0]!.c;
    const before = await counts();
    await runBackfill(client);
    expect(await counts()).toBe(before);
  });
});

describe("content identity is classified from evidence (§12.7 step 4, ADR-005 §4)", () => {
  it("labels a session legacy_unversioned when no content hash was recorded", async () => {
    await runBackfill(client);
    const row = await client.query<{ content_identity: string }>(
      `select content_identity from public.assessment_sessions where legacy_session_id = $1`,
      [SUBMITTED],
    );
    expect(row.rows[0]!.content_identity).toBe("legacy_unversioned");
  });

  it("creates no ledger row for a legacy_unversioned session", async () => {
    /* §12.4 calls assessment_session_items the authoritative exposure ledger.
       An invented ledger is the failure this check exists to prevent. */
    await runBackfill(client);
    const ledger = await client.query(
      `select 1 from public.assessment_session_items si
         join public.assessment_sessions s on s.id = si.session_id
        where s.legacy_session_id = $1`,
      [SUBMITTED],
    );
    expect(ledger.rowCount).toBe(0);
  });

  it("uses the bare legacy_question_id branch for unversioned responses", async () => {
    await runBackfill(client);
    const responses = await client.query<{
      legacy_question_id: string | null;
      session_item_id: string | null;
    }>(
      `select r.legacy_question_id, r.session_item_id
         from public.session_responses r
         join public.assessment_sessions s on s.id = r.session_id
        where s.legacy_session_id = $1 order by r.legacy_question_id`,
      [SUBMITTED],
    );
    expect(responses.rows).toHaveLength(3);
    for (const row of responses.rows) {
      expect(row.session_item_id).toBeNull();
      expect(row.legacy_question_id).toBeTruthy();
    }
  });

  it("BINDS a session that does carry content hashes, and builds a real ledger", async () => {
    /* The branch ADR-005 §4 promises is reachable. Without this case the
       classifier could be hardcoded to return nothing and every other test here
       would still pass. */
    await seedProjectedItem(client, "q-pinned-1", PINNED_HASH_A);
    await seedProjectedItem(client, "q-pinned-2", PINNED_HASH_B);

    await insertLegacySession(client, PINNABLE, STUDENT_A, ["q-pinned-1", "q-pinned-2"], {
      config: { contentHashes: { "q-pinned-1": PINNED_HASH_A, "q-pinned-2": PINNED_HASH_B } },
    });
    await insertLegacyAttempt(
      client,
      PINNABLE,
      STUDENT_A,
      { "q-pinned-1": "b" },
      legacyResult([
        { questionId: "q-pinned-1", status: "correct", awarded: 1, available: 1 },
        { questionId: "q-pinned-2", status: "unanswered", awarded: 0, available: 1 },
      ]),
    );

    const summary = await runBackfill(client);
    expect(summary.ledgerRowsInserted).toBe(2);
    expect(summary.backfilledVersionPinned).toBe(1);

    const session = await client.query<{ content_identity: string }>(
      `select content_identity from public.assessment_sessions where legacy_session_id = $1`,
      [PINNABLE],
    );
    expect(session.rows[0]!.content_identity).toBe("version_pinned");

    const ledger = await client.query<{ global_ordinal: number; content_hash: string }>(
      `select si.global_ordinal, si.content_hash
         from public.assessment_session_items si
         join public.assessment_sessions s on s.id = si.session_id
        where s.legacy_session_id = $1 order by si.global_ordinal`,
      [PINNABLE],
    );
    /* Served ORDER is preserved from selected_question_ids, which is the one
       piece of content evidence the legacy row does carry. */
    expect(ledger.rows.map((r) => r.content_hash)).toEqual([PINNED_HASH_A, PINNED_HASH_B]);

    const responses = await client.query<{ session_item_id: string | null }>(
      `select r.session_item_id from public.session_responses r
         join public.assessment_sessions s on s.id = r.session_id
        where s.legacy_session_id = $1`,
      [PINNABLE],
    );
    expect(responses.rows.every((r) => r.session_item_id !== null)).toBe(true);
  });

  it("refuses to bind when only SOME questions carry a hash", async () => {
    /* All-or-nothing. A ledger authoritative for some rows and invented for
       others is not a ledger. */
    await seedProjectedItem(client, "q-half-1", PINNED_HASH_A);
    await insertLegacySession(client, PINNABLE, STUDENT_A, ["q-half-1", "q-half-2"], {
      config: { contentHashes: { "q-half-1": PINNED_HASH_A } },
    });

    await runBackfill(client);
    const session = await client.query<{ content_identity: string }>(
      `select content_identity from public.assessment_sessions where legacy_session_id = $1`,
      [PINNABLE],
    );
    expect(session.rows[0]!.content_identity).toBe("legacy_unversioned");
  });

  it("refuses to bind a hash that belongs to a different item", async () => {
    /* The hash must match AND the matched version's item must carry the code the
       legacy id names, so a collision cannot bind the wrong question. */
    await seedProjectedItem(client, "q-other", PINNED_HASH_A);
    await insertLegacySession(client, PINNABLE, STUDENT_A, ["q-claimed"], {
      config: { contentHashes: { "q-claimed": PINNED_HASH_A } },
    });

    await runBackfill(client);
    const session = await client.query<{ content_identity: string }>(
      `select content_identity from public.assessment_sessions where legacy_session_id = $1`,
      [PINNABLE],
    );
    expect(session.rows[0]!.content_identity).toBe("legacy_unversioned");
  });
});

describe("the historical result is copied, never recomputed", () => {
  it("preserves the original result jsonb verbatim", async () => {
    await runBackfill(client);
    const stored = await client.query<{ legacy_result: Record<string, unknown> }>(
      `select r.legacy_result from public.assessment_results r
         join public.assessment_sessions s on s.id = r.session_id
        where s.legacy_session_id = $1`,
      [SUBMITTED],
    );
    const legacy = await client.query<{ result: Record<string, unknown> }>(
      `select result from public.exam_attempts where session_id = $1`,
      [SUBMITTED],
    );
    expect(stored.rows[0]!.legacy_result).toEqual(legacy.rows[0]!.result);
  });

  it("maps the blob's own totals onto the typed columns", async () => {
    await runBackfill(client);
    const row = await client.query(
      `select r.total_items, r.correct_count, r.unanswered_count, r.manual_review_items,
              r.objective_awarded_marks, r.objective_available_marks, r.objective_percentage,
              r.pending_manual_marks, r.submission_reason, r.scoring_algorithm_version
         from public.assessment_results r
         join public.assessment_sessions s on s.id = r.session_id
        where s.legacy_session_id = $1`,
      [SUBMITTED],
    );
    expect(row.rows[0]).toMatchObject({
      total_items: 3,
      correct_count: 1,
      unanswered_count: 1,
      manual_review_items: 1,
      /* The essay's 5 marks are NOT in the objective denominator (§14.3). */
      objective_awarded_marks: 1,
      objective_available_marks: 2,
      objective_percentage: 50,
      /* q-gamma's 5 marks, not the count of pending items (1). */
      pending_manual_marks: 5,
      submission_reason: "user_submitted",
    });
  });

  it("pins an algorithm version the scoring module cannot run", async () => {
    /* Belt and braces against recomputation: content_identity already refuses
       it, and this refuses it a second, independent way. */
    await runBackfill(client);
    const row = await client.query<{ scoring_algorithm_version: string }>(
      `select scoring_algorithm_version from public.assessment_sessions
        where legacy_session_id = $1`,
      [SUBMITTED],
    );
    expect(row.rows[0]!.scoring_algorithm_version).toBe("legacy:exam-engine");
    expect(row.rows[0]!.scoring_algorithm_version).not.toBe("question-scorers.v1");
  });

  it("stores NULL rather than the legacy fabricated zero for a pending essay", async () => {
    await runBackfill(client);
    const row = await client.query<{
      score_status: string;
      is_correct: boolean | null;
      awarded_marks: number | null;
      available_marks: number;
    }>(
      `select r.score_status, r.is_correct, r.awarded_marks, r.available_marks
         from public.session_responses r
         join public.assessment_sessions s on s.id = r.session_id
        where s.legacy_session_id = $1 and r.legacy_question_id = 'q-gamma'`,
      [SUBMITTED],
    );
    expect(row.rows[0]!.score_status).toBe("manual_review");
    /* The legacy blob says 0. §14.3 says a pending item has no correctness, and
       session_responses_manual_review_has_no_correctness enforces it. */
    expect(row.rows[0]!.is_correct).toBeNull();
    expect(row.rows[0]!.awarded_marks).toBeNull();
    expect(row.rows[0]!.available_marks).toBe(5);
  });

  it("skips an unmappable result blob and counts it rather than inventing zeros", async () => {
    const summary = await runBackfill(client);
    /* Two from the shared fixture plus this file's own. */
    expect(summary.resultsSkippedUnmappable).toBeGreaterThanOrEqual(1);

    const result = await client.query(
      `select 1 from public.assessment_results r
         join public.assessment_sessions s on s.id = r.session_id
        where s.legacy_session_id = $1`,
      [MALFORMED_RESULT],
    );
    expect(result.rowCount).toBe(0);

    /* The session itself still backfilled — its lifecycle is not in doubt. */
    const session = await client.query<{ status: string }>(
      `select status from public.assessment_sessions where legacy_session_id = $1`,
      [MALFORMED_RESULT],
    );
    expect(session.rows[0]!.status).toBe("submitted");
  });
});

describe("responses cover every served question, from the best available source", () => {
  it("writes one response per served question, answered or not", async () => {
    await runBackfill(client);
    const rows = await client.query<{ legacy_question_id: string; response_value: unknown }>(
      `select r.legacy_question_id, r.response_value
         from public.session_responses r
         join public.assessment_sessions s on s.id = r.session_id
        where s.legacy_session_id = $1 order by r.legacy_question_id`,
      [SUBMITTED],
    );
    expect(rows.rows.map((r) => r.legacy_question_id)).toEqual([
      "q-alpha",
      "q-beta",
      "q-gamma",
    ]);
    /* q-beta was never answered: a row with a null value, not a missing row. */
    expect(rows.rows[1]!.response_value).toBeNull();
  });

  it("prefers the attempt snapshot over the autosave buffer", async () => {
    /* ADR-005 §3: the snapshot is what was submitted and scored; the autosave
       row is a buffer that may lag it. */
    await client.query(
      `insert into public.exam_responses
         (session_id, student_id, responses, current_question_index, flagged_question_ids)
       values ($1, $2, '{"q-alpha":"STALE"}'::jsonb, 0, array[]::text[])`,
      [SUBMITTED, STUDENT_A],
    );
    await runBackfill(client);
    const row = await client.query<{ response_value: unknown }>(
      `select r.response_value from public.session_responses r
         join public.assessment_sessions s on s.id = r.session_id
        where s.legacy_session_id = $1 and r.legacy_question_id = 'q-alpha'`,
      [SUBMITTED],
    );
    expect(row.rows[0]!.response_value).toBe("b");
  });

  it("falls back to the autosave buffer when there is no attempt", async () => {
    await runBackfill(client);
    const row = await client.query<{ response_value: unknown }>(
      `select r.response_value from public.session_responses r
         join public.assessment_sessions s on s.id = r.session_id
        where s.legacy_session_id = $1 and r.legacy_question_id = 'q-alpha'`,
      [EXPIRED_NO_ATTEMPT],
    );
    expect(row.rows[0]!.response_value).toBe("c");
  });
});

describe("manual marks carry across under their legacy id", () => {
  it("copies an essay mark and keeps its awarded and max values", async () => {
    const attempt = await client.query<{ id: string }>(
      `select id from public.exam_attempts where session_id = $1`,
      [SUBMITTED],
    );
    await client.query(
      `insert into public.essay_marks
         (attempt_id, question_id, marked_by, awarded_marks, max_marks, feedback)
       values ($1, 'q-gamma', $2, 4, 5, 'Good structure.')`,
      [attempt.rows[0]!.id, STUDENT_A],
    );

    await runBackfill(client);
    const mark = await client.query<{
      awarded_marks: string;
      max_marks: string;
      legacy_question_id: string;
      feedback: string;
    }>(
      `select m.awarded_marks, m.max_marks, m.legacy_question_id, m.feedback
         from public.manual_marks m
         join public.assessment_sessions s on s.id = m.session_id
        where s.legacy_session_id = $1`,
      [SUBMITTED],
    );
    expect(mark.rows).toHaveLength(1);
    expect(mark.rows[0]).toMatchObject({
      awarded_marks: "4",
      max_marks: "5",
      legacy_question_id: "q-gamma",
      feedback: "Good structure.",
    });
  });
});

describe("the backfill is idempotent (§22)", () => {
  it("inserts nothing on a second run and changes no target row", async () => {
    const first = await runBackfill(client);
    expect(first.sessionsInserted).toBeGreaterThan(0);

    const fingerprint = async () =>
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

    const afterFirst = await fingerprint();
    const second = await runBackfill(client);

    expect(second.sessionsInserted).toBe(0);
    expect(second.responsesInserted).toBe(0);
    expect(second.resultsInserted).toBe(0);
    expect(second.manualMarksInserted).toBe(0);
    expect(second.ledgerRowsInserted).toBe(0);
    expect(second.sessionsSubmitted).toBe(0);
    expect(second.sessionsAbandoned).toBe(0);
    /* Not merely "no inserts" — no CHANGE. A second run that bumped a version
       column or re-stamped a timestamp would still be a mutation of settled
       evidence (§5.3). */
    expect(await fingerprint()).toBe(afterFirst);
  });

  it("does not trip the terminal-response lock on a second run", async () => {
    /* The lock refuses writes to a submitted session's responses for every role.
       A second pass scoped only by ON CONFLICT would still fire the BEFORE
       INSERT trigger and raise MM202; scoping by status = 'created' is what
       keeps the second run from approaching it at all. */
    await runBackfill(client);
    await expect(runBackfill(client)).resolves.toBeTruthy();
  });
});

describe("backfilled rows stay invisible to the wrong learner", () => {
  it("does not let one student read another's backfilled session", async () => {
    await runBackfill(client);
    await asAuthenticated(client, STUDENT_B);
    const rows = await client.query<{ legacy_session_id: string }>(
      `select legacy_session_id from public.assessment_sessions where legacy_session_id is not null`,
    );
    /* STUDENT_B owns EXPIRED_NO_ATTEMPT and MALFORMED_RESULT; SUBMITTED is
       STUDENT_A's and must not appear. RLS on the target model has to hold for
       backfilled rows exactly as it does for native ones. */
    expect(rows.rows.map((r) => r.legacy_session_id)).not.toContain(SUBMITTED);
  });
});
