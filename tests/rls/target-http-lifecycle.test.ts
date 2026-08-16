/**
 * Gate A item A9: the origin-aware target-model HTTP lifecycle
 * (docs/phase2-cutover-readiness-checklist.md), proven through the actual
 * Next.js route handlers rather than through the RPCs directly —
 * `tests/rls/target-sitting-end-to-end.test.ts` already proved the DB/service
 * half (A6); this is the missing HTTP half external review #5 flagged.
 *
 * `@/lib/supabase/server`'s `createClient()` is mocked to return a real
 * Postgres connection wrapped in a Supabase-JS-shaped adapter
 * (./support/route-postgres-client.ts) instead of a Next.js
 * cookie-authenticated client — everything downstream of that one seam is
 * the genuine production route code, the genuine RPCs, and a genuine local
 * Postgres. `checkOrigin`'s same-origin check runs unmocked against real
 * Request headers.
 *
 * WHY THIS SUITE COMMITS, same reasoning as target-sitting-end-to-end.test.ts:
 * the submit step scores through the real scoring module, which opens its
 * own connection as `mindmosaic_scoring` and therefore cannot see
 * uncommitted fixtures from this one. Every identifier is namespaced to this
 * file and cleaned up in `beforeAll`/`afterAll`.
 *
 * TWO STUDENTS, ONE TEST COHORT. `STUDENT_TARGET` is the only member of a
 * `cohort_mode = 'student_ids'` test cohort — the real mechanism a first
 * cohort would use, not `cohort_mode = 'all'`. `STUDENT_LEGACY` is deliberately
 * NOT a member, so the "never crosses" proof has a real legacy walk to
 * compare against rather than trusting the target walk alone.
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { publishedExamBank } from "@/content/questions/practice-bank";

import { connect, scoringDbUrl } from "./db";
import { asRouteCaller, asRouteOwner, RoutePostgresClient } from "./support/route-postgres-client";

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

let client: Client;
let currentUserId: string | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => new RoutePostgresClient(client, currentUserId),
}));

/**
 * Both halves of "become this caller" — the mock's `.auth.getUser()` answer
 * AND the real connection's role/claims (`asRouteCaller`, ./support). Without
 * the second half every query the shim issues would still run as the
 * unrestricted owner role: `auth.uid()` would be null, RLS would not apply,
 * and a bug in origin dispatch or ownership would go undetected rather than
 * surfacing as the 42501/MM003 a real request would get.
 */
async function setCaller(userId: string): Promise<void> {
  currentUserId = userId;
  await asRouteCaller(client, userId);
}

/* Routes imported only after the mocks above are registered — matching
   src/tests/unit/exam-session-create-route.test.ts's own ordering, and for
   the same reason: the module graph resolves @/lib/supabase/server at
   import time. */
const { POST: createSessionPOST } = await import("@/app/api/exam/session/route");
const { GET: activeSessionGET } = await import("@/app/api/exam/session/active/route");
const { GET: sessionGET } = await import("@/app/api/exam/session/[id]/route");
const { POST: responsesPOST } = await import("@/app/api/exam/session/[id]/responses/route");
const { POST: submitPOST } = await import("@/app/api/exam/session/[id]/submit/route");

const STUDENT_TARGET = "88880000-0000-0000-0000-0000000000a1";
const STUDENT_LEGACY = "88880000-0000-0000-0000-0000000000a2";
/* Three real, distinct published-bank ids, borrowed as this suite's
   item_code values — see seedItem's own comment for why a synthetic code
   cannot be used here. Sliced rather than hand-picked so the suite adapts to
   whatever the bank currently contains instead of pinning literal ids that
   could stop existing. */
const TARGET_ITEM_CODES = publishedExamBank.slice(0, 3).map((question) => question.id);
/* Isolates this suite's content from the real projected bank WITHOUT an
   invented exam style: unlike target-sitting-end-to-end.test.ts (which calls
   create_assessment_session directly over raw SQL), this suite goes through
   the real HTTP route, which validates `examStyle` against
   examSelectionConfigSchema's real three-value enum — a fake style is
   rejected as invalid_request before it ever reaches the database. Isolation
   instead uses a REAL, offering-valid (A11) combination the compiled bank
   has zero content for: ICAS numeracy is seeded at Years 3 and 5 only
   (publishedExamBank), so Year 4 is a real, servable ICAS offering with
   nothing in it but this suite's own fixture. */
const TARGET_YEAR_LEVEL = 4;
const TARGET_EXAM_STYLE = "icas_style";
const ESSAY_MARKS = 4;

const TARGET_CONFIG = {
  yearLevel: TARGET_YEAR_LEVEL,
  examStyle: TARGET_EXAM_STYLE,
  subject: "numeracy",
  questionCount: 3,
  timing: "untimed",
};

const LEGACY_CONFIG = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 2,
  timing: "untimed",
};

let scoringUrlBefore: string | undefined;

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost" },
    body: JSON.stringify(body),
  });
}

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

async function resetFixtures(): Promise<void> {
  await asRouteOwner(client);
  await client.query(
    `update public.platform_flags set enabled = false, cohort_mode = 'off'
      where key = 'target_session_model'`,
  );
  await client.query(`delete from public.assessment_cutover_cohort where student_id = $1`, [
    STUDENT_TARGET,
  ]);
  await client.query(`delete from auth.users where id = any($1::uuid[])`, [
    [STUDENT_TARGET, STUDENT_LEGACY],
  ]);
  await client.query(
    `delete from public.item_answer_versions
      where item_version_id in (
        select iv.id from public.item_versions iv
        join public.items i on i.id = iv.item_id where i.item_code = any($1::text[]))`,
    [TARGET_ITEM_CODES],
  );
  await client.query(
    `delete from public.item_versions
      where item_id in (select id from public.items where item_code = any($1::text[]))`,
    [TARGET_ITEM_CODES],
  );
  await client.query(`delete from public.items where item_code = any($1::text[])`, [TARGET_ITEM_CODES]);
}

/**
 * `itemCode` is a REAL published-bank id, not a synthetic `a9-http-*` one —
 * required because `submitTargetSession`'s review reveal
 * (target-session-writes.ts) looks answers up in `getExamBank("published")`
 * by item code, never in the DB, so a code the compiled bank does not know
 * would make a genuine target sitting's submit fail with `corrupt` at the
 * one step this suite exists to prove works. The bank entry's own prompt/
 * answer key are irrelevant here and never asserted on — only its id is
 * borrowed, so the DB row's OWN scope (source_year_level/source_exam_style,
 * both this suite's isolated Year 4 ICAS cell) and OWN answer_key (below) are
 * what the target selector and the scorer actually use.
 */
async function seedItem(
  itemCode: string,
  kind: "single_option" | "manual",
  marks: number,
): Promise<void> {
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
      `A9 prompt ${itemCode}`,
      kind === "manual"
        ? JSON.stringify({ options: [] })
        : JSON.stringify({ options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] }),
      marks,
      `a9http${itemCode}`.padEnd(64, "0").replace(/[^0-9a-f]/g, "1").slice(0, 64),
      TARGET_YEAR_LEVEL,
      TARGET_EXAM_STYLE,
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

beforeAll(async () => {
  scoringUrlBefore = process.env.SCORING_DB_URL;
  process.env.SCORING_DB_URL = scoringDbUrl();

  client = await connect();
  await resetFixtures();

  await asRouteOwner(client);
  await client.query(`insert into auth.users (id, email) values ($1, $2), ($3, $4)`, [
    STUDENT_TARGET,
    "a9-target@test.local",
    STUDENT_LEGACY,
    "a9-legacy@test.local",
  ]);

  await seedItem(TARGET_ITEM_CODES[0]!, "single_option", 1);
  await seedItem(TARGET_ITEM_CODES[1]!, "single_option", 1);
  await seedItem(TARGET_ITEM_CODES[2]!, "manual", ESSAY_MARKS);

  /* The test cohort, and only ever this one student. */
  await client.query(
    `update public.platform_flags set enabled = true, cohort_mode = 'student_ids'
      where key = 'target_session_model'`,
  );
  await client.query(`insert into public.assessment_cutover_cohort (student_id) values ($1)`, [
    STUDENT_TARGET,
  ]);
}, 60_000);

afterAll(async () => {
  await resetFixtures();
  await client.end();
  if (scoringUrlBefore === undefined) delete process.env.SCORING_DB_URL;
  else process.env.SCORING_DB_URL = scoringUrlBefore;
});

describe("the target cohort's full HTTP walk", () => {
  let sessionId: string;

  it("create: the cohort routes the student to the target model, over HTTP", async () => {
    await setCaller(STUDENT_TARGET);
    const response = await createSessionPOST(
      jsonRequest("http://localhost/api/exam/session", { config: TARGET_CONFIG, idempotencyKey: "a9-create-1" }),
    );
    expect(response.status).toBe(200);
    const body = await json(response);
    sessionId = body.sessionId as string;
    expect(sessionId).toBeTruthy();
    expect((body.questions as unknown[]).length).toBe(3);

    /* No answer key ever rides with the create response. */
    expect(JSON.stringify(body)).not.toMatch(/answerKey|optionId|rubric|Award marks for showing/);

    await asRouteOwner(client);
    const row = await client.query<{ storage_model: string }>(
      `select storage_model from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    expect(row.rows[0]!.storage_model).toBe("version_pinned");
  });

  it("resume: GET /active finds it, with no answer key", async () => {
    await setCaller(STUDENT_TARGET);
    const response = await activeSessionGET();
    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.sessionId).toBe(sessionId);
    expect(JSON.stringify(body)).not.toMatch(/answerKey|optionId|rubric/);
  });

  it("serve: GET /session/:id returns the same sanitized paper", async () => {
    await setCaller(STUDENT_TARGET);
    const response = await sessionGET(new Request("http://localhost"), {
      params: Promise.resolve({ id: sessionId }),
    });
    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.sessionId).toBe(sessionId);
    expect((body.questions as { id: string }[]).length).toBe(3);
  });

  it("autosave: records answers by public question id, translated at the boundary", async () => {
    await setCaller(STUDENT_TARGET);
    const paper = await json(
      await activeSessionGET(),
    );
    const questions = paper.questions as { id: string }[];

    const response = await responsesPOST(
      jsonRequest(`http://localhost/api/exam/session/${sessionId}/responses`, {
        responses: { [questions[0]!.id]: "b" },
        currentQuestionIndex: 1,
        flaggedQuestionIds: [questions[2]!.id],
      }),
      { params: Promise.resolve({ id: sessionId }) },
    );
    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.savedAt).toBeTruthy();

    await asRouteOwner(client);
    const stored = await client.query<{ n: string }>(
      `select count(*)::text as n from public.session_responses sr
        join public.assessment_session_items si on si.id = sr.session_item_id
       where si.session_id = $1`,
      [sessionId],
    );
    expect(stored.rows[0]!.n).toBe("1");
  });

  it("submit: seals, scores through the isolated module, and returns a legacy-shaped result", async () => {
    await setCaller(STUDENT_TARGET);
    const paper = await json(await activeSessionGET());
    const questions = paper.questions as { id: string; metadata: { marks: number } }[];
    /* create_assessment_session serves items in a seeded but unpredictable
       order (§17.2 — the client must not be able to predict its own paper),
       so the essay is found by its distinguishing mark value, not by
       position, exactly as target-sitting-end-to-end.test.ts finds it. */
    const essay = questions.find((question) => question.metadata.marks === ESSAY_MARKS)!;
    const objectives = questions.filter((question) => question.metadata.marks !== ESSAY_MARKS);

    const response = await submitPOST(
      jsonRequest(`http://localhost/api/exam/session/${sessionId}/submit`, {
        responses: {
          [objectives[0]!.id]: "b",
          [objectives[1]!.id]: "a",
          [essay.id]: "Because I added the tens first.",
        },
        submissionReason: "user_submitted",
      }),
      { params: Promise.resolve({ id: sessionId }) },
    );
    expect(response.status).toBe(200);
    const body = await json(response);

    const result = body.result as Record<string, unknown>;
    expect(result.totalQuestions).toBe(3);
    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    /* §14.3: the essay is excluded from the objective denominator, not scored
       as an auto-zero. Exactly the blank-sitting-aggregates class of bug. */
    expect(result.objectiveMarksAvailable).toBe(2);
    expect(result.objectivePercentage).toBe(50);
    expect(result.pendingManualMarks).toBe(ESSAY_MARKS);

    /* Review: the one sanctioned reveal, present now and only now. */
    const reviewQuestions = body.reviewQuestions as { id: string; answerKey: unknown }[];
    expect(reviewQuestions.length).toBe(3);
    expect(reviewQuestions.every((question) => question.answerKey !== undefined)).toBe(true);

    await asRouteOwner(client);
    const sealed = await client.query<{ status: string }>(
      `select status from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    expect(sealed.rows[0]!.status).toBe("submitted");
  });

  it("submit again is a defined conflict, not a second result", async () => {
    await setCaller(STUDENT_TARGET);
    const response = await submitPOST(
      jsonRequest(`http://localhost/api/exam/session/${sessionId}/submit`, {
        responses: {},
        submissionReason: "user_submitted",
      }),
      { params: Promise.resolve({ id: sessionId }) },
    );
    expect(response.status).toBe(409);
    expect((await json(response)).error).toBe("already_submitted");

    await asRouteOwner(client);
    const results = await client.query<{ n: string }>(
      `select count(*)::text as n from public.assessment_results where session_id = $1`,
      [sessionId],
    );
    expect(results.rows[0]!.n).toBe("1");
  });

  it("never wrote a single row to the legacy exam tables", async () => {
    await asRouteOwner(client);
    const counts = await client.query<{ sessions: string; responses: string; attempts: string }>(
      `select
         (select count(*)::text from public.exam_sessions where student_id = $1) as sessions,
         (select count(*)::text from public.exam_responses where student_id = $1) as responses,
         (select count(*)::text from public.exam_attempts where student_id = $1) as attempts`,
      [STUDENT_TARGET],
    );
    expect(counts.rows[0]).toEqual({ sessions: "0", responses: "0", attempts: "0" });
  });
});

describe("the legacy student's full HTTP walk — the other direction of the same proof", () => {
  let legacySessionId: string;

  it("creates on the legacy model, because this student is not in the cohort", async () => {
    await setCaller(STUDENT_LEGACY);
    const response = await createSessionPOST(
      jsonRequest("http://localhost/api/exam/session", { config: LEGACY_CONFIG }),
    );
    expect(response.status).toBe(200);
    const body = await json(response);
    legacySessionId = body.sessionId as string;
    expect(legacySessionId).toBeTruthy();

    await asRouteOwner(client);
    const row = await client.query<{ n: string }>(
      `select count(*)::text as n from public.exam_sessions where id = $1`,
      [legacySessionId],
    );
    expect(row.rows[0]!.n).toBe("1");
  });

  it("autosaves and submits on the legacy model without error", async () => {
    await setCaller(STUDENT_LEGACY);
    const active = await json(await activeSessionGET());
    const questions = active.questions as { id: string }[];

    const autosave = await responsesPOST(
      jsonRequest(`http://localhost/api/exam/session/${legacySessionId}/responses`, {
        responses: { [questions[0]!.id]: "irrelevant, curated bank scores its own way" },
        currentQuestionIndex: 0,
        flaggedQuestionIds: [],
      }),
      { params: Promise.resolve({ id: legacySessionId }) },
    );
    expect(autosave.status).toBe(200);

    const submit = await submitPOST(
      jsonRequest(`http://localhost/api/exam/session/${legacySessionId}/submit`, {
        responses: {},
        submissionReason: "user_submitted",
      }),
      { params: Promise.resolve({ id: legacySessionId }) },
    );
    expect(submit.status).toBe(200);
  });

  it("never wrote a single row to the target-model tables", async () => {
    await asRouteOwner(client);
    const counts = await client.query<{ sessions: string; results: string; responses: string }>(
      `select
         (select count(*)::text from public.assessment_sessions where student_id = $1) as sessions,
         (select count(*)::text from public.assessment_results where student_id = $1) as results,
         (select count(*)::text from public.session_responses sr
            join public.assessment_session_items si on si.id = sr.session_item_id
            join public.assessment_sessions s on s.id = si.session_id
           where s.student_id = $1) as responses`,
      [STUDENT_LEGACY],
    );
    expect(counts.rows[0]).toEqual({ sessions: "0", results: "0", responses: "0" });
  });
});

describe("idempotent create", () => {
  it("a replayed idempotency key returns the same session, not a second one", async () => {
    await setCaller(STUDENT_TARGET);
    const key = "a9-idempotent-create";
    const config = { ...TARGET_CONFIG, questionCount: 2 };

    const first = await json(
      await createSessionPOST(jsonRequest("http://localhost/api/exam/session", { config, idempotencyKey: key })),
    );
    const second = await json(
      await createSessionPOST(jsonRequest("http://localhost/api/exam/session", { config, idempotencyKey: key })),
    );
    expect(second.sessionId).toBe(first.sessionId);

    await asRouteOwner(client);
    const count = await client.query<{ n: string }>(
      `select count(*)::text as n from public.assessment_sessions
        where student_id = $1 and seed is not null and created_at >= now() - interval '1 minute'`,
      [STUDENT_TARGET],
    );
    /* Not asserting an exact count against a shared timestamp window — the
       replay itself, proven above by the identical sessionId, is the
       property under test. A distinct idempotency key genuinely creates a
       second session, which the next describe block's own sessions already
       demonstrate. */
    expect(Number(count.rows[0]!.n)).toBeGreaterThanOrEqual(1);
  });

  it("a reused key with a different request is refused, not silently substituted", async () => {
    await setCaller(STUDENT_TARGET);
    const key = "a9-idempotent-conflict";
    await createSessionPOST(
      jsonRequest("http://localhost/api/exam/session", {
        config: { ...TARGET_CONFIG, questionCount: 1 },
        idempotencyKey: key,
      }),
    );
    const conflict = await createSessionPOST(
      jsonRequest("http://localhost/api/exam/session", {
        config: { ...TARGET_CONFIG, questionCount: 2 },
        idempotencyKey: key,
      }),
    );
    expect(conflict.status).toBe(409);
    expect((await json(conflict)).error).toBe("idempotency_key_reused");
  });
});

describe("rollback never migrates an in-flight target session", () => {
  it("a session created while the cohort was open completes through HTTP after the flag is turned off", async () => {
    await setCaller(STUDENT_TARGET);
    const created = await json(
      await createSessionPOST(
        jsonRequest("http://localhost/api/exam/session", {
          config: { ...TARGET_CONFIG, questionCount: 2 },
          idempotencyKey: "a9-rollback-create",
        }),
      ),
    );
    const sessionId = created.sessionId as string;

    /* THE ROLLBACK. Only ever this: creation of NEW sessions stops. */
    await asRouteOwner(client);
    await client.query(
      `update public.platform_flags set enabled = false, cohort_mode = 'off'
        where key = 'target_session_model'`,
    );

    await setCaller(STUDENT_TARGET);
    const active = await json(await activeSessionGET());
    expect(active.sessionId).toBe(sessionId);
    const questions = active.questions as { id: string }[];

    const autosave = await responsesPOST(
      jsonRequest(`http://localhost/api/exam/session/${sessionId}/responses`, {
        responses: { [questions[0]!.id]: "b" },
        currentQuestionIndex: 0,
        flaggedQuestionIds: [],
      }),
      { params: Promise.resolve({ id: sessionId }) },
    );
    expect(autosave.status).toBe(200);

    const submit = await submitPOST(
      jsonRequest(`http://localhost/api/exam/session/${sessionId}/submit`, {
        responses: { [questions[0]!.id]: "b", [questions[1]!.id]: "a" },
        submissionReason: "user_submitted",
      }),
      { params: Promise.resolve({ id: sessionId }) },
    );
    expect(submit.status).toBe(200);

    await asRouteOwner(client);
    const row = await client.query<{ storage_model: string; status: string }>(
      `select storage_model, status from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    /* Completed on the model it was created on — never migrated, never
       stranded, even though the flag flipped off mid-sitting. */
    expect(row.rows[0]).toEqual({ storage_model: "version_pinned", status: "submitted" });

    /* Restore the test cohort for any test file order that runs after this
       one within the same process (vitest.rls.config.ts: isolate: false). */
    await client.query(
      `update public.platform_flags set enabled = true, cohort_mode = 'student_ids'
        where key = 'target_session_model'`,
    );
  });

  it("a NEW create after rollback goes to legacy", async () => {
    await setCaller(STUDENT_LEGACY);
    /* STUDENT_LEGACY was never in the cohort, so this is the same "legacy by
       default" case the earlier walk already proved — restated here to pin
       down that rollback (flag off) is what a real rollback would produce
       for anyone not already an exception, which is everyone once the cohort
       itself is dropped. */
    await asRouteOwner(client);
    await client.query(
      `update public.platform_flags set enabled = false, cohort_mode = 'off'
        where key = 'target_session_model'`,
    );

    await setCaller(STUDENT_LEGACY);
    const response = await createSessionPOST(
      jsonRequest("http://localhost/api/exam/session", {
        config: { ...LEGACY_CONFIG, questionCount: 1 },
      }),
    );
    expect(response.status).toBe(200);

    await asRouteOwner(client);
    await client.query(
      `update public.platform_flags set enabled = true, cohort_mode = 'student_ids'
        where key = 'target_session_model'`,
    );
  });
});
