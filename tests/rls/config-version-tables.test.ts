/**
 * Coverage for the Phase 3 step 1 config-version migrations (spec
 * §10.1-§10.3, §12.3, §22; ADR-004 accepted, option 1):
 *
 *   - 20260823090000_config_version_tables.sql (schema)
 *   - 20260823100000_config_version_seed_phase2_fixed.sql (seed)
 *   - 20260823110000_assessment_session_profile_version_pin.sql (session pin)
 *
 * Proves, in order: the four tables are read-appropriate (RLS on, zero
 * anon/authenticated privilege) and immutable for every role including the
 * owner; the seed is exactly what it claims (one framework, one blueprint +
 * profile per active programme_offering, each internally consistent); the
 * cross-table consistency trigger on assessment_profile_versions actually
 * refuses a mismatched framework/blueprint pairing rather than trusting the
 * caller; a native session resolves and pins the real profile version for a
 * concrete offering, and leaves the pin null (never a guess) for a request
 * that does not resolve to exactly one; and the §22 replay proof itself —
 * a config version superseded AFTER a session pins it does not move the
 * session's own read.
 *
 * Same harness contract as the other suites here: seed as the unrestricted
 * role, impersonate the way PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, seed, STUDENT_A } from "./fixtures";

let client: Client;

const CONFIG_VERSION_TABLES = [
  "framework_versions",
  "blueprint_versions",
  "blueprint_cells",
  "assessment_profile_versions",
] as const;

function hashOf(label: string): string {
  return label.padEnd(64, "0").slice(0, 64).replace(/[^0-9a-f]/g, "1");
}

async function asOwner(target: Client): Promise<void> {
  await target.query("reset role");
}

/** Runs `body` inside a savepoint, so an expected error cannot poison the rest of the transaction. */
async function inSavepoint(body: () => Promise<void>): Promise<void> {
  await client.query("savepoint sp");
  try {
    await body();
  } finally {
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");
  }
}

async function enableTargetModel(target: Client): Promise<void> {
  await asOwner(target);
  await target.query(
    `update public.platform_flags set enabled = true, cohort_mode = 'all'
      where key = 'target_session_model'`,
  );
}

async function seedItem(
  target: Client,
  label: string,
  scope: { yearLevel: number; examStyle: string; subject: string },
): Promise<void> {
  const item = await target.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'test_seed', 'curated_git_authored') returning id`,
    [`config-version-${label}`],
  );
  const version = await target.query<{ id: string }>(
    `insert into public.item_versions
       (item_id, revision, question_type, prompt, candidate_content, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available,
        content_schema_version, content_hash, provenance_class, published_at,
        source_year_level, source_exam_style, source_subject,
        answer_kind, source_strand, source_topic)
     values ($1, 1, 'multiple_choice', $2, $3::jsonb, '{"altTextProvided":true}'::jsonb,
             60, 'easy', 1, 1, $4, 'curated_git_authored', now(), $5, $6, $7,
             'single_option', 'number', 'addition')
     returning id`,
    [
      item.rows[0]!.id,
      `Prompt ${label}`,
      JSON.stringify({ options: [{ id: "a", text: "1" }, { id: "b", text: "2" }] }),
      hashOf(label),
      scope.yearLevel,
      scope.examStyle,
      scope.subject,
    ],
  );
  await target.query(
    `insert into public.item_answer_versions (item_version_id, answer_key, private_explanation)
     values ($1, '{"kind":"single_option","optionId":"b"}'::jsonb, $2)`,
    [version.rows[0]!.id, `Because ${label} is b.`],
  );
}

async function createSession(target: Client, config: Record<string, unknown>, key: string): Promise<Record<string, unknown>> {
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
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("config-version tables are read-appropriate and immutable", () => {
  it("all four tables have RLS enabled and zero anon/authenticated privilege", async () => {
    for (const table of CONFIG_VERSION_TABLES) {
      const rls = await client.query<{ relrowsecurity: boolean }>(
        `select relrowsecurity from pg_class where oid = $1::regclass`,
        [`public.${table}`],
      );
      expect(rls.rows[0]!.relrowsecurity, `${table} RLS`).toBe(true);

      const grants = await client.query<{ grantee: string }>(
        `select grantee from information_schema.role_table_grants
          where table_schema = 'public' and table_name = $1
            and grantee in ('anon', 'authenticated')`,
        [table],
      );
      expect(grants.rows, `${table} grants`).toEqual([]);
    }
  });

  it("a signed-in learner cannot read any of the four tables directly", async () => {
    await asAuthenticated(client, STUDENT_A);
    for (const table of CONFIG_VERSION_TABLES) {
      await inSavepoint(async () => {
        await expect(client.query(`select 1 from public.${table} limit 1`)).rejects.toMatchObject({
          code: "42501",
        });
      });
    }
  });

  it("every table refuses an UPDATE for every role, including the unrestricted owner connection", async () => {
    const fw = await client.query(`select id from public.framework_versions limit 1`);
    await inSavepoint(async () => {
      await expect(
        client.query(`update public.framework_versions set label = 'x' where id = $1`, [fw.rows[0]!.id]),
      ).rejects.toMatchObject({ code: "MM240" });
    });

    const bv = await client.query(`select id from public.blueprint_versions limit 1`);
    await inSavepoint(async () => {
      await expect(
        client.query(`update public.blueprint_versions set label = 'x' where id = $1`, [bv.rows[0]!.id]),
      ).rejects.toMatchObject({ code: "MM240" });
    });

    const bc = await client.query(`select id from public.blueprint_cells limit 1`);
    await inSavepoint(async () => {
      await expect(
        client.query(`update public.blueprint_cells set marks = 999 where id = $1`, [bc.rows[0]!.id]),
      ).rejects.toMatchObject({ code: "MM240" });
    });

    const apv = await client.query(`select id from public.assessment_profile_versions limit 1`);
    await inSavepoint(async () => {
      await expect(
        client.query(`update public.assessment_profile_versions set availability = 'withdrawn' where id = $1`, [
          apv.rows[0]!.id,
        ]),
      ).rejects.toMatchObject({ code: "MM240" });
    });
  });
});

describe("the seeded Phase-2-fixed configuration is exactly what it claims", () => {
  it("holds exactly one framework_version, describing fixed-path single-stage delivery", async () => {
    const rows = await client.query<{ framework_id: string; revision: number; delivery_mode: string; config: Record<string, unknown> }>(
      `select framework_id, revision, delivery_mode, config from public.framework_versions`,
    );
    expect(rows.rows).toHaveLength(1);
    const framework = rows.rows[0]!;
    expect(framework).toMatchObject({ framework_id: "phase2-fixed-framework", revision: 1, delivery_mode: "fixed_path" });
    expect(framework.config).toMatchObject({
      stages: [{ stageId: "main", ordinal: 0, label: "Main assessment", sealOnComplete: false }],
    });
    expect((framework.config as Record<string, unknown>).adaptiveRouting).toBeUndefined();
  });

  it("holds one blueprint_version and one whole-pool cell per active programme_offering", async () => {
    const offeringCount = await client.query<{ n: string }>(
      `select count(*) as n from public.programme_offerings where active`,
    );
    const blueprintCount = await client.query<{ n: string }>(`select count(*) as n from public.blueprint_versions`);
    const cellCount = await client.query<{ n: string }>(`select count(*) as n from public.blueprint_cells`);
    const profileCount = await client.query<{ n: string }>(`select count(*) as n from public.assessment_profile_versions`);

    expect(Number(blueprintCount.rows[0]!.n)).toBe(Number(offeringCount.rows[0]!.n));
    expect(Number(cellCount.rows[0]!.n)).toBe(Number(offeringCount.rows[0]!.n));
    expect(Number(profileCount.rows[0]!.n)).toBe(Number(offeringCount.rows[0]!.n));

    const cell = await client.query(
      `select bc.proportion, bc.item_count, bc.stage_id, bc.subject_id
         from public.blueprint_cells bc
         join public.blueprint_versions bv on bv.id = bc.blueprint_version_id
        where bv.blueprint_id = 'phase2-whole-pool.naplan_style_practice.numeracy.y5'`,
    );
    expect(cell.rows).toEqual([{ proportion: "1", item_count: null, stage_id: "main", subject_id: "numeracy" }]);
  });

  it("every seeded assessment_profile_version resolves to a distinct offering, and vice versa", async () => {
    const rows = await client.query<{ n: string }>(
      `select count(distinct programme_offering_id) as n from public.assessment_profile_versions`,
    );
    const total = await client.query<{ n: string }>(`select count(*) as n from public.assessment_profile_versions`);
    expect(rows.rows[0]!.n).toBe(total.rows[0]!.n);
  });
});

describe("assessment_profile_versions enforces cross-table consistency at insert time", () => {
  it("refuses a profile whose delivery_mode disagrees with its framework's", async () => {
    const seeded = await client.query(
      `select framework_version_id, blueprint_version_id, programme_offering_id
         from public.assessment_profile_versions limit 1`,
    );
    const { framework_version_id, blueprint_version_id } = seeded.rows[0]!;

    const secondOffering = await client.query(
      `select id from public.programme_offerings where id <> $1 limit 1`,
      [seeded.rows[0]!.programme_offering_id],
    );

    await expect(
      client.query(
        `insert into public.assessment_profile_versions
           (profile_id, revision, label, programme_offering_id, framework_version_id, blueprint_version_id,
            delivery_mode, scoring_algorithm_id, scoring_algorithm_version)
         values ('test-mismatch-mode', 1, 'x', $1, $2, $3, 'adaptive_mst', 'question-scorers', 1)`,
        [secondOffering.rows[0]!.id, framework_version_id, blueprint_version_id],
      ),
    ).rejects.toMatchObject({ code: "MM241" });
  });

  it("refuses a profile whose scoring algorithm disagrees with its framework's", async () => {
    const seeded = await client.query(
      `select framework_version_id, blueprint_version_id, programme_offering_id
         from public.assessment_profile_versions limit 1`,
    );
    const secondOffering = await client.query(
      `select id from public.programme_offerings where id <> $1 limit 1`,
      [seeded.rows[0]!.programme_offering_id],
    );

    await expect(
      client.query(
        `insert into public.assessment_profile_versions
           (profile_id, revision, label, programme_offering_id, framework_version_id, blueprint_version_id,
            delivery_mode, scoring_algorithm_id, scoring_algorithm_version)
         values ('test-mismatch-scoring', 1, 'x', $1, $2, $3, 'fixed_path', 'a-different-scorer', 1)`,
        [secondOffering.rows[0]!.id, seeded.rows[0]!.framework_version_id, seeded.rows[0]!.blueprint_version_id],
      ),
    ).rejects.toMatchObject({ code: "MM242" });
  });

  it("refuses a profile whose blueprint references a stage the framework does not declare", async () => {
    const seeded = await client.query(
      `select framework_version_id, programme_offering_id from public.assessment_profile_versions limit 1`,
    );
    const secondOffering = await client.query(
      `select id from public.programme_offerings where id <> $1 limit 1`,
      [seeded.rows[0]!.programme_offering_id],
    );

    const badBlueprint = await client.query<{ id: string }>(
      `insert into public.blueprint_versions (blueprint_id, revision, label, total_items, total_marks)
       values ('test-mismatch-stage', 1, 'x', 1, 1) returning id`,
    );
    await client.query(
      `insert into public.blueprint_cells
         (blueprint_version_id, cell_id, stage_id, subject_id, proportion, marks, estimated_time_seconds)
       values ($1, 'only-cell', 'no-such-stage', 'numeracy', 1, 1, 60)`,
      [badBlueprint.rows[0]!.id],
    );

    await expect(
      client.query(
        `insert into public.assessment_profile_versions
           (profile_id, revision, label, programme_offering_id, framework_version_id, blueprint_version_id,
            delivery_mode, scoring_algorithm_id, scoring_algorithm_version)
         values ('test-mismatch-stage', 1, 'x', $1, $2, $3, 'fixed_path', 'question-scorers', 1)`,
        [secondOffering.rows[0]!.id, seeded.rows[0]!.framework_version_id, badBlueprint.rows[0]!.id],
      ),
    ).rejects.toMatchObject({ code: "MM243" });
  });

  it("refuses a second non-withdrawn profile for the same offering", async () => {
    const seeded = await client.query(
      `select programme_offering_id, framework_version_id, blueprint_version_id
         from public.assessment_profile_versions limit 1`,
    );
    await expect(
      client.query(
        `insert into public.assessment_profile_versions
           (profile_id, revision, label, programme_offering_id, framework_version_id, blueprint_version_id,
            delivery_mode, scoring_algorithm_id, scoring_algorithm_version)
         values ('test-duplicate-offering', 1, 'x', $1, $2, $3, 'fixed_path', 'question-scorers', 1)`,
        [seeded.rows[0]!.programme_offering_id, seeded.rows[0]!.framework_version_id, seeded.rows[0]!.blueprint_version_id],
      ),
    ).rejects.toMatchObject({ code: "23505" });
  });
});

describe("a new session pins the real assessment_profile_version by FK (spec §12.3)", () => {
  beforeEach(async () => {
    await enableTargetModel(client);
  });

  it("a concrete (examStyle, yearLevel, subject) request resolves and pins the exact seeded profile row", async () => {
    await seedItem(client, "naplan-y5-num", { yearLevel: 5, examStyle: "naplan_style", subject: "numeracy" });
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client, {
      yearLevel: 5,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: 1,
      timing: "timed",
    }, "pin-resolve-1");
    expect(body.assessmentProfileVersionId).toBeTruthy();

    await asOwner(client);
    const row = await client.query<{ profile_id: string }>(
      `select apv.profile_id
         from public.assessment_sessions s
         join public.assessment_profile_versions apv on apv.id = s.assessment_profile_version_id
        where s.id = $1`,
      [body.sessionId],
    );
    expect(row.rows[0]!.profile_id).toBe("phase2-fixed.naplan_style_practice.numeracy.y5");
  });

  it("leaves the pin null (never a guess) when the request does not resolve to exactly one offering", async () => {
    await seedItem(client, "mixed-pool", { yearLevel: 5, examStyle: "naplan_style", subject: "numeracy" });
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client, {
      yearLevel: "mixed",
      examStyle: "mixed",
      subject: "mixed",
      questionCount: 1,
      timing: "timed",
    }, "pin-resolve-mixed");
    expect(body.assessmentProfileVersionId).toBeNull();

    await asOwner(client);
    const row = await client.query(
      `select assessment_profile_version_id from public.assessment_sessions where id = $1`,
      [body.sessionId],
    );
    expect(row.rows[0]!.assessment_profile_version_id).toBeNull();
  });

  it("the existing text pin is unchanged -- additive, not a replacement", async () => {
    await seedItem(client, "naplan-y5-num-2", { yearLevel: 5, examStyle: "naplan_style", subject: "numeracy" });
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client, {
      yearLevel: 5,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: 1,
      timing: "timed",
    }, "pin-resolve-additive");

    await asOwner(client);
    const row = await client.query(
      `select assessment_profile_version from public.assessment_sessions where id = $1`,
      [body.sessionId],
    );
    expect(row.rows[0]!.assessment_profile_version).toBe("phase2-fixed-profile.v1");
  });
});

describe("§22 replay proof: superseding a config version after a session pins it does not move the session's read", () => {
  it("a session created before a new profile revision keeps reading the OLD, byte-identical row", async () => {
    await enableTargetModel(client);
    await seedItem(client, "replay-numeracy-y5", { yearLevel: 5, examStyle: "naplan_style", subject: "numeracy" });

    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(client, {
      yearLevel: 5,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: 1,
      timing: "timed",
    }, "replay-pin-1");
    await asOwner(client);

    const before = await client.query(
      `select apv.id, apv.profile_id, apv.revision, apv.availability, apv.duration_seconds,
              apv.scoring_algorithm_id, apv.scoring_algorithm_version, apv.framework_version_id, apv.blueprint_version_id
         from public.assessment_sessions s
         join public.assessment_profile_versions apv on apv.id = s.assessment_profile_version_id
        where s.id = $1`,
      [body.sessionId],
    );
    expect(before.rows).toHaveLength(1);
    const pinned = before.rows[0]!;

    /* "Change a config version": the product supersedes this exact profile
       with a new revision -- the ONLY legitimate way to change one of these
       immutable rows, per 20260823090000's header. */
    const offering = await client.query(
      `select programme_offering_id, framework_version_id, blueprint_version_id
         from public.assessment_profile_versions where id = $1`,
      [pinned.id],
    );
    await client.query(
      `insert into public.assessment_profile_versions
         (profile_id, revision, label, programme_offering_id, framework_version_id, blueprint_version_id,
          delivery_mode, scoring_algorithm_id, scoring_algorithm_version, availability, withdrawn_at)
       values ($1, 2, 'superseded for replay proof', $2, $3, $4, 'fixed_path', 'question-scorers', 1, 'withdrawn', now())`,
      [
        pinned.profile_id,
        offering.rows[0]!.programme_offering_id,
        offering.rows[0]!.framework_version_id,
        offering.rows[0]!.blueprint_version_id,
      ],
    );

    /* The session's own pin, re-read AFTER the config "moved on". */
    const after = await client.query(
      `select apv.id, apv.profile_id, apv.revision, apv.availability, apv.duration_seconds,
              apv.scoring_algorithm_id, apv.scoring_algorithm_version, apv.framework_version_id, apv.blueprint_version_id
         from public.assessment_sessions s
         join public.assessment_profile_versions apv on apv.id = s.assessment_profile_version_id
        where s.id = $1`,
      [body.sessionId],
    );
    expect(after.rows).toEqual(before.rows);
    expect(after.rows[0]!.revision).toBe(1);
    expect(after.rows[0]!.availability).toBe("available");

    /* And the new revision is a genuinely separate row -- "current" moved,
       the session's pin did not. */
    const currentForOffering = await client.query(
      `select revision, availability from public.assessment_profile_versions
         where profile_id = $1 order by revision`,
      [pinned.profile_id],
    );
    expect(currentForOffering.rows).toEqual([
      { revision: 1, availability: "available" },
      { revision: 2, availability: "withdrawn" },
    ]);
  });
});
