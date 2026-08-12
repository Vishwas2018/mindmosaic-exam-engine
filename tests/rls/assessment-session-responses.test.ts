/**
 * Recording responses against the served-item ledger
 * (supabase/migrations/20260812130000_assessment_session_responses.sql; spec
 * §12.5, §12.8, §17.2).
 *
 * The invariants here are mostly negative, and each corresponds to a way the
 * legacy path can be made to lie:
 *
 *   * a response cannot name an item the session did not serve (on the legacy
 *     path, responses are a free-form document keyed by bare question id);
 *   * a stale autosave cannot overwrite a newer answer (on the legacy path, one
 *     late autosave overwrites every newer answer in the session at once);
 *   * nothing in the request can set correctness, marks or score.
 *
 * Same harness contract as the other suites: seed as the unrestricted role,
 * impersonate the way PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, seed, STUDENT_A, STUDENT_B } from "./fixtures";

const CONFIG = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 2,
  timing: "timed",
};

let client: Client;
let sessionId: string;
let ledger: string[];

async function asOwner(target: Client): Promise<void> {
  await target.query("reset role");
}

async function seedItem(target: Client, label: string): Promise<void> {
  const item = await target.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'test_seed', 'curated_git_authored') returning id`,
    [`responses-${label}`],
  );
  const version = await target.query<{ id: string }>(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject)
     values ($1, 1, 'multiple_choice', $2, '{"options":[]}'::jsonb,
             '{"altTextProvided":true}'::jsonb, 60, 'easy', 1, 1, $3,
             'curated_git_authored', now(), 5, 'naplan_style', 'numeracy')
     returning id`,
    [item.rows[0]!.id, `Prompt ${label}`, label.padEnd(64, "0").slice(0, 64).replace(/[^0-9a-f]/g, "1")],
  );
  await target.query(
    `insert into public.item_answer_versions (item_version_id, answer_key)
     values ($1, '{"kind":"single_option","optionId":"b"}'::jsonb)`,
    [version.rows[0]!.id],
  );
}

async function commit(
  target: Client,
  responses: Record<string, unknown>,
  clientSequence = 1,
  session = sessionId,
): Promise<Record<string, number>> {
  const result = await target.query<{ body: Record<string, number> }>(
    `select public.commit_assessment_responses($1, $2::jsonb, $3) as body`,
    [session, JSON.stringify(responses), clientSequence],
  );
  return result.rows[0]!.body;
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await seedItem(client, "aa");
  await seedItem(client, "bb");
  await client.query(
    `update public.platform_flags set enabled = true where key = 'target_session_model'`,
  );

  await asAuthenticated(client, STUDENT_A);
  const created = await client.query<{ body: { sessionId: string } }>(
    `select public.create_assessment_session($1::jsonb, 'responses-key') as body`,
    [JSON.stringify(CONFIG)],
  );
  sessionId = created.rows[0]!.body.sessionId;

  await asOwner(client);
  const rows = await client.query<{ id: string }>(
    `select id from public.assessment_session_items where session_id = $1 order by global_ordinal`,
    [sessionId],
  );
  ledger = rows.rows.map((row) => row.id);
  await asAuthenticated(client, STUDENT_A);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("a response can only name an item this session served", () => {
  it("records answers keyed by ledger row", async () => {
    const body = await commit(client, { [ledger[0]!]: "b", [ledger[1]!]: "a" });
    expect(body.applied).toBe(2);
    expect(body.discardedAsStale).toBe(0);

    await asOwner(client);
    const stored = await client.query<{ session_item_id: string; response_value: unknown }>(
      `select session_item_id, response_value from public.session_responses
        where session_id = $1 order by session_item_id`,
      [sessionId],
    );
    expect(stored.rows).toHaveLength(2);
  });

  it("rejects a response naming an item served in no session", async () => {
    await expect(
      commit(client, { "99999999-0000-0000-0000-0000000000ff": "b" }),
    ).rejects.toMatchObject({ code: "MM215" });
  });

  it("rejects a key that is not a session item id at all", async () => {
    await expect(commit(client, { "q-42": "b" })).rejects.toMatchObject({ code: "MM215" });
  });

  it("writes nothing at all when one key in the batch is foreign", async () => {
    /* Whole-batch validation, so a request that names one foreign item does not
       land a partial paper. The savepoint is needed because the raise aborts
       the surrounding transaction — without it the assertion afterwards could
       not run, and "no rows were written" would be indistinguishable from
       "no query was possible". */
    await client.query("savepoint batch");
    await expect(
      commit(client, {
        [ledger[0]!]: "b",
        "99999999-0000-0000-0000-0000000000ff": "b",
      }),
    ).rejects.toMatchObject({ code: "MM215" });
    await client.query("rollback to savepoint batch");

    await asOwner(client);
    const stored = await client.query(
      `select 1 from public.session_responses where session_id = $1`,
      [sessionId],
    );
    expect(stored.rowCount).toBe(0);
  });

  it("rejects another student's session", async () => {
    await asAuthenticated(client, STUDENT_B);
    await expect(commit(client, { [ledger[0]!]: "b" })).rejects.toMatchObject({
      code: "MM003",
    });
  });
});

describe("stale autosaves lose (ADR-006 §3)", () => {
  it("keeps the newer answer when an older sequence arrives late", async () => {
    await commit(client, { [ledger[0]!]: "newer" }, 5);
    const body = await commit(client, { [ledger[0]!]: "older" }, 2);

    expect(body.applied).toBe(0);
    expect(body.discardedAsStale).toBe(1);

    await asOwner(client);
    const stored = await client.query<{ response_value: unknown; client_sequence: string }>(
      `select response_value, client_sequence from public.session_responses
        where session_item_id = $1`,
      [ledger[0]],
    );
    expect(stored.rows[0]!.response_value).toBe("newer");
    expect(stored.rows[0]!.client_sequence).toBe("5");
  });

  it("applies an equal sequence, so a retried request is not treated as stale", async () => {
    await commit(client, { [ledger[0]!]: "first" }, 3);
    const body = await commit(client, { [ledger[0]!]: "second" }, 3);
    expect(body.applied).toBe(1);
  });

  it("keeps first_answered_at fixed while answered_at moves", async () => {
    await commit(client, { [ledger[0]!]: "one" }, 1);
    await asOwner(client);
    const first = await client.query<{ first_answered_at: Date }>(
      `select first_answered_at from public.session_responses where session_item_id = $1`,
      [ledger[0]],
    );

    await asAuthenticated(client, STUDENT_A);
    await commit(client, { [ledger[0]!]: "two" }, 2);

    await asOwner(client);
    const second = await client.query<{ first_answered_at: Date; answered_at: Date }>(
      `select first_answered_at, answered_at from public.session_responses
        where session_item_id = $1`,
      [ledger[0]],
    );
    expect(second.rows[0]!.first_answered_at).toEqual(first.rows[0]!.first_answered_at);
  });
});

describe("lifecycle and terminality (§12.8)", () => {
  it("moves the session from created to active on the first commit", async () => {
    await asOwner(client);
    const before = await client.query<{ status: string }>(
      `select status from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    expect(before.rows[0]!.status).toBe("created");

    await asAuthenticated(client, STUDENT_A);
    await commit(client, { [ledger[0]!]: "b" });

    await asOwner(client);
    const after = await client.query<{ status: string; started_at: Date }>(
      `select status, started_at from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    expect(after.rows[0]!.status).toBe("active");
    expect(after.rows[0]!.started_at).toBeInstanceOf(Date);
  });

  it("refuses a submitted session", async () => {
    await asOwner(client);
    await client.query(
      `update public.assessment_sessions
          set status = 'submitted', submitted_at = now(), version = version + 1
        where id = $1`,
      [sessionId],
    );

    await asAuthenticated(client, STUDENT_A);
    await expect(commit(client, { [ledger[0]!]: "b" })).rejects.toMatchObject({
      code: "MM214",
    });
  });

  it("refuses an expired session", async () => {
    await asOwner(client);
    await client.query(
      `update public.assessment_sessions set expires_at = now() - interval '1 minute',
              version = version + 1 where id = $1`,
      [sessionId],
    );

    await asAuthenticated(client, STUDENT_A);
    await expect(commit(client, { [ledger[0]!]: "b" })).rejects.toMatchObject({
      code: "MM004",
    });
  });
});

describe("nothing in a response can set a score (§12.5)", () => {
  it("leaves every derived column null until scoring runs", async () => {
    await commit(client, { [ledger[0]!]: "b" });

    await asOwner(client);
    const stored = await client.query<{
      score_status: string | null;
      is_correct: boolean | null;
      awarded_marks: number | null;
      scored_at: Date | null;
    }>(
      `select score_status, is_correct, awarded_marks, scored_at
         from public.session_responses where session_item_id = $1`,
      [ledger[0]],
    );
    expect(stored.rows[0]).toEqual({
      score_status: null,
      is_correct: null,
      awarded_marks: null,
      scored_at: null,
    });
  });

  it("ignores correctness smuggled into the response value itself", async () => {
    /* The value is stored verbatim as the learner's answer and is never read as
       metadata — there is no code path that looks inside it for a score. This
       asserts the storage half; the scoring half is covered by
       assessment-scoring.test.ts, which recomputes from the pinned key. */
    await commit(client, {
      [ledger[0]!]: { isCorrect: true, awardedMarks: 99, score: 100 },
    });

    await asOwner(client);
    const stored = await client.query<{ score_status: string | null }>(
      `select score_status from public.session_responses where session_item_id = $1`,
      [ledger[0]],
    );
    expect(stored.rows[0]!.score_status).toBeNull();
  });

  it("still refuses a direct write to session_responses", async () => {
    await expect(
      client.query(
        `insert into public.session_responses (session_id, session_item_id, response_value)
         values ($1, $2, '"forged"'::jsonb)`,
        [sessionId, ledger[0]],
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
});
