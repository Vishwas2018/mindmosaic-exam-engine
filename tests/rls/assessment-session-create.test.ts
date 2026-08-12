/**
 * The version-pinned create + serve path
 * (supabase/migrations/20260812120000_assessment_session_create.sql; spec
 * §12.3, §12.4, §17.1, §17.2, §18, §22).
 *
 * The property that separates this path from `create_exam_session` is negative
 * and therefore easy to lose: **there is no parameter through which a caller
 * can influence which items they sit.** Several cases below exist only to keep
 * that true — the paper is selected inside the function, under a seed the
 * function generates, and the ledger is written in the same transaction as the
 * session so a session without pins cannot exist even briefly.
 *
 * Everything runs against a real Postgres through the same harness contract as
 * the other suites here: seed as the unrestricted role, impersonate the way
 * PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, seed, STUDENT_A, STUDENT_B, TEACHER_D } from "./fixtures";

const CONFIG = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 3,
  timing: "timed",
};

/** In scope for CONFIG. Five, so a questionCount of 3 genuinely selects. */
const IN_SCOPE = 5;
/** Out of scope on the subject axis — must never appear in a numeracy paper. */
const OUT_OF_SCOPE = 2;

let client: Client;

function hashOf(label: string): string {
  /* A valid 64-hex content_hash that is stable per label, so a test can assert
     *which* content was pinned rather than merely that something was. */
  return label.padEnd(64, "0").slice(0, 64).replace(/[^0-9a-f]/g, "1");
}

async function seedItem(
  target: Client,
  label: string,
  scope: { year: number; style: string; subject: string },
  options: { revision?: number; itemId?: string; withAnswer?: boolean } = {},
): Promise<{ itemId: string; versionId: string }> {
  const { revision = 1, withAnswer = true } = options;
  let itemId = options.itemId;

  if (itemId === undefined) {
    const item = await target.query<{ id: string }>(
      `insert into public.items (item_code, origin, provenance_class)
       values ($1, 'test_seed', 'curated_git_authored') returning id`,
      [`create-path-${label}`],
    );
    itemId = item.rows[0]!.id;
  }

  const version = await target.query<{ id: string }>(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject)
     values ($1, $2, 'multiple_choice', $3, $4::jsonb, '{"altTextProvided":true}'::jsonb,
             60, 'easy', 1, 1, $5, 'curated_git_authored', now(), $6, $7, $8)
     returning id`,
    [
      itemId,
      revision,
      `Prompt for ${label} r${revision}`,
      JSON.stringify({ options: [{ id: "a", text: "1" }, { id: "b", text: "2" }] }),
      hashOf(`${label}${revision}`),
      scope.year,
      scope.style,
      scope.subject,
    ],
  );
  const versionId = version.rows[0]!.id;

  if (withAnswer) {
    await target.query(
      `insert into public.item_answer_versions (item_version_id, answer_key, private_explanation)
       values ($1, '{"kind":"single_option","optionId":"b"}'::jsonb, $2)`,
      [versionId, `Because ${label} is b.`],
    );
  }

  return { itemId, versionId };
}

async function seedBank(target: Client): Promise<void> {
  for (let index = 0; index < IN_SCOPE; index += 1) {
    await seedItem(target, `num-${index}`, {
      year: 5,
      style: "naplan_style",
      subject: "numeracy",
    });
  }
  for (let index = 0; index < OUT_OF_SCOPE; index += 1) {
    await seedItem(target, `read-${index}`, {
      year: 5,
      style: "naplan_style",
      subject: "reading",
    });
  }
}

/**
 * Drops impersonation for the duration of an assertion or a seed.
 *
 * Necessary rather than convenient: `asAuthenticated` leaves the connection as
 * `authenticated`, and every table these tests verify against is one
 * `authenticated` deliberately cannot read. Without this, a verification query
 * fails with 42501 — which looks like the feature being broken and is in fact
 * the feature working.
 */
async function asOwner(target: Client): Promise<void> {
  await target.query("reset role");
}

/** Turns the §12.7 step 6 cutover switch on for the current transaction. */
async function enableTargetModel(target: Client): Promise<void> {
  await asOwner(target);
  await target.query(
    `update public.platform_flags set enabled = true where key = 'target_session_model'`,
  );
}

async function createSession(
  target: Client,
  config: Record<string, unknown> = CONFIG,
  key = "idem-001",
): Promise<Record<string, unknown>> {
  const result = await target.query<{ body: Record<string, unknown> }>(
    `select public.create_assessment_session($1::jsonb, $2) as body`,
    [JSON.stringify(config), key],
  );
  return result.rows[0]!.body;
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await seedBank(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("the cutover flag is a real switch, not a comment", () => {
  it("refuses to create a session while target_session_model is off", async () => {
    /* The migration ships the flag off. A default that has to be applied by a
       deploy step is not a default. */
    await asAuthenticated(client, STUDENT_A);
    await expect(createSession(client)).rejects.toMatchObject({ code: "MM210" });
  });

  it("is invisible to a signed-in learner", async () => {
    await asAuthenticated(client, STUDENT_A);
    await expect(client.query("select * from public.platform_flags")).rejects.toMatchObject({
      code: "42501",
    });
  });
});

describe("who may create a session", () => {
  beforeEach(async () => {
    await enableTargetModel(client);
  });

  it("refuses an unauthenticated caller", async () => {
    await expect(createSession(client)).rejects.toMatchObject({ code: "MM001" });
  });

  it("refuses a caller who is not a student", async () => {
    await asAuthenticated(client, TEACHER_D);
    await expect(createSession(client)).rejects.toMatchObject({ code: "MM002" });
  });

  it("attributes the session to auth.uid() and to nothing else", async () => {
    /* student_id is not a parameter, so there is no forgery case to test —
       only the positive one that the row belongs to the caller. */
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client);

    await asOwner(client);
    const owner = await client.query<{ student_id: string }>(
      `select student_id from public.assessment_sessions where id = $1`,
      [body.sessionId],
    );
    expect(owner.rows[0]!.student_id).toBe(STUDENT_A);
  });
});

describe("what a created session pins", () => {
  beforeEach(async () => {
    await enableTargetModel(client);
    await asAuthenticated(client, STUDENT_A);
  });

  it("pins every version §12.3 requires and marks the session version-pinned", async () => {
    const body = await createSession(client);
    await asOwner(client);
    const session = await client.query(
      `select assessment_profile_version, framework_version, blueprint_version,
              taxonomy_version, engine_algorithm_version, scoring_algorithm_version,
              content_build_version, content_identity, delivery_mode, status, version, seed
         from public.assessment_sessions where id = $1`,
      [body.sessionId],
    );
    const row = session.rows[0]!;

    for (const column of [
      "assessment_profile_version",
      "framework_version",
      "blueprint_version",
      "taxonomy_version",
      "engine_algorithm_version",
      "scoring_algorithm_version",
      "content_build_version",
    ]) {
      expect(row[column], `${column} must be pinned`).toBeTruthy();
    }
    expect(row.content_identity).toBe("version_pinned");
    expect(row.delivery_mode).toBe("fixed");
    expect(row.status).toBe("created");
    expect(row.version).toBe(1);
    /* Server-chosen. Nothing in the request could have produced this. */
    expect(row.seed).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("writes one ledger row per served item, in order, pinned to an exact version", async () => {
    const body = await createSession(client);
    expect(body.itemCount).toBe(CONFIG.questionCount);

    await asOwner(client);
    const ledger = await client.query<{
      global_ordinal: number;
      stage_number: number;
      within_stage_ordinal: number;
      item_version_id: string;
      content_hash: string;
      allocation_reason: string;
      version_hash: string;
    }>(
      `select si.global_ordinal, si.stage_number, si.within_stage_ordinal,
              si.item_version_id, si.content_hash, si.allocation_reason,
              iv.content_hash as version_hash
         from public.assessment_session_items si
         join public.item_versions iv on iv.id = si.item_version_id
        where si.session_id = $1
        order by si.global_ordinal`,
      [body.sessionId],
    );

    expect(ledger.rows).toHaveLength(CONFIG.questionCount);
    ledger.rows.forEach((row, index) => {
      expect(row.global_ordinal).toBe(index + 1);
      /* Fixed delivery records stage 1 and creates no stage row (§12.6 is
         Phase 4). */
      expect(row.stage_number).toBe(1);
      expect(row.within_stage_ordinal).toBe(index + 1);
      expect(row.allocation_reason).toBe("fixed_blueprint_selection");
      /* The ledger's own copy of the hash must agree with the version it pins.
         They are separate columns on purpose (20260812100000): a replay check
         that read one column twice would prove nothing. */
      expect(row.content_hash).toBe(row.version_hash);
    });
  });

  it("creates no stage row — fixed delivery does not seal stages", async () => {
    const body = await createSession(client);
    await asOwner(client);
    const stages = await client.query(
      `select 1 from public.assessment_session_stages where session_id = $1`,
      [body.sessionId],
    );
    expect(stages.rowCount).toBe(0);
  });

  it("selects only items in the requested scope", async () => {
    /* Ask for more than the in-scope pool holds: if scope were ignored, the
       reading items would make up the difference. */
    const body = await createSession(client, { ...CONFIG, questionCount: 50 });
    expect(body.itemCount).toBe(IN_SCOPE);

    await asOwner(client);
    const subjects = await client.query<{ source_subject: string }>(
      `select distinct iv.source_subject
         from public.assessment_session_items si
         join public.item_versions iv on iv.id = si.item_version_id
        where si.session_id = $1`,
      [body.sessionId],
    );
    expect(subjects.rows.map((row) => row.source_subject)).toEqual(["numeracy"]);
  });

  it("never allocates an item that has no answer version", async () => {
    /* An item that cannot be scored is not eligible content: allocating one
       produces a sitting that can be sat and never marked. */
    await asOwner(client);
    await seedItem(
      client,
      "unanswerable",
      { year: 5, style: "naplan_style", subject: "numeracy" },
      { withAnswer: false },
    );
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client, { ...CONFIG, questionCount: 50 });

    await asOwner(client);
    const unscoreable = await client.query(
      `select 1
         from public.assessment_session_items si
    left join public.item_answer_versions a on a.item_version_id = si.item_version_id
        where si.session_id = $1 and a.id is null`,
      [body.sessionId],
    );
    expect(unscoreable.rowCount).toBe(0);
    expect(body.itemCount).toBe(IN_SCOPE);
  });

  it("serves the current revision of an item and never two revisions of one item", async () => {
    await asOwner(client);
    const extra = await seedItem(client, "extra", {
      year: 5,
      style: "naplan_style",
      subject: "numeracy",
    });
    /* A second revision of an item that already exists. */
    const revised = await seedItem(
      client,
      "extra",
      { year: 5, style: "naplan_style", subject: "numeracy" },
      { itemId: extra.itemId, revision: 2 },
    );

    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client, { ...CONFIG, questionCount: 50 });

    await asOwner(client);
    const served = await client.query<{ item_version_id: string }>(
      `select item_version_id from public.assessment_session_items
        where session_id = $1 and item_id = $2`,
      [body.sessionId, extra.itemId],
    );
    expect(served.rows).toHaveLength(1);
    expect(served.rows[0]!.item_version_id).toBe(revised.versionId);
  });

  it("refuses a scope with no eligible content rather than serving an empty paper", async () => {
    await expect(
      createSession(client, { ...CONFIG, subject: "digital_technologies" }),
    ).rejects.toMatchObject({ code: "MM212" });
  });
});

describe("idempotency (§18)", () => {
  beforeEach(async () => {
    await enableTargetModel(client);
    await asAuthenticated(client, STUDENT_A);
  });

  it("returns the same body and creates no second session when a key is replayed", async () => {
    const first = await createSession(client, CONFIG, "idem-replay");
    const second = await createSession(client, CONFIG, "idem-replay");

    expect(second).toEqual(first);

    await asOwner(client);
    const sessions = await client.query(
      `select 1 from public.assessment_sessions where student_id = $1`,
      [STUDENT_A],
    );
    expect(sessions.rowCount).toBe(1);
  });

  it("fails when the same key is reused with a different request", async () => {
    await createSession(client, CONFIG, "idem-conflict");
    await expect(
      createSession(client, { ...CONFIG, questionCount: 4 }, "idem-conflict"),
    ).rejects.toMatchObject({ code: "MM211" });
  });

  it("scopes keys to the actor, so two students may use the same key", async () => {
    /* The primary key is (actor_id, endpoint, key). One learner's choice of
       idempotency key must not be able to collide with — or replay — another's. */
    const mine = await createSession(client, CONFIG, "shared-key");

    await asAuthenticated(client, STUDENT_B);
    const theirs = await createSession(client, CONFIG, "shared-key");
    expect(theirs.sessionId).not.toBe(mine.sessionId);

    await asOwner(client);
    const owners = await client.query<{ student_id: string }>(
      `select student_id from public.assessment_sessions order by created_at`,
    );
    expect(owners.rows.map((row) => row.student_id).sort()).toEqual(
      [STUDENT_A, STUDENT_B].sort(),
    );
  });

  it("creates a different session for a different key", async () => {
    const first = await createSession(client, CONFIG, "key-one");
    const second = await createSession(client, CONFIG, "key-two");
    expect(second.sessionId).not.toBe(first.sessionId);
  });
});

describe("serving the candidate allocation (§17.1, §18)", () => {
  let sessionId: string;

  beforeEach(async () => {
    await enableTargetModel(client);
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client);
    sessionId = body.sessionId as string;
  });

  it("returns the served items in order to the student who owns them", async () => {
    const result = await client.query<{ body: { items: { ordinal: number }[] } }>(
      `select public.get_assessment_session($1) as body`,
      [sessionId],
    );
    const items = result.rows[0]!.body.items;
    expect(items).toHaveLength(CONFIG.questionCount);
    expect(items.map((item) => item.ordinal)).toEqual([1, 2, 3]);
  });

  it("omits every answer-bearing field, structurally", async () => {
    /* §18: candidate DTOs MUST structurally omit private answer and explanation
       fields. Asserted over the serialised body rather than field by field, so
       a field added to item_versions later is caught by the same test. The
       explanation seeded into item_answer_versions is the tripwire: it is real
       text that exists in the database for exactly these items. */
    const result = await client.query<{ body: unknown }>(
      `select public.get_assessment_session($1) as body`,
      [sessionId],
    );
    const serialised = JSON.stringify(result.rows[0]!.body);

    expect(serialised).not.toMatch(/answerKey|answer_key/i);
    expect(serialised).not.toMatch(/privateExplanation|private_explanation/i);
    expect(serialised).not.toMatch(/gradingRules|grading_rules/i);
    expect(serialised).not.toMatch(/rubric/i);
    expect(serialised).not.toContain("Because ");
    expect(serialised).not.toMatch(/single_option/);
  });

  it("refuses a session belonging to another student", async () => {
    await asAuthenticated(client, STUDENT_B);
    await expect(
      client.query(`select public.get_assessment_session($1) as body`, [sessionId]),
    ).rejects.toMatchObject({ code: "MM003" });
  });

  it("keeps working when the cutover flag is switched back off", async () => {
    /* §12.7: rollback routes *new* sessions back to the legacy model; sessions
       already created on the target model complete here. A read that switched
       off with the flag would strand exactly those sittings. */
    await asOwner(client);
    await client.query(
      `update public.platform_flags set enabled = false where key = 'target_session_model'`,
    );
    await asAuthenticated(client, STUDENT_A);
    const result = await client.query<{ body: { items: unknown[] } }>(
      `select public.get_assessment_session($1) as body`,
      [sessionId],
    );
    expect(result.rows[0]!.body.items).toHaveLength(CONFIG.questionCount);
  });

  it("is the only way a learner reaches the ledger", async () => {
    /* The function exists because assessment_session_items has no learner
       privileges. If that changed, this suite would keep passing for the wrong
       reason. */
    await expect(
      client.query("select * from public.assessment_session_items"),
    ).rejects.toMatchObject({ code: "42501" });
  });
});

describe("version pinning survives a later revision (§22)", () => {
  it("keeps pointing at the revision that was served", async () => {
    await enableTargetModel(client);
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client, { ...CONFIG, questionCount: 50 });

    await asOwner(client);
    const before = await client.query<{ item_id: string; item_version_id: string }>(
      `select item_id, item_version_id from public.assessment_session_items
        where session_id = $1 order by global_ordinal`,
      [body.sessionId],
    );

    /* Publish a new revision of every item the session served. */
    for (const [index, row] of before.rows.entries()) {
      await seedItem(
        client,
        `revised-${index}`,
        { year: 5, style: "naplan_style", subject: "numeracy" },
        { itemId: row.item_id, revision: 2 },
      );
    }

    const after = await client.query<{ item_id: string; item_version_id: string }>(
      `select item_id, item_version_id from public.assessment_session_items
        where session_id = $1 order by global_ordinal`,
      [body.sessionId],
    );
    expect(after.rows).toEqual(before.rows);
  });
});
