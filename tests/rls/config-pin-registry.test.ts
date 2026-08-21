/**
 * Coverage for supabase/migrations/20260822100000_config_pin_registry.sql
 * (Gate A item A15, docs/phase2-cutover-readiness-checklist.md; ADR-006 §1;
 * spec §5.5, §12.3, §22).
 *
 * A15 closed the ADR-006 §1-compliant way: content-address the six
 * placeholder pin TEXT VALUES `create_assessment_session` and the legacy
 * backfill already write, rather than building the deferred Phase 3
 * framework_versions/blueprint_versions/assessment_profile_versions tables
 * (see the migration's own header, and OVERNIGHT-RUN-REPORT.md's Task 2
 * write-up, for why building those now would be a different, undecided
 * product change). This file proves the §22-style obligations the task
 * named: a session's pins resolve to the same immutable row across reads; a
 * pin row cannot be mutated in place; an unregistered pin is refused, not
 * merely conventionally avoided; and both existing write paths (native
 * create, legacy backfill) still work unmodified.
 *
 * Same harness contract as the other suites here: seed as the unrestricted
 * role, impersonate the way PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, seed, SESSION_A, STUDENT_A } from "./fixtures";

const CONFIG = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 1,
  timing: "timed",
};

const SEEDED_PAIRS: ReadonlyArray<{ kind: string; value: string }> = [
  { kind: "assessment_profile_version", value: "phase2-fixed-profile.v1" },
  { kind: "assessment_profile_version", value: "legacy:unpinned" },
  { kind: "framework_version", value: "phase2-fixed-framework.v1" },
  { kind: "framework_version", value: "legacy:unpinned" },
  { kind: "blueprint_version", value: "phase2-unblueprinted.v1" },
  { kind: "blueprint_version", value: "legacy:unpinned" },
  { kind: "taxonomy_version", value: "phase2-untaxonomised.v1" },
  { kind: "taxonomy_version", value: "legacy:unpinned" },
  { kind: "engine_algorithm_version", value: "fixed_scope_seeded.v1" },
  { kind: "engine_algorithm_version", value: "legacy:unpinned" },
  { kind: "scoring_algorithm_version", value: "question-scorers.v1" },
  { kind: "scoring_algorithm_version", value: "legacy:exam-engine" },
];

let client: Client;

function hashOf(label: string): string {
  return label.padEnd(64, "0").slice(0, 64).replace(/[^0-9a-f]/g, "1");
}

async function asOwner(target: Client): Promise<void> {
  await target.query("reset role");
}

async function enableTargetModel(target: Client): Promise<void> {
  await asOwner(target);
  await target.query(
    `update public.platform_flags set enabled = true, cohort_mode = 'all'
      where key = 'target_session_model'`,
  );
}

async function seedItem(target: Client, label: string): Promise<void> {
  const item = await target.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'test_seed', 'curated_git_authored') returning id`,
    [`config-pin-${label}`],
  );
  const version = await target.query<{ id: string }>(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic)
     values ($1, 1, 'multiple_choice', $2, $3::jsonb, '{"altTextProvided":true}'::jsonb,
             60, 'easy', 1, 1, $4, 'curated_git_authored', now(), 5, 'naplan_style', 'numeracy',
             'single_option', 'number', 'addition')
     returning id`,
    [
      item.rows[0]!.id,
      `Prompt ${label}`,
      JSON.stringify({ options: [{ id: "a", text: "1" }, { id: "b", text: "2" }] }),
      hashOf(label),
    ],
  );
  await target.query(
    `insert into public.item_answer_versions (item_version_id, answer_key, private_explanation)
     values ($1, '{"kind":"single_option","optionId":"b"}'::jsonb, $2)`,
    [version.rows[0]!.id, `Because ${label} is b.`],
  );
}

async function createSession(target: Client, key: string): Promise<Record<string, unknown>> {
  const result = await target.query<{ body: Record<string, unknown> }>(
    `select public.create_assessment_session($1::jsonb, $2) as body`,
    [JSON.stringify(CONFIG), key],
  );
  return result.rows[0]!.body;
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("config_pin_registry is the closed, content-addressed set", () => {
  it("holds exactly the 12 (kind, value) pairs the session model writes -- no more, no fewer", async () => {
    const rows = await client.query<{ pin_kind: string; pin_value: string }>(
      `select pin_kind, pin_value from public.config_pin_registry`,
    );
    const actual = new Set(rows.rows.map((r) => `${r.pin_kind}:${r.pin_value}`));
    const expected = new Set(SEEDED_PAIRS.map((p) => `${p.kind}:${p.value}`));
    expect(actual).toEqual(expected);
  });

  it("every row's content_hash is a sha256 of its own (kind, value, payload) -- recomputing it independently agrees", async () => {
    const rows = await client.query<{ pin_kind: string; pin_value: string; payload: unknown; content_hash: string }>(
      `select pin_kind, pin_value, payload, content_hash from public.config_pin_registry`,
    );
    for (const row of rows.rows) {
      const recomputed = await client.query<{ h: string }>(
        `select encode(sha256(convert_to($1 || ':' || $2 || ':' || $3::jsonb::text, 'UTF8')), 'hex') as h`,
        [row.pin_kind, row.pin_value, JSON.stringify(row.payload)],
      );
      expect(recomputed.rows[0]!.h).toBe(row.content_hash);
    }
  });

  it("refuses a row whose content_hash does not match its own (kind, value, payload) -- forging an identity means forging a preimage", async () => {
    await expect(
      client.query(
        `insert into public.config_pin_registry (content_hash, pin_kind, pin_value)
         values (repeat('a', 64), 'framework_version', 'phase2-fixed-framework.v1')`,
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("is immutable: an UPDATE is refused for every role, including the unrestricted owner connection", async () => {
    await expect(
      client.query(
        `update public.config_pin_registry set payload = '{"x":1}'::jsonb
          where pin_kind = 'framework_version' and pin_value = 'phase2-fixed-framework.v1'`,
      ),
    ).rejects.toMatchObject({ code: "MM230" });
  });

  it("grants anon and authenticated no privilege at all", async () => {
    const result = await client.query<{ grantee: string }>(
      `select grantee from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'config_pin_registry'
          and grantee in ('anon', 'authenticated')`,
    );
    expect(result.rows).toEqual([]);
  });

  it("has RLS enabled and is unreadable to a signed-in learner", async () => {
    const rls = await client.query<{ relrowsecurity: boolean }>(
      `select relrowsecurity from pg_class where oid = 'public.config_pin_registry'::regclass`,
    );
    expect(rls.rows[0]!.relrowsecurity).toBe(true);

    await asAuthenticated(client, STUDENT_A);
    await expect(client.query(`select 1 from public.config_pin_registry limit 1`)).rejects.toMatchObject({
      code: "42501",
    });
  });
});

describe("assessment_sessions can only pin a KNOWN, immutable config identity", () => {
  beforeEach(async () => {
    await enableTargetModel(client);
    await seedItem(client, "numeracy-1");
  });

  it("a created session's pins resolve to the single matching registry row, identically across two independent reads", async () => {
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client, "idem-pin-resolve");
    await asOwner(client);

    const readOnce = async () =>
      client.query<{ content_hash: string }>(
        `select r.content_hash
           from public.assessment_sessions s
           join public.config_pin_registry r
             on r.pin_kind = 'scoring_algorithm_version' and r.pin_value = s.scoring_algorithm_version
          where s.id = $1`,
        [body.sessionId],
      );

    const first = await readOnce();
    const second = await readOnce();
    expect(first.rows).toHaveLength(1);
    expect(second.rows).toHaveLength(1);
    expect(second.rows[0]!.content_hash).toBe(first.rows[0]!.content_hash);
  });

  it("two sessions created under the same phase-2 config pin the identical registry row -- identity is shared, not duplicated per session", async () => {
    await seedItem(client, "numeracy-2");
    await asAuthenticated(client, STUDENT_A);
    const first = await createSession(client, "idem-pin-shared-1");
    const second = await createSession(client, "idem-pin-shared-2");
    await asOwner(client);

    const rows = await client.query<{ session_id: string; content_hash: string }>(
      `select s.id as session_id, r.content_hash
         from public.assessment_sessions s
         join public.config_pin_registry r
           on r.pin_kind = 'framework_version' and r.pin_value = s.framework_version
        where s.id = any($1::uuid[])`,
      [[first.sessionId, second.sessionId]],
    );
    expect(rows.rows).toHaveLength(2);
    expect(rows.rows[0]!.content_hash).toBe(rows.rows[1]!.content_hash);

    const distinctRegistryRows = await client.query(
      `select count(*) as n from public.config_pin_registry where pin_kind = 'framework_version'`,
    );
    /* Exactly the two seeded framework_version identities (phase2-fixed and
       legacy:unpinned) -- not one row per session. */
    expect(Number(distinctRegistryRows.rows[0]!.n)).toBe(2);
  });

  it("a direct write with an unregistered pin value is refused by the foreign key, not merely avoided by convention", async () => {
    await asOwner(client);
    await expect(
      client.query(
        `insert into public.assessment_sessions
           (student_id, assessment_profile_version, framework_version, blueprint_version,
            taxonomy_version, engine_algorithm_version, scoring_algorithm_version,
            content_build_version, seed, config, expires_at)
         values
           ($1, 'phase2-fixed-profile.v1', 'not-a-registered-pin', 'phase2-unblueprinted.v1',
            'phase2-untaxonomised.v1', 'fixed_scope_seeded.v1', 'question-scorers.v1',
            'irrelevant', 'forged-seed', '{}'::jsonb, now() + interval '1 hour')`,
        [STUDENT_A],
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });

  it("replay: create_assessment_session is unmodified by the registry -- a native session still creates and pins the phase-2 identities", async () => {
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client, "idem-pin-replay");
    expect(body.itemCount).toBe(1);

    await asOwner(client);
    const row = await client.query(
      `select assessment_profile_version, framework_version, blueprint_version,
              taxonomy_version, engine_algorithm_version, scoring_algorithm_version
         from public.assessment_sessions where id = $1`,
      [body.sessionId],
    );
    expect(row.rows[0]).toMatchObject({
      assessment_profile_version: "phase2-fixed-profile.v1",
      framework_version: "phase2-fixed-framework.v1",
      blueprint_version: "phase2-unblueprinted.v1",
      taxonomy_version: "phase2-untaxonomised.v1",
      engine_algorithm_version: "fixed_scope_seeded.v1",
      scoring_algorithm_version: "question-scorers.v1",
    });
  });

  it("replay: the legacy backfill is unmodified by the registry -- it still runs and pins the legacy identity", async () => {
    await asOwner(client);
    /* SESSION_A already has an exam_attempts row from the shared fixture
       (tests/rls/fixtures.ts), so it qualifies for the backfill without any
       further seeding. */
    await client.query(`select public.backfill_legacy_terminal_sessions()`);

    const row = await client.query(
      `select assessment_profile_version, framework_version, blueprint_version,
              taxonomy_version, engine_algorithm_version, scoring_algorithm_version
         from public.assessment_sessions where legacy_session_id = $1`,
      [SESSION_A],
    );
    expect(row.rows).toHaveLength(1);
    expect(row.rows[0]).toMatchObject({
      assessment_profile_version: "legacy:unpinned",
      framework_version: "legacy:unpinned",
      blueprint_version: "legacy:unpinned",
      taxonomy_version: "legacy:unpinned",
      engine_algorithm_version: "legacy:unpinned",
      scoring_algorithm_version: "legacy:exam-engine",
    });
  });
});
