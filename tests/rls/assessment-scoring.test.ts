/**
 * The scoring module, end to end, against a real database
 * (src/server/scoring/answer-access.ts; spec §9.3.1, §12.5, §14.1–§14.3, §22).
 *
 * WHY THIS SUITE COMMITS. Every other file in tests/rls wraps its work in a
 * transaction and rolls back. This one cannot: the module under test opens its
 * *own* connection, as `mindmosaic_scoring`, which is the entire point — it
 * proves that scoring succeeds with the least-privilege credential and not with
 * the harness's unrestricted one. A second connection cannot see uncommitted
 * fixtures, so the fixtures are committed and torn down explicitly. Every
 * identifier below is namespaced to this file and `resetFixtures` runs before
 * as well as after, so a crashed run leaves nothing that breaks the next one.
 *
 * THE PROPERTIES WORTH THE COST. Three of them cannot be shown any other way:
 *
 *   * scoring works with exactly the grants of §9.3.1 and no others;
 *   * a later revision of an item does not change an already-served sitting
 *     (§22, "revise an item, then replay an old session"); and
 *   * the raw answer key does not appear in anything the module returns.
 */
import type { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  ScoringRefused,
  scoreAssessmentSession,
  type ScoredSessionSummary,
} from "@/server/scoring/answer-access";

import { connect, scoringDbUrl } from "./db";

/** Namespaced so teardown can be exact, and so a crash cannot poison a rerun. */
const STUDENT = "77777777-0000-0000-0000-0000000000a1";
const ITEM_CODE_PREFIX = "scoring-suite-";
const PINS = {
  assessment_profile_version: "test-profile.v1",
  framework_version: "test-framework.v1",
  blueprint_version: "test-blueprint.v1",
  taxonomy_version: "test-taxonomy.v1",
  engine_algorithm_version: "test-engine.v1",
  scoring_algorithm_version: "question-scorers.v1",
  content_build_version: "test-build.v1",
};

interface SeededItem {
  itemId: string;
  versionId: string;
}

let client: Client;
let hashCounter = 0;

function nextHash(): string {
  hashCounter += 1;
  return hashCounter.toString(16).padStart(64, "0");
}

async function resetFixtures(target: Client): Promise<void> {
  /* Order matters: sessions reference item_versions with ON DELETE RESTRICT, so
     the sittings go before the content they pinned. auth.users cascades all the
     way down through profiles to results. */
  await target.query(`delete from auth.users where id = $1`, [STUDENT]);
  await target.query(
    `delete from public.item_answer_versions
      where item_version_id in (
        select iv.id from public.item_versions iv
        join public.items i on i.id = iv.item_id
        where i.item_code like $1)`,
    [`${ITEM_CODE_PREFIX}%`],
  );
  await target.query(
    `delete from public.item_versions
      where item_id in (select id from public.items where item_code like $1)`,
    [`${ITEM_CODE_PREFIX}%`],
  );
  await target.query(`delete from public.items where item_code like $1`, [
    `${ITEM_CODE_PREFIX}%`,
  ]);
}

async function seedStudent(target: Client): Promise<void> {
  await target.query(`insert into auth.users (id, email) values ($1, $2)`, [
    STUDENT,
    "scoring-suite@test.local",
  ]);
}

async function seedItem(
  target: Client,
  label: string,
  questionType: string,
  answerKey: unknown,
  marks = 1,
  options: { itemId?: string; revision?: number } = {},
): Promise<SeededItem> {
  const { revision = 1 } = options;
  let itemId = options.itemId;

  if (itemId === undefined) {
    const item = await target.query<{ id: string }>(
      `insert into public.items (item_code, origin, provenance_class)
       values ($1, 'test_seed', 'curated_git_authored') returning id`,
      [`${ITEM_CODE_PREFIX}${label}`],
    );
    itemId = item.rows[0]!.id;
  }

  const version = await target.query<{ id: string }>(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic)
     values ($1, $2, $3, $4, '{"options":[]}'::jsonb, '{"altTextProvided":true}'::jsonb,
             60, 'easy', $5, 1, $6, 'curated_git_authored', now(), 5, 'naplan_style', 'numeracy',
             case when $3 = 'essay' then 'manual' else 'single_option' end,
             'number', 'addition')
     returning id`,
    [itemId, revision, questionType, `Prompt ${label} r${revision}`, marks, nextHash()],
  );
  const versionId = version.rows[0]!.id;

  await target.query(
    `insert into public.item_answer_versions (item_version_id, answer_key, private_explanation)
     values ($1, $2::jsonb, $3)`,
    [versionId, JSON.stringify(answerKey), `PRIVATE-EXPLANATION-${label}`],
  );

  return { itemId, versionId };
}

/**
 * Builds a session with an exact pinned allocation.
 *
 * Deliberately a direct insert rather than a call to
 * `create_assessment_session`: that function chooses its own paper under its own
 * seed, which is right for delivery and useless for a determinism test, where
 * the content must be identical across two sittings by construction.
 * `assessment-session-create.test.ts` covers the allocation path.
 */
async function seedSession(
  target: Client,
  versionIds: readonly string[],
  overrides: Partial<Record<keyof typeof PINS, string>> = {},
  legacySessionId: string | null = null,
): Promise<string> {
  const pins = { ...PINS, ...overrides };
  const session = await target.query<{ id: string }>(
    `insert into public.assessment_sessions
       (student_id, assessment_profile_version, framework_version, blueprint_version,
        taxonomy_version, engine_algorithm_version, scoring_algorithm_version,
        content_build_version, seed, config, expires_at, started_at,
        legacy_session_id, content_identity)
     values ($1, $2, $3, $4, $5, $6, $7, $8, 'test-seed', '{}'::jsonb,
             now() + interval '1 hour', now() - interval '10 minutes', $9,
             case when $9::uuid is null then 'version_pinned' else 'legacy_unversioned' end)
     returning id`,
    [
      STUDENT,
      pins.assessment_profile_version,
      pins.framework_version,
      pins.blueprint_version,
      pins.taxonomy_version,
      pins.engine_algorithm_version,
      pins.scoring_algorithm_version,
      pins.content_build_version,
      legacySessionId,
    ],
  );
  const sessionId = session.rows[0]!.id;

  for (const [index, versionId] of versionIds.entries()) {
    await target.query(
      `insert into public.assessment_session_items
         (session_id, global_ordinal, within_stage_ordinal, item_id, item_version_id,
          content_hash, seed)
       select $1, $2, $2, iv.item_id, iv.id, iv.content_hash, 'test-seed'
         from public.item_versions iv where iv.id = $3`,
      [sessionId, index + 1, versionId],
    );
  }

  return sessionId;
}

/** Session item ids in served order — the keys a response is committed under. */
async function ledgerOf(target: Client, sessionId: string): Promise<string[]> {
  const result = await target.query<{ id: string }>(
    `select id from public.assessment_session_items
      where session_id = $1 order by global_ordinal`,
    [sessionId],
  );
  return result.rows.map((row) => row.id);
}

async function respond(
  target: Client,
  sessionId: string,
  answers: Record<string, unknown>,
): Promise<void> {
  for (const [sessionItemId, value] of Object.entries(answers)) {
    await target.query(
      `insert into public.session_responses
         (session_id, session_item_id, response_value, client_sequence, answered_at)
       values ($1, $2, $3::jsonb, 1, now())`,
      [sessionId, sessionItemId, JSON.stringify(value)],
    );
  }
}

/** The parts of a summary that must be identical across a deterministic replay. */
function derivedNumbers(summary: ScoredSessionSummary) {
  return {
    totalItems: summary.totalItems,
    attemptedItems: summary.attemptedItems,
    autoMarkedItems: summary.autoMarkedItems,
    manualReviewItems: summary.manualReviewItems,
    correctCount: summary.correctCount,
    incorrectCount: summary.incorrectCount,
    unansweredCount: summary.unansweredCount,
    objectiveAwardedMarks: summary.objectiveAwardedMarks,
    objectiveAvailableMarks: summary.objectiveAvailableMarks,
    objectivePercentage: summary.objectivePercentage,
    pendingManualMarks: summary.pendingManualMarks,
    outcomes: summary.outcomes.map((outcome) => ({
      ordinal: outcome.ordinal,
      status: outcome.status,
      correct: outcome.correct,
      awardedMarks: outcome.awardedMarks,
      availableMarks: outcome.availableMarks,
    })),
  };
}

beforeAll(() => {
  /* The module reads this at call time and refuses to fall back to any other
     credential, which is the §9.3.1 property being relied on here. */
  process.env.SCORING_DB_URL = scoringDbUrl();
});

beforeEach(async () => {
  client = await connect();
  await resetFixtures(client);
  await seedStudent(client);
});

afterEach(async () => {
  await resetFixtures(client);
  await client.end();
});

afterAll(() => {
  delete process.env.SCORING_DB_URL;
});

describe("scoring a version-pinned sitting", () => {
  it("computes correctness from the pinned answer and records it server-side", async () => {
    const right = await seedItem(client, "mc-right", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const wrong = await seedItem(client, "mc-wrong", "multiple_choice", {
      kind: "single_option",
      optionId: "c",
    });
    const blank = await seedItem(client, "mc-blank", "multiple_choice", {
      kind: "single_option",
      optionId: "a",
    });

    const sessionId = await seedSession(client, [
      right.versionId,
      wrong.versionId,
      blank.versionId,
    ]);
    const items = await ledgerOf(client, sessionId);
    await respond(client, sessionId, { [items[0]!]: "b", [items[1]!]: "a" });

    const summary = await scoreAssessmentSession(sessionId, STUDENT);

    expect(summary.totalItems).toBe(3);
    expect(summary.correctCount).toBe(1);
    expect(summary.incorrectCount).toBe(1);
    expect(summary.unansweredCount).toBe(1);
    expect(summary.objectiveAwardedMarks).toBe(1);
    expect(summary.objectiveAvailableMarks).toBe(3);
    expect(summary.objectivePercentage).toBe(33);

    /* Recorded, not merely returned — §14.1's whole point is that the number a
       parent or teacher sees came from the server. */
    const stored = await client.query<{
      correct_count: number;
      objective_percentage: number;
      scoring_algorithm_version: string;
    }>(
      `select correct_count, objective_percentage, scoring_algorithm_version
         from public.assessment_results where session_id = $1`,
      [sessionId],
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0]).toMatchObject({
      correct_count: 1,
      objective_percentage: 33,
      scoring_algorithm_version: "question-scorers.v1",
    });
  });

  it("stamps each response and leaves the learner's answer untouched", async () => {
    const item = await seedItem(client, "stamp", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const sessionId = await seedSession(client, [item.versionId]);
    const [sessionItemId] = await ledgerOf(client, sessionId);
    await respond(client, sessionId, { [sessionItemId!]: "b" });

    await scoreAssessmentSession(sessionId, STUDENT);

    const response = await client.query<{
      score_status: string;
      is_correct: boolean;
      awarded_marks: number;
      available_marks: number;
      scored_at: Date;
      response_value: unknown;
      client_sequence: string;
    }>(
      `select score_status, is_correct, awarded_marks, available_marks, scored_at,
              response_value, client_sequence
         from public.session_responses where session_id = $1`,
      [sessionId],
    );
    const row = response.rows[0]!;
    expect(row.score_status).toBe("correct");
    expect(row.is_correct).toBe(true);
    expect(row.awarded_marks).toBe(1);
    expect(row.available_marks).toBe(1);
    expect(row.scored_at).toBeInstanceOf(Date);
    /* The column-level grant is what makes this hold: the scoring role has no
       privilege on response_value or client_sequence, so the thing that marks
       the evidence cannot edit it. */
    expect(row.response_value).toBe("b");
    expect(row.client_sequence).toBe("1");
  });

  it("submits the session last, in the same transaction", async () => {
    const item = await seedItem(client, "lifecycle", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const sessionId = await seedSession(client, [item.versionId]);

    const before = await client.query<{ status: string; version: number }>(
      `select status, version from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    expect(before.rows[0]!.status).toBe("created");

    await scoreAssessmentSession(sessionId, STUDENT);

    const after = await client.query<{
      status: string;
      version: number;
      submitted_at: Date;
    }>(
      `select status, version, submitted_at from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    expect(after.rows[0]!.status).toBe("submitted");
    expect(after.rows[0]!.submitted_at).toBeInstanceOf(Date);
    /* The optimistic lock must advance on every update (§12.3). */
    expect(after.rows[0]!.version).toBe(before.rows[0]!.version + 1);
  });
});

describe("manual review does not pollute objective scores (§14.3)", () => {
  it("excludes an attempted essay from the objective denominator and fabricates no correctness", async () => {
    const objective = await seedItem(client, "obj", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const essay = await seedItem(client, "essay", "essay", { kind: "manual", rubric: "PRIVATE-RUBRIC award marks for a clear argument." }, 5);

    const sessionId = await seedSession(client, [objective.versionId, essay.versionId]);
    const items = await ledgerOf(client, sessionId);
    await respond(client, sessionId, {
      [items[0]!]: "b",
      [items[1]!]: "An answer worth a person's attention.",
    });

    const summary = await scoreAssessmentSession(sessionId, STUDENT);

    /* One objective mark out of one objective mark. The essay's five marks are
       not in the denominator, so the learner is shown 100% with a mark pending
       rather than 17% that will silently rise later. */
    expect(summary.objectiveAvailableMarks).toBe(1);
    expect(summary.objectiveAwardedMarks).toBe(1);
    expect(summary.objectivePercentage).toBe(100);
    expect(summary.manualReviewItems).toBe(1);
    expect(summary.pendingManualMarks).toBe(1);

    const essayOutcome = summary.outcomes.find((outcome) => outcome.ordinal === 2)!;
    expect(essayOutcome.status).toBe("manual_review");
    /* Not false, not zero — null. This is the constraint
       session_responses_manual_review_has_no_correctness exists to enforce, and
       the module must produce a row that satisfies it rather than be caught by
       it. */
    expect(essayOutcome.correct).toBeNull();
    expect(essayOutcome.awardedMarks).toBeNull();

    const stored = await client.query<{ is_correct: boolean | null; awarded_marks: number | null }>(
      `select is_correct, awarded_marks from public.session_responses
        where session_id = $1 and score_status = 'manual_review'`,
      [sessionId],
    );
    expect(stored.rows[0]).toEqual({ is_correct: null, awarded_marks: null });
  });

  it("treats a blank essay as unanswered, not as pending review", async () => {
    const essay = await seedItem(client, "blank-essay", "essay", { kind: "manual", rubric: "PRIVATE-RUBRIC award marks for a clear argument." }, 5);
    const sessionId = await seedSession(client, [essay.versionId]);

    const summary = await scoreAssessmentSession(sessionId, STUDENT);

    expect(summary.unansweredCount).toBe(1);
    expect(summary.manualReviewItems).toBe(0);
    expect(summary.pendingManualMarks).toBe(0);
    expect(summary.attemptedItems).toBe(0);
  });
});

describe("determinism and version pinning (§14.2, §22)", () => {
  it("produces an identical result for the same pinned content and responses", async () => {
    const first = await seedItem(client, "golden-1", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const second = await seedItem(client, "golden-2", "number_entry", {
      kind: "number",
      value: 42,
      tolerance: 0,
    });
    const third = await seedItem(client, "golden-3", "essay", { kind: "manual", rubric: "PRIVATE-RUBRIC award marks for a clear argument." }, 4);

    const versionIds = [first.versionId, second.versionId, third.versionId];
    const answersFor = (items: string[]) => ({
      [items[0]!]: "b",
      [items[1]!]: 41,
      [items[2]!]: "Some prose.",
    });

    const sessionA = await seedSession(client, versionIds);
    await respond(client, sessionA, answersFor(await ledgerOf(client, sessionA)));
    const summaryA = await scoreAssessmentSession(sessionA, STUDENT);

    const sessionB = await seedSession(client, versionIds);
    await respond(client, sessionB, answersFor(await ledgerOf(client, sessionB)));
    const summaryB = await scoreAssessmentSession(sessionB, STUDENT);

    /* Same pinned content, same responses, same algorithm version — §14.2 says
       the same result, and the ids and timestamps are the only things allowed
       to differ. */
    expect(derivedNumbers(summaryB)).toEqual(derivedNumbers(summaryA));
  });

  it("scores an old sitting against the revision it served, not the current one", async () => {
    /* §22: "Revise an item, then replay an old session." The revision here does
       not merely change the prompt — it changes the ANSWER, so a scorer that
       resolved the item's current version instead of the pinned one would score
       this sitting differently and there would be no way to tell from the
       result. */
    const item = await seedItem(client, "revised", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const sessionId = await seedSession(client, [item.versionId]);
    const [sessionItemId] = await ledgerOf(client, sessionId);
    await respond(client, sessionId, { [sessionItemId!]: "b" });

    await seedItem(
      client,
      "revised",
      "multiple_choice",
      { kind: "single_option", optionId: "c" },
      1,
      { itemId: item.itemId, revision: 2 },
    );

    const summary = await scoreAssessmentSession(sessionId, STUDENT);
    expect(summary.correctCount).toBe(1);
    expect(summary.objectivePercentage).toBe(100);
  });
});

describe("what the module refuses", () => {
  it("refuses a session that is already submitted", async () => {
    const item = await seedItem(client, "twice", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const sessionId = await seedSession(client, [item.versionId]);
    await scoreAssessmentSession(sessionId, STUDENT);

    await expect(scoreAssessmentSession(sessionId, STUDENT)).rejects.toMatchObject({
      name: "ScoringRefused",
      code: "session_not_scoreable",
    });
  });

  it("refuses to recompute a legacy_unversioned sitting (ADR-005 §4)", async () => {
    const item = await seedItem(client, "legacy", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    /* The only way to become legacy_unversioned is to have a legacy source —
       assessment_sessions_unversioned_only_from_legacy enforces that — and the
       link must be set AT INSERT, because the transition trigger refuses to
       re-point legacy_session_id afterwards (ADR-005 §1). The fixture therefore
       looks exactly like what the backfill will produce. */
    const legacy = await client.query<{ id: string }>(
      `insert into public.exam_sessions (student_id, config, seed, selected_question_ids, expires_at)
       values ($1, '{}'::jsonb, 's', array['q1'], now() + interval '1 hour') returning id`,
      [STUDENT],
    );
    const sessionId = await seedSession(client, [item.versionId], {}, legacy.rows[0]!.id);

    await expect(scoreAssessmentSession(sessionId, STUDENT)).rejects.toMatchObject({
      code: "session_not_version_pinned",
    });
  });

  it("refuses an algorithm version it does not implement", async () => {
    const item = await seedItem(client, "future", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const sessionId = await seedSession(client, [item.versionId], {
      scoring_algorithm_version: "question-scorers.v99",
    });

    await expect(scoreAssessmentSession(sessionId, STUDENT)).rejects.toMatchObject({
      code: "unsupported_scoring_algorithm",
    });
  });

  it("refuses a session belonging to somebody else", async () => {
    /* §17.2: the module re-checks ownership against its own read rather than
       trusting the route to have done it. The actor is a check, never a value —
       the student on the result comes from the session row either way, so the
       failure this prevents is a route bug scoring and returning another
       learner's sitting, not a forged student id. */
    const item = await seedItem(client, "not-mine", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const sessionId = await seedSession(client, [item.versionId]);

    await expect(
      scoreAssessmentSession(sessionId, "77777777-0000-0000-0000-0000000000ff"),
    ).rejects.toMatchObject({ code: "not_session_owner" });

    /* And nothing was written on the way to refusing. */
    const results = await client.query(
      `select 1 from public.assessment_results where session_id = $1`,
      [sessionId],
    );
    expect(results.rowCount).toBe(0);
  });

  it("refuses a session that does not exist", async () => {
    await expect(
      scoreAssessmentSession("00000000-0000-0000-0000-0000000000ff", STUDENT),
    ).rejects.toBeInstanceOf(ScoringRefused);
  });
});

describe("the answer never crosses the module boundary (§9.3.1)", () => {
  it("returns no answer key, rubric or private explanation in the summary", async () => {
    const item = await seedItem(client, "leak", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const essay = await seedItem(client, "leak-essay", "essay", { kind: "manual", rubric: "PRIVATE-RUBRIC award marks for a clear argument." }, 3);
    const sessionId = await seedSession(client, [item.versionId, essay.versionId]);
    const items = await ledgerOf(client, sessionId);
    await respond(client, sessionId, { [items[0]!]: "b", [items[1]!]: "prose" });

    const summary = await scoreAssessmentSession(sessionId, STUDENT);
    const serialised = JSON.stringify(summary);

    /* The seeded explanation is real text that exists in the database for these
       exact items, so its absence is evidence rather than assumption. */
    expect(serialised).not.toContain("PRIVATE-EXPLANATION");
    /* The rubric lives inside answer_key for a manual item, so it is the same
       object the module reads to decide "manual_review" — the strongest of
       these three tripwires. */
    expect(serialised).not.toContain("PRIVATE-RUBRIC");
    expect(serialised).not.toMatch(/answerKey|answer_key/i);
    expect(serialised).not.toMatch(/single_option/);
    expect(serialised).not.toMatch(/optionId/i);
    expect(serialised).not.toMatch(/rubric|gradingRules|grading_rules/i);
  });

  it("writes nothing to the result row that could carry an answer", async () => {
    const item = await seedItem(client, "result-leak", "multiple_choice", {
      kind: "single_option",
      optionId: "b",
    });
    const sessionId = await seedSession(client, [item.versionId]);
    await scoreAssessmentSession(sessionId, STUDENT);

    const stored = await client.query(
      `select to_jsonb(r) as row from public.assessment_results r where session_id = $1`,
      [sessionId],
    );
    const serialised = JSON.stringify(stored.rows[0]);
    expect(serialised).not.toContain("PRIVATE-EXPLANATION");
    expect(serialised).not.toMatch(/single_option/);
  });
});
