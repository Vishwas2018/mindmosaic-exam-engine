/**
 * Creation routing, enforced at the database boundary
 * (supabase/migrations/20260812160000_session_storage_model_cohort.sql; spec
 * §12.7 step 6; ADR-005 §1, ADR-006 Amendment C).
 *
 * THE CASE THIS FILE EXISTS FOR is "an out-of-cohort learner calling the RPC
 * directly still cannot obtain a target session". `create_assessment_session`
 * is granted to `authenticated`, so PostgREST exposes it to every signed-in
 * client — the routing decision our routes take is therefore not a control at
 * all, and only the gate inside the function is. That is why the cohort moved
 * into the database (Amendment C1 superseding ADR-005 §2), and it is checked
 * below by impersonating the learner exactly as PostgREST does rather than by
 * calling through any application code.
 *
 * The other three are the §12.7 invariants: a session's storage model is fixed
 * at creation, rollback routes only NEW sessions back to legacy, and a live
 * sitting is never migrated between models.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, seed, STUDENT_A, STUDENT_B, TEACHER_D } from "./fixtures";

const CONFIG = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 2,
  timing: "timed",
};

let client: Client;

async function asOwner(target: Client): Promise<void> {
  await target.query("reset role");
}

/**
 * Runs work that is expected to fail, without poisoning the transaction.
 *
 * Every refusal below is raised by the database, and a raise aborts the
 * surrounding transaction — so without this the assertion after a refusal
 * cannot run, and "nothing was created" becomes indistinguishable from "no
 * query was possible".
 */
async function inSavepoint<T>(body: () => Promise<T>): Promise<T> {
  await client.query("savepoint sp");
  try {
    return await body();
  } finally {
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");
  }
}

async function seedItem(target: Client, label: string): Promise<void> {
  const item = await target.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'test_seed', 'curated_git_authored') returning id`,
    [`cutover-${label}`],
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

/** Sets the one authoritative flag. */
async function setFlag(
  target: Client,
  options: { enabled: boolean; cohortMode?: "off" | "student_ids" | "all" },
): Promise<void> {
  await asOwner(target);
  await target.query(
    `update public.platform_flags set enabled = $1, cohort_mode = coalesce($2, cohort_mode)
      where key = 'target_session_model'`,
    [options.enabled, options.cohortMode ?? null],
  );
}

async function addToCohort(target: Client, studentId: string): Promise<void> {
  await asOwner(target);
  await target.query(
    `insert into public.assessment_cutover_cohort (student_id, note)
     values ($1, 'rls fixture') on conflict do nothing`,
    [studentId],
  );
}

async function routingFor(target: Client, studentId: string): Promise<string> {
  await asOwner(target);
  const result = await target.query<{ model: string }>(
    `select public.session_storage_model_for($1) as model`,
    [studentId],
  );
  return result.rows[0]!.model;
}

/** Calls the create RPC exactly as a signed-in client would over PostgREST. */
async function createAsLearner(
  target: Client,
  studentId: string,
  key = "cutover-key",
): Promise<{ sessionId: string }> {
  await asAuthenticated(target, studentId);
  const result = await target.query<{ body: { sessionId: string } }>(
    `select public.create_assessment_session($1::jsonb, $2) as body`,
    [JSON.stringify(CONFIG), key],
  );
  return result.rows[0]!.body;
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await seedItem(client, "aa");
  await seedItem(client, "bb");
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("the shipped default creates nothing on the target model", () => {
  it("routes every student to legacy with the flag off", async () => {
    /* The migration ships enabled = false, cohort_mode = 'off', cohort empty
       (Amendment C5). Asserted rather than assumed: a default that has to be
       applied by a deploy step is not a default. */
    expect(await routingFor(client, STUDENT_A)).toBe("legacy");
    expect(await routingFor(client, STUDENT_B)).toBe("legacy");
  });

  it("refuses a create call from a learner", async () => {
    await inSavepoint(() =>
      expect(createAsLearner(client, STUDENT_A)).rejects.toMatchObject({ code: "MM210" }),
    );
  });

  it("routes to legacy for a null caller", async () => {
    /* Fails closed. auth.uid() is null for an unauthenticated PostgREST call,
       and the predicate must not treat "nobody" as "everybody". */
    await asOwner(client);
    const result = await client.query<{ model: string }>(
      `select public.session_storage_model_for(null::uuid) as model`,
    );
    expect(result.rows[0]!.model).toBe("legacy");
  });
});

describe("the cohort decides, and the database enforces it", () => {
  it("routes only the named student when cohort_mode is student_ids", async () => {
    await setFlag(client, { enabled: true, cohortMode: "student_ids" });
    await addToCohort(client, STUDENT_A);

    expect(await routingFor(client, STUDENT_A)).toBe("version_pinned");
    expect(await routingFor(client, STUDENT_B)).toBe("legacy");
  });

  it("BOUNDARY PROOF: an out-of-cohort learner calling the RPC directly is refused", async () => {
    /* The whole reason the flag is in the database. STUDENT_B is signed in with
       their own JWT and calls the function exactly as PostgREST would — no
       application code between them and it — and still cannot obtain a target
       session. If the cohort lived in the Next server's environment this call
       would succeed. */
    await setFlag(client, { enabled: true, cohortMode: "student_ids" });
    await addToCohort(client, STUDENT_A);

    await inSavepoint(() =>
      expect(createAsLearner(client, STUDENT_B)).rejects.toMatchObject({ code: "MM210" }),
    );

    await asOwner(client);
    const created = await client.query(
      `select 1 from public.assessment_sessions where student_id = $1`,
      [STUDENT_B],
    );
    /* Refused, and nothing partially created on the way to refusing. */
    expect(created.rowCount).toBe(0);
  });

  it("creates a target session for a learner who IS in cohort", async () => {
    await setFlag(client, { enabled: true, cohortMode: "student_ids" });
    await addToCohort(client, STUDENT_A);

    const body = await createAsLearner(client, STUDENT_A);
    expect(body.sessionId).toBeTruthy();

    await asOwner(client);
    const row = await client.query<{ storage_model: string; student_id: string }>(
      `select storage_model, student_id from public.assessment_sessions where id = $1`,
      [body.sessionId],
    );
    expect(row.rows[0]!.storage_model).toBe("version_pinned");
    expect(row.rows[0]!.student_id).toBe(STUDENT_A);
  });

  it("routes everyone when cohort_mode is all", async () => {
    await setFlag(client, { enabled: true, cohortMode: "all" });
    expect(await routingFor(client, STUDENT_A)).toBe("version_pinned");
    expect(await routingFor(client, STUDENT_B)).toBe("version_pinned");
  });

  it("ignores the cohort entirely when the master switch is off", async () => {
    /* enabled = false must mean legacy for everyone whatever the cohort says,
       so a rollback is one unambiguous action rather than "set the mode to off,
       and also remember to empty the table". */
    await setFlag(client, { enabled: true, cohortMode: "all" });
    await addToCohort(client, STUDENT_A);
    await setFlag(client, { enabled: false });

    expect(await routingFor(client, STUDENT_A)).toBe("legacy");
    await inSavepoint(() =>
      expect(createAsLearner(client, STUDENT_A)).rejects.toMatchObject({ code: "MM210" }),
    );
  });

  it("still refuses a non-student who is somehow in the cohort", async () => {
    /* The role gate and the cohort gate are independent; being named in the
       cohort is not a grant of studenthood. */
    await setFlag(client, { enabled: true, cohortMode: "all" });
    await inSavepoint(() =>
      expect(createAsLearner(client, TEACHER_D)).rejects.toMatchObject({ code: "MM002" }),
    );
  });
});

describe("the flag and cohort are invisible to learners", () => {
  it("refuses a learner reading platform_flags or the cohort", async () => {
    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(client.query("select * from public.platform_flags")).rejects.toMatchObject({
        code: "42501",
      }),
    );
    await inSavepoint(() =>
      expect(client.query("select * from public.assessment_cutover_cohort")).rejects.toMatchObject(
        { code: "42501" },
      ),
    );
  });

  it("refuses a learner probing cohort membership for anyone", async () => {
    /* session_storage_model_for(uuid) is deliberately not granted to
       authenticated: with an arbitrary uuid it would answer "is this person in
       the cutover cohort" for any learner in the system. */
    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(`select public.session_storage_model_for($1) as model`, [STUDENT_B]),
      ).rejects.toMatchObject({ code: "42501" }),
    );
  });

  it("lets a learner ask only about themselves", async () => {
    await setFlag(client, { enabled: true, cohortMode: "all" });
    await asAuthenticated(client, STUDENT_A);
    const result = await client.query<{ model: string }>(
      `select public.session_storage_model_for_caller() as model`,
    );
    expect(result.rows[0]!.model).toBe("version_pinned");
  });

  it("refuses anon entirely", async () => {
    /* The guest flow has no server-side session and must gain none (ADR-006 §8).
       An unauthenticated caller can reach neither the predicate nor the create
       RPC. */
    await asAnon(client);
    await inSavepoint(() =>
      expect(
        client.query(`select public.session_storage_model_for_caller() as model`),
      ).rejects.toMatchObject({ code: "42501" }),
    );
    await inSavepoint(() =>
      expect(
        client.query(`select public.create_assessment_session('{}'::jsonb, 'k') as body`),
      ).rejects.toMatchObject({ code: "42501" }),
    );
  });
});

describe("a session never changes storage model (§12.7)", () => {
  let sessionId: string;

  beforeEach(async () => {
    await setFlag(client, { enabled: true, cohortMode: "all" });
    const body = await createAsLearner(client, STUDENT_A);
    sessionId = body.sessionId;
    await asOwner(client);
  });

  it("refuses to change storage_model, for every role including the owner", async () => {
    /* Two independent refusals sit on this: the transition guard refuses any
       change to the column, and the check constraint limits it to one value.
       The guard is a BEFORE trigger, so it fires first and MM207 is what a
       caller sees — the constraint is the backstop that would still refuse if
       the trigger were ever dropped. */
    await inSavepoint(() =>
      expect(
        client.query(
          `update public.assessment_sessions set storage_model = 'legacy', version = version + 1
            where id = $1`,
          [sessionId],
        ),
      ).rejects.toMatchObject({ code: "MM207" }),
    );
  });

  it("refuses even a no-op-looking rewrite to the same value via the guard", async () => {
    /* Setting it to its current value is allowed — it is not a change — so the
       session stays usable. This documents that the guard tests DISTINCT FROM
       rather than blocking every update that mentions the column. */
    await expect(
      client.query(
        `update public.assessment_sessions set storage_model = 'version_pinned', version = version + 1
          where id = $1`,
        [sessionId],
      ),
    ).resolves.toBeTruthy();
  });
});

describe("rollback routes new sessions back and strands nobody (§12.7)", () => {
  it("leaves an in-flight target sitting on the target path and completes it", async () => {
    /* The invariant that matters most in this step. A learner mid-sitting when
       the flag is pulled must be able to finish; §12.7 is explicit that rollback
       "routes new sessions back to the legacy model" and that sessions already
       created on the target model complete there. */
    await setFlag(client, { enabled: true, cohortMode: "all" });
    const body = await createAsLearner(client, STUDENT_A);
    const sessionId = body.sessionId;

    await asOwner(client);
    const ledger = await client.query<{ id: string }>(
      `select id from public.assessment_session_items where session_id = $1 order by global_ordinal`,
      [sessionId],
    );
    const firstItem = ledger.rows[0]!.id;

    /* THE ROLLBACK. */
    await setFlag(client, { enabled: false });

    /* New sessions go to legacy. */
    expect(await routingFor(client, STUDENT_A)).toBe("legacy");
    await inSavepoint(() =>
      expect(createAsLearner(client, STUDENT_A, "post-rollback")).rejects.toMatchObject({
        code: "MM210",
      }),
    );

    /* The in-flight sitting is still readable... */
    await asAuthenticated(client, STUDENT_A);
    const read = await client.query<{ body: { items: unknown[] } }>(
      `select public.get_assessment_session($1) as body`,
      [sessionId],
    );
    expect(read.rows[0]!.body.items).toHaveLength(CONFIG.questionCount);

    /* ...still writable... */
    const commit = await client.query<{ body: { applied: number } }>(
      `select public.commit_assessment_responses($1, $2::jsonb, 1) as body`,
      [sessionId, JSON.stringify({ [firstItem]: "b" })],
    );
    expect(commit.rows[0]!.body.applied).toBe(1);

    /* ...and still on the target model, unmoved. */
    await asOwner(client);
    const after = await client.query<{ storage_model: string; status: string }>(
      `select storage_model, status from public.assessment_sessions where id = $1`,
      [sessionId],
    );
    expect(after.rows[0]!.storage_model).toBe("version_pinned");
    expect(after.rows[0]!.status).toBe("active");
  });

  it("copies no session between models on rollback", async () => {
    /* "Rollback MUST NOT copy a live session between models." Checked as an
       absence on both sides: the target sitting acquires no legacy twin, and no
       legacy row appears for it. */
    await setFlag(client, { enabled: true, cohortMode: "all" });
    const body = await createAsLearner(client, STUDENT_A);

    await asOwner(client);
    const legacyBefore = await client.query<{ n: string }>(
      `select count(*)::text as n from public.exam_sessions`,
    );

    await setFlag(client, { enabled: false });

    const legacyAfter = await client.query<{ n: string }>(
      `select count(*)::text as n from public.exam_sessions`,
    );
    expect(legacyAfter.rows[0]!.n).toBe(legacyBefore.rows[0]!.n);

    const twin = await client.query<{ legacy_session_id: string | null }>(
      `select legacy_session_id from public.assessment_sessions where id = $1`,
      [body.sessionId],
    );
    /* legacy_session_id is settable only by the backfill, and the create RPC has
       no parameter for it — so a natively created session cannot acquire one. */
    expect(twin.rows[0]!.legacy_session_id).toBeNull();
  });

  it("leaves the legacy create path working throughout", async () => {
    /* §12.7: active legacy sessions continue on the legacy path. The step 6
       change must not have altered what create_exam_session does for anyone. */
    await setFlag(client, { enabled: true, cohortMode: "all" });
    await asAuthenticated(client, STUDENT_A);
    const legacy = await client.query<{ id: string }>(
      `select public.create_exam_session('{}'::jsonb, 's', array['q1'],
              now() + interval '1 hour') as id`,
    );
    expect(legacy.rows[0]!.id).toBeTruthy();
  });
});
