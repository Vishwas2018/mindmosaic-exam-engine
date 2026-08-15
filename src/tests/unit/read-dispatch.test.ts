import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { summarizeAttempt } from "@/features/student/attempt-summary";
import {
  fetchSitting,
  fetchSittingHistory,
  mapFlagsToQuestionIds,
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
        not(column: string, operator: string, value: unknown) {
          entry.ops.push(`not(${column},${operator},${String(value)})`);
          return builder;
        },
        or(filter: string) {
          entry.ops.push(`or(${filter})`);
          return builder;
        },
        in(column: string, values: unknown[]) {
          entry.ops.push(`in(${column},${values.join("|")})`);
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
  it("asks the one shared view, and asks it about either identity", async () => {
    /* Step 8 moved the rule into `visible_sittings`, so this is now ONE query
       rather than a probe of each model in turn. `alias_session_id` is the
       backfill copy's id, which is why a single `.or()` covers both identities
       of a backfilled sitting. */
    const { client, queries } = makeClient({
      tables: {
        visible_sittings: [
          { origin: "version_pinned", session_id: NATIVE_SESSION, alias_session_id: null },
        ],
      },
    });

    expect(await resolveSittingSource(client, NATIVE_SESSION)).toEqual({
      origin: "version_pinned",
      sessionId: NATIVE_SESSION,
    });
    expect(queries.map((q) => q.table)).toEqual(["visible_sittings"]);
    expect(queries[0]!.ops.join(" ")).toContain(`or(session_id.eq.${NATIVE_SESSION},alias_session_id.eq.${NATIVE_SESSION})`);
  });

  it("routes a BACKFILL COPY back to the legacy model that created the sitting", async () => {
    /* The case the whole rule exists for. The view excludes the copy and keeps
       its id as an alias on the legacy row, so asking with the copy's id
       returns the legacy sitting — one source, whichever identity you hold. */
    const { client } = makeClient({
      tables: {
        visible_sittings: [
          {
            origin: "legacy",
            session_id: LEGACY_SESSION,
            alias_session_id: BACKFILL_COPY,
          },
        ],
      },
    });

    expect(await resolveSittingSource(client, BACKFILL_COPY)).toEqual({
      origin: "legacy",
      sessionId: LEGACY_SESSION,
    });
  });

  it("returns null for a session no model claims", async () => {
    const { client } = makeClient({ tables: { visible_sittings: [] } });
    expect(await resolveSittingSource(client, LEGACY_SESSION)).toBeNull();
  });

  it("refuses to interpolate anything that is not a uuid", async () => {
    /* `.or()` takes PostgREST filter SYNTAX, not a bound parameter, so an id
       carrying a comma would otherwise be read as more filter. */
    const { client, queries } = makeClient({ tables: { visible_sittings: [] } });

    expect(await resolveSittingSource(client, "1,alias_session_id.not.is.null")).toBeNull();
    expect(queries).toHaveLength(0);
  });
});

describe("one sitting is never read from both models", () => {
  it("reads a target sitting through the definer RPC and touches no legacy table", async () => {
    const { client, queries, rpcCalls } = makeClient({
      tables: {
        visible_sittings: [
          { origin: "version_pinned", session_id: NATIVE_SESSION, alias_session_id: null },
        ],
      },
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
        visible_sittings: [
          { origin: "legacy", session_id: LEGACY_SESSION, alias_session_id: null },
        ],
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
       change that. */
    const { client, queries } = makeClient({
      tables: {
        visible_sittings: [
          { origin: "legacy", session_id: LEGACY_SESSION, alias_session_id: null },
        ],
        exam_sessions: [],
      },
    });

    await fetchSitting(client, LEGACY_SESSION, "student-1");

    const read = queries.filter((q) => q.table === "exam_sessions").at(-1);
    expect(read?.ops).toContain("eq(student_id,student-1)");
  });

  it("treats 'not yours' from the target RPC as absence, not as a failure", async () => {
    const { client } = makeClient({
      tables: {
        visible_sittings: [
          { origin: "version_pinned", session_id: NATIVE_SESSION, alias_session_id: null },
        ],
      },
      rpc: () => ({ data: null, error: { code: "MM003" } }),
    });

    expect(await fetchSitting(client, NATIVE_SESSION, "student-2")).toEqual({ kind: "none" });
  });
});

describe("history reads the one shared view", () => {
  const legacyRow = {
    origin: "legacy",
    session_id: LEGACY_SESSION,
    student_id: "student-1",
    submitted_at: "2026-08-01T10:00:00.000Z",
    config: { subject: "numeracy", examStyle: "naplan_style", timing: "timed" },
    legacy_result: {
      totalQuestions: 10,
      attemptedQuestions: 10,
      objectivePercentage: 70,
      objectiveMarksAvailable: 10,
      pendingManualMarks: 0,
    },
  };

  const targetRow = {
    origin: "version_pinned",
    session_id: NATIVE_SESSION,
    student_id: "student-1",
    submitted_at: "2026-08-02T10:00:00.000Z",
    config: { subject: "numeracy", examStyle: "naplan_style", timing: "timed" },
    total_items: 10,
    attempted_items: 9,
    objective_percentage: 80,
    objective_available_marks: 10,
    pending_manual_marks: 0,
    legacy_result: null,
  };

  it("asks visible_sittings and nothing else", async () => {
    /* THE step-8 property. The de-duplication is now a predicate inside the
       view, so a consumer that assembled its own union would be a second copy
       of the rule — and the admin views, which are SQL, could not have shared
       it. If this test ever sees a second table, the rule has been forked. */
    const { client, queries } = makeClient({
      tables: { visible_sittings: [legacyRow, targetRow] },
    });

    await fetchSittingHistory(client);

    expect(queries.map((q) => q.table)).toEqual(["visible_sittings"]);
    expect(queries[0]!.ops.join(" ")).toContain("not(submitted_at,is,null)");
  });

  it("keeps both models' sittings in one list, newest first", async () => {
    const { client } = makeClient({
      tables: { visible_sittings: [targetRow, legacyRow] },
    });

    const history = await fetchSittingHistory(client);

    expect(history.map((s) => s.sessionId)).toEqual([NATIVE_SESSION, LEGACY_SESSION]);
  });

  it("produces the same summary shape from either model", async () => {
    const { client } = makeClient({
      tables: { visible_sittings: [legacyRow, targetRow] },
    });

    const history = await fetchSittingHistory(client);

    expect(Object.keys(history[0]!).sort()).toEqual(Object.keys(history[1]!).sort());
    /* And nothing in it names the model. A client that could tell them apart
       could be built to treat them differently. */
    expect(JSON.stringify(history)).not.toMatch(/storageModel|"origin"|version_pinned/);
  });

  it("scopes to a named child when the caller asks about one", async () => {
    const { client, queries } = makeClient({
      tables: { visible_sittings: [legacyRow] },
    });

    await fetchSittingHistory(client, { studentId: "child-9" });

    expect(queries[0]!.ops).toContain("eq(student_id,child-9)");
  });

  it("derives the same numbers from a target row as from the equivalent legacy one", async () => {
    const fromColumns = summarizeAssessmentResult({
      id: "r",
      submitted_at: legacyRow.submitted_at,
      total_items: 10,
      attempted_items: 10,
      objective_percentage: 70,
      objective_available_marks: 10,
      pending_manual_marks: 0,
      legacy_result: null,
      session: { config: legacyRow.config },
    });
    const fromLegacy = summarizeAttempt({
      id: "r",
      submitted_at: legacyRow.submitted_at,
      result: legacyRow.legacy_result,
      session: { config: legacyRow.config },
    });

    expect(fromColumns).toEqual(fromLegacy);
  });

  it("prefers the preserved original for a backfilled result", async () => {
    /* A backfilled row's typed columns are a transcription; the original blob
       is what the learner was actually told (ADR-005 §3). */
    const summary = summarizeAssessmentResult({
      id: "r",
      submitted_at: legacyRow.submitted_at,
      total_items: 0,
      attempted_items: 0,
      objective_percentage: 0,
      objective_available_marks: 0,
      pending_manual_marks: 0,
      legacy_result: legacyRow.legacy_result,
      session: { config: legacyRow.config },
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

describe("resume flags cross back into the client's own identity", () => {
  /* The server stores flags as served-item ids, because that is the identity it
     can verify against the session's ledger (§17.2). The client's contract
     speaks question ids, because that is what it renders. This mapper is the
     one place the two meet, and it holds both halves at once — the paper it has
     just been handed — so there is no second identity in the payload and no
     second lookup. */
  const items = [
    { sessionItemId: "si-1", itemCode: "q-alpha" },
    { sessionItemId: "si-2", itemCode: "q-beta" },
  ];

  it("maps served-item ids to the question ids the client flags by", () => {
    expect(mapFlagsToQuestionIds(["si-2", "si-1"], items)).toEqual(["q-beta", "q-alpha"]);
  });

  it("treats an absent state row as no flags, not as an error", () => {
    /* A sitting nobody has autosaved has no row at all, and the reader returns
       an empty array for it. Undefined arrives the same way if the payload is
       ever read by an older client. */
    expect(mapFlagsToQuestionIds(undefined, items)).toEqual([]);
    expect(mapFlagsToQuestionIds([], items)).toEqual([]);
  });

  it("drops a flag for an item that is not on this paper rather than passing it through", () => {
    /* The write path already refuses a foreign item id, so this is defence in
       depth — but a flag the client cannot match to a question would be a flag
       it renders nowhere and cannot clear. */
    expect(mapFlagsToQuestionIds(["si-1", "si-999"], items)).toEqual(["q-alpha"]);
  });
});
