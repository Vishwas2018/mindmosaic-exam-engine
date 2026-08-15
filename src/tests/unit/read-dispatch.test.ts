import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { summarizeAttempt } from "@/features/student/attempt-summary";
import {
  fetchSitting,
  fetchSittingHistory,
  resolveSittingSource,
  summarizeAssessmentResult,
  toCandidateQuestionFromItem,
  type DispatchClient,
} from "@/server/assessment/read-dispatch";

/**
 * Read dispatch by session identity (spec §12.7 step 7, ADR-005 Amendment A).
 *
 * These are the rules, not the queries: which model is asked, in what order,
 * what is done with the answer, and — the one that a passing test cannot be
 * allowed to skip — that no single sitting is ever read from both. The queries
 * themselves are exercised against a real database in
 * `tests/rls/read-dispatch.test.ts`.
 */

interface RecordedQuery {
  readonly table: string;
  readonly ops: string[];
}

/**
 * A Supabase client that records what it was asked and answers from a table
 * map. The chain records every filter, because half the properties under test
 * are about a filter being present — drop `.is("legacy_attempt_id", null)` and
 * history double-counts every backfilled sitting.
 */
function makeClient(options: {
  tables?: Record<string, unknown>;
  rpc?: (fn: string, args: Record<string, unknown>) => { data: unknown; error: unknown };
}): { client: DispatchClient; queries: RecordedQuery[]; rpcCalls: string[] } {
  const queries: RecordedQuery[] = [];
  const rpcCalls: string[] = [];
  const tables = options.tables ?? {};

  const client = {
    from(table: string) {
      const entry: RecordedQuery = { table, ops: [] };
      queries.push(entry);

      const value = tables[table];
      const asList = { data: Array.isArray(value) ? value : (value ?? []), error: null };
      const asSingle = {
        data: Array.isArray(value) ? (value[0] ?? null) : (value ?? null),
        error: null,
      };

      const builder = {
        select(columns: string) {
          entry.ops.push(`select(${columns})`);
          return builder;
        },
        eq(column: string, value: unknown) {
          entry.ops.push(`eq(${column},${String(value)})`);
          return builder;
        },
        gt(column: string, value: unknown) {
          entry.ops.push(`gt(${column},${String(value)})`);
          return builder;
        },
        is(column: string, value: unknown) {
          entry.ops.push(`is(${column},${String(value)})`);
          return builder;
        },
        order(column: string) {
          entry.ops.push(`order(${column})`);
          return builder;
        },
        limit(count: number) {
          entry.ops.push(`limit(${count})`);
          return builder;
        },
        maybeSingle() {
          entry.ops.push("maybeSingle()");
          return Promise.resolve(asSingle);
        },
        then(onfulfilled: (value: { data: unknown; error: unknown }) => unknown) {
          return Promise.resolve(asList).then(onfulfilled);
        },
      };
      return builder;
    },
    rpc(fn: string, args: Record<string, unknown>) {
      rpcCalls.push(fn);
      return Promise.resolve(
        options.rpc?.(fn, args) ?? { data: null, error: { code: "MM003" } },
      );
    },
  };

  return { client: client as unknown as DispatchClient, queries, rpcCalls };
}

const NATIVE_SESSION = "11111111-1111-4111-8111-111111111111";
const BACKFILL_COPY = "22222222-2222-4222-8222-222222222222";
const LEGACY_SESSION = "33333333-3333-4333-8333-333333333333";

describe("a session is read from the model that created it", () => {
  it("routes a natively created target session to the target model", async () => {
    const { client, queries } = makeClient({
      tables: { assessment_sessions: [{ id: NATIVE_SESSION, legacy_session_id: null }] },
    });

    expect(await resolveSittingSource(client, NATIVE_SESSION)).toEqual({
      origin: "version_pinned",
      sessionId: NATIVE_SESSION,
    });
    /* And stops. A second lookup in the legacy model would be the presence
       probe Amendment A1 rejected. */
    expect(queries.map((q) => q.table)).toEqual(["assessment_sessions"]);
  });

  it("routes a BACKFILL COPY back to the legacy model that created the sitting", async () => {
    /* The case the whole amendment exists for. This row is in the target model
       and is not a target-model sitting: it is a copy of a legacy one, and
       `legacy_session_id` is the record of that. Reading it from the target
       model would source two sittings of the same vintage from two different
       pipelines depending only on how far the backfill had run. */
    const { client } = makeClient({
      tables: {
        assessment_sessions: [{ id: BACKFILL_COPY, legacy_session_id: LEGACY_SESSION }],
      },
    });

    expect(await resolveSittingSource(client, BACKFILL_COPY)).toEqual({
      origin: "legacy",
      sessionId: LEGACY_SESSION,
    });
  });

  it("resolves BOTH identities of a backfilled sitting to the same single source", async () => {
    /* "Exactly one source per session" has to be a property of the sitting, not
       of the id you happened to ask with. */
    const viaCopy = makeClient({
      tables: {
        assessment_sessions: [{ id: BACKFILL_COPY, legacy_session_id: LEGACY_SESSION }],
      },
    });
    const viaLegacy = makeClient({
      tables: {
        assessment_sessions: [],
        exam_sessions: [{ id: LEGACY_SESSION }],
      },
    });

    expect(await resolveSittingSource(viaCopy.client, BACKFILL_COPY)).toEqual(
      await resolveSittingSource(viaLegacy.client, LEGACY_SESSION),
    );
  });

  it("asks the target model first, then the legacy model", async () => {
    const { client, queries } = makeClient({
      tables: { assessment_sessions: [], exam_sessions: [{ id: LEGACY_SESSION }] },
    });

    expect(await resolveSittingSource(client, LEGACY_SESSION)).toEqual({
      origin: "legacy",
      sessionId: LEGACY_SESSION,
    });
    expect(queries.map((q) => q.table)).toEqual(["assessment_sessions", "exam_sessions"]);
  });

  it("returns null for a session no model claims", async () => {
    const { client } = makeClient({ tables: { assessment_sessions: [], exam_sessions: [] } });
    expect(await resolveSittingSource(client, LEGACY_SESSION)).toBeNull();
  });
});

describe("one sitting is never read from both models", () => {
  it("reads a target sitting through the definer RPC and touches no legacy table", async () => {
    const { client, queries, rpcCalls } = makeClient({
      tables: { assessment_sessions: [{ id: NATIVE_SESSION, legacy_session_id: null }] },
      rpc: () => ({
        data: {
          sessionId: NATIVE_SESSION,
          config: { yearLevel: 5, examStyle: "naplan_style", subject: "numeracy", questionCount: 1, timing: "untimed" },
          createdAt: "2026-08-01T00:00:00.000Z",
          expiresAt: "2026-08-02T00:00:00.000Z",
          items: [ALLOCATED_ITEM],
          responses: {},
        },
        error: null,
      }),
    });

    const outcome = await fetchSitting(client, NATIVE_SESSION, "student-1");

    expect(outcome.kind).toBe("ready");
    expect(rpcCalls).toEqual(["get_assessment_session"]);
    expect(queries.map((q) => q.table)).not.toContain("exam_sessions");
    expect(queries.map((q) => q.table)).not.toContain("exam_responses");
  });

  it("reads a legacy sitting from the legacy tables and calls no target RPC", async () => {
    const { client, rpcCalls, queries } = makeClient({
      tables: {
        assessment_sessions: [],
        exam_sessions: [
          {
            id: LEGACY_SESSION,
            config: {
              yearLevel: 5,
              examStyle: "naplan_style",
              subject: "numeracy",
              questionCount: 1,
              timing: "untimed",
              bankId: "curated",
            },
            selected_question_ids: [],
            created_at: "2026-08-01T00:00:00.000Z",
            expires_at: "2026-08-02T00:00:00.000Z",
          },
        ],
        exam_responses: [],
      },
    });

    await fetchSitting(client, LEGACY_SESSION, "student-1");

    expect(rpcCalls).toEqual([]);
    expect(queries.some((q) => q.table === "exam_sessions")).toBe(true);
  });

  it("scopes the legacy read to the caller, so a parent cannot pull a child's paper", async () => {
    /* Both models let a parent SEE that a session exists. Neither has ever
       handed them the paper, and introducing a get-by-id endpoint must not
       change that. The target model enforces it inside the RPC; the legacy
       tables have no such function, so the filter is asserted here. */
    const { client, queries } = makeClient({
      tables: { assessment_sessions: [], exam_sessions: [{ id: LEGACY_SESSION }] },
    });

    await fetchSitting(client, LEGACY_SESSION, "student-1");

    const read = queries.filter((q) => q.table === "exam_sessions").at(-1);
    expect(read?.ops).toContain("eq(student_id,student-1)");
  });

  it("treats 'not yours' from the target RPC as absence, not as a failure", async () => {
    /* MM003 must read as 404. A 500 here where a stranger's session gives 404
       would make the difference between the two an answer in itself. */
    const { client } = makeClient({
      tables: { assessment_sessions: [{ id: NATIVE_SESSION, legacy_session_id: null }] },
      rpc: () => ({ data: null, error: { code: "MM003" } }),
    });

    expect(await fetchSitting(client, NATIVE_SESSION, "student-2")).toEqual({ kind: "none" });
  });
});

describe("history spans both models with no sitting counted twice", () => {
  const legacyAttempt = {
    id: "attempt-1",
    session_id: LEGACY_SESSION,
    submitted_at: "2026-08-01T10:00:00.000Z",
    result: {
      totalQuestions: 10,
      attemptedQuestions: 10,
      objectivePercentage: 70,
      objectiveMarksAvailable: 10,
      pendingManualMarks: 0,
    },
    session: { config: { subject: "numeracy", examStyle: "naplan_style", timing: "timed" } },
  };

  const targetResult = {
    id: "result-1",
    session_id: NATIVE_SESSION,
    submitted_at: "2026-08-02T10:00:00.000Z",
    total_items: 10,
    attempted_items: 9,
    objective_percentage: 80,
    objective_available_marks: 10,
    pending_manual_marks: 0,
    legacy_result: null,
    session: { config: { subject: "numeracy", examStyle: "naplan_style", timing: "timed" } },
  };

  it("filters the target half to results the target model PRODUCED", async () => {
    const { client, queries } = makeClient({
      tables: { exam_attempts: [legacyAttempt], assessment_results: [targetResult] },
    });

    await fetchSittingHistory(client);

    const targetQuery = queries.find((q) => q.table === "assessment_results");
    expect(targetQuery?.ops).toContain("is(legacy_attempt_id,null)");
  });

  it("returns a backfilled sitting exactly once — from its legacy origin", async () => {
    /* The database applies the origin filter, so the target half arrives
       already excluding the copy. What this asserts is that the legacy half is
       not ALSO filtered out by some second rule: the sitting must survive
       exactly once, not zero times. */
    const { client } = makeClient({
      tables: { exam_attempts: [legacyAttempt], assessment_results: [] },
    });

    const history = await fetchSittingHistory(client);

    expect(history).toHaveLength(1);
    expect(history[0]!.sessionId).toBe(LEGACY_SESSION);
  });

  it("orders across the union, not within each half", async () => {
    const older = { ...legacyAttempt, submitted_at: "2026-08-03T10:00:00.000Z" };
    const { client } = makeClient({
      tables: { exam_attempts: [older], assessment_results: [targetResult] },
    });

    const history = await fetchSittingHistory(client);

    expect(history.map((s) => s.submittedAt)).toEqual([
      "2026-08-03T10:00:00.000Z",
      "2026-08-02T10:00:00.000Z",
    ]);
  });

  it("produces the same summary shape from either model", async () => {
    const { client } = makeClient({
      tables: { exam_attempts: [legacyAttempt], assessment_results: [targetResult] },
    });

    const history = await fetchSittingHistory(client);

    expect(Object.keys(history[0]!).sort()).toEqual(Object.keys(history[1]!).sort());
    /* And nothing in it names the model. A client that could tell them apart
       could be built to treat them differently. */
    expect(JSON.stringify(history)).not.toMatch(/storageModel|legacy|version_pinned/);
  });

  it("derives the same numbers from a target result as from the equivalent attempt", async () => {
    const fromColumns = summarizeAssessmentResult({
      id: "r",
      submitted_at: legacyAttempt.submitted_at,
      total_items: 10,
      attempted_items: 10,
      objective_percentage: 70,
      objective_available_marks: 10,
      pending_manual_marks: 0,
      legacy_result: null,
      session: legacyAttempt.session,
    });
    const fromLegacy = summarizeAttempt({
      id: "r",
      submitted_at: legacyAttempt.submitted_at,
      result: legacyAttempt.result,
      session: legacyAttempt.session,
    });

    expect(fromColumns).toEqual(fromLegacy);
  });

  it("prefers the preserved original for a backfilled result", async () => {
    /* A backfilled row's typed columns are a transcription; the original blob
       is what the learner was actually told (ADR-005 §3). */
    const summary = summarizeAssessmentResult({
      id: "r",
      submitted_at: legacyAttempt.submitted_at,
      total_items: 0,
      attempted_items: 0,
      objective_percentage: 0,
      objective_available_marks: 0,
      pending_manual_marks: 0,
      legacy_result: legacyAttempt.result,
      session: legacyAttempt.session,
    });

    expect(summary.scorePercent).toBe(70);
  });
});

const ALLOCATED_ITEM = {
  sessionItemId: "item-row-1",
  ordinal: 1,
  itemCode: "g5-naplan-num-001",
  origin: "original_seed",
  questionType: "short_answer",
  answerKind: "manual",
  minWords: 20,
  maxWords: 100,
  prompt: "Explain your reasoning.",
  candidateContent: { options: [{ id: "a", text: "A" }], instructions: "Show working." },
  visuals: [],
  accessibility: { altTextProvided: true, answerableFromAccessibleRepresentation: true },
  marksAvailable: 3,
  estimatedTimeSeconds: 120,
  authoredDifficulty: "medium",
  locale: "en-AU",
  contentSchemaVersion: 1,
  sourceYearLevel: 5,
  sourceExamStyle: "naplan_style",
  sourceSubject: "numeracy",
  sourceSkill: "reasoning",
  sourceStrand: "number",
  sourceTopic: "addition",
  sourceTags: ["worded"],
  stimulus: null,
};

describe("an allocated item becomes a candidate question with nothing invented", () => {
  it("maps every field from the row", () => {
    const question = toCandidateQuestionFromItem(ALLOCATED_ITEM);

    expect(question).toMatchObject({
      id: "g5-naplan-num-001",
      type: "short_answer",
      yearLevel: 5,
      examStyle: "naplan_style",
      status: "published",
      origin: "original_seed",
      prompt: "Explain your reasoning.",
      instructions: "Show working.",
      answerKind: "manual",
      minWords: 20,
      maxWords: 100,
      metadata: {
        subject: "numeracy",
        strand: "number",
        topic: "addition",
        skill: "reasoning",
        difficulty: "medium",
        marks: 3,
        estimatedTimeSeconds: 120,
        tags: ["worded"],
        locale: "en-AU",
        schemaVersion: 1,
      },
    });
  });

  it("carries no answer key, explanation or score", () => {
    const serialised = JSON.stringify(toCandidateQuestionFromItem(ALLOCATED_ITEM));

    expect(serialised).not.toMatch(/answerKey/i);
    expect(serialised).not.toMatch(/explanation/i);
    expect(serialised).not.toMatch(/optionId|isCorrect|awardedMarks/i);
  });

  it("uses honest empties where the row is genuinely empty", () => {
    /* An item with no tags and no word guidance has none — an empty tag list
       and absent minWords/maxWords are facts, not placeholders. The fields that
       CANNOT be honestly defaulted (strand, topic, answerKind) are not defaulted
       here at all: the database refuses to serve a row missing them (MM214), so
       this mapper never has to decide what to invent. */
    const spare = {
      ...ALLOCATED_ITEM,
      sourceTags: null,
      sourceSkill: null,
      minWords: null,
      maxWords: null,
    };
    const question = toCandidateQuestionFromItem(spare);

    expect(question.metadata.tags).toEqual([]);
    expect(question.metadata.skill).toBeUndefined();
    expect(question.minWords).toBeUndefined();
    expect(question.maxWords).toBeUndefined();
  });
});
