/**
 * Coverage for supabase/migrations/20260822090000_programme_offering_authority.sql
 * (Gate A item A16, docs/phase2-cutover-readiness-checklist.md; spec §6.2-6.4,
 * §22; ADR-001 clause 6).
 *
 * A16 retires A11's (20260821090000) inline SQL mirror of
 * REGISTRY_SUBJECT_BY_FILTER and EXAM_STYLE_YEAR_LEVELS into a real
 * reference-table authority: `subjects`, `assessment_families`, `programmes`
 * and `programme_offerings`. This file proves three things A11's own suite
 * (tests/rls/target-selector-offering.test.ts, still green and unchanged)
 * does not: the seeded offering set matches the TS registries exactly (not
 * just the six filters A11 already covered), the offering boundary now
 * catches an invalid SUBJECT for an otherwise-real (style, year) — which A11
 * could not — and the reference tables are read-appropriate (no
 * anon/authenticated privilege at all) rather than learner-writable.
 *
 * Same harness contract as the other suites here: seed as the unrestricted
 * role, impersonate the way PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { REGISTRY_SUBJECT_BY_FILTER } from "@/features/exam-engine/selection/selection-config";
import { isSubjectSatIn, SUBJECT_IDS } from "@/features/taxonomy/subject-registry";
import { EXAM_STYLE_YEAR_LEVELS } from "@/features/taxonomy/year-registry";

import { connect } from "./db";
import { asAuthenticated, seed, STUDENT_A } from "./fixtures";

let client: Client;

const REFERENCE_TABLES = ["subjects", "assessment_families", "programmes", "programme_offerings"] as const;

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

/** One item in the exact (year, style, bank-subject) cell requested. */
async function seedItem(
  target: Client,
  label: string,
  scope: { year: number; style: string; subject: string },
): Promise<void> {
  const item = await target.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'test_seed', 'curated_git_authored') returning id`,
    [`offering-authority-${label}`],
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
      scope.year,
      scope.style,
      scope.subject,
    ],
  );
  await target.query(
    `insert into public.item_answer_versions (item_version_id, answer_key, private_explanation)
     values ($1, '{"kind":"single_option","optionId":"b"}'::jsonb, $2)`,
    [version.rows[0]!.id, `Because ${label} is b.`],
  );
}

async function createSession(
  target: Client,
  config: Record<string, unknown>,
  key: string,
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
  await enableTargetModel(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("programme_offerings is the single offering authority", () => {
  it("holds exactly the set EXAM_STYLE_YEAR_LEVELS x SUBJECT_REGISTRY computes -- no more, no fewer", async () => {
    const expected = new Set<string>();
    for (const examStyle of ["naplan_style", "icas_style"] as const) {
      for (const yearLevel of EXAM_STYLE_YEAR_LEVELS[examStyle]) {
        for (const subjectId of SUBJECT_IDS) {
          if (isSubjectSatIn(subjectId, examStyle, yearLevel)) {
            expected.add(`${examStyle}:${yearLevel}:${subjectId}`);
          }
        }
      }
    }

    const rows = await client.query<{ family: string; year: number; subject: string }>(
      `select pr.assessment_family_id as family, po.year_level as year, po.subject_id as subject
         from public.programme_offerings po
         join public.programmes pr on pr.id = po.programme_id
        where pr.id in ('naplan_style_practice', 'icas_style_practice')`,
    );
    const actual = new Set(rows.rows.map((r) => `${r.family}:${r.year}:${r.subject}`));

    expect(actual.size).toBe(expected.size);
    expect(actual).toEqual(expected);
  });

  it("has no second, independently maintained subject id vocabulary: every row's subject_id is a real subjects.id", async () => {
    const orphans = await client.query(
      `select po.subject_id
         from public.programme_offerings po
         left join public.subjects s on s.id = po.subject_id
        where s.id is null`,
    );
    expect(orphans.rowCount).toBe(0);
  });
});

describe("create_assessment_session routes through programme_offerings -- no inline mapping remains", () => {
  const OFFERINGS: Record<string, { year: number; style: string }> = {
    numeracy: { year: 5, style: "naplan_style" },
    reading: { year: 5, style: "naplan_style" },
    language: { year: 5, style: "naplan_style" },
    science: { year: 5, style: "icas_style" },
    digital_technologies: { year: 5, style: "icas_style" },
    spelling: { year: 5, style: "icas_style" },
  };

  it.each(Object.entries(REGISTRY_SUBJECT_BY_FILTER))(
    "every valid offering still selects a non-empty paper: filter '%s' -> bank subject '%s'",
    async (filter, bankSubject) => {
      const offering = OFFERINGS[filter]!;
      await seedItem(client, filter, { year: offering.year, style: offering.style, subject: bankSubject });

      await asAuthenticated(client, STUDENT_A);
      const body = await createSession(
        client,
        { yearLevel: offering.year, examStyle: offering.style, subject: filter, questionCount: 1, timing: "timed" },
        `idem-offering-${filter}`,
      );
      expect(body.itemCount).toBe(1);
    },
  );

  it("rejects NAPLAN Year 4 with MM229 (invalid style/year pair, no offering row at any subject)", async () => {
    await asAuthenticated(client, STUDENT_A);
    await expect(
      createSession(
        client,
        { yearLevel: 4, examStyle: "naplan_style", subject: "mixed", questionCount: 1, timing: "timed" },
        "idem-authority-naplan-y4",
      ),
    ).rejects.toMatchObject({ code: "MM229" });
  });

  it("rejects NAPLAN Year 3 Science with MM229 -- a real style/year and a real subject, but not a real sitting (A11 could not catch this; only checked the pair)", async () => {
    await asAuthenticated(client, STUDENT_A);
    await expect(
      createSession(
        client,
        { yearLevel: 3, examStyle: "naplan_style", subject: "science", questionCount: 1, timing: "timed" },
        "idem-authority-naplan-science",
      ),
    ).rejects.toMatchObject({ code: "MM229" });
  });

  it("rejects ICAS Year 10 Digital Technologies with MM229 -- ICAS stops setting it after Year 7", async () => {
    await asAuthenticated(client, STUDENT_A);
    await expect(
      createSession(
        client,
        { yearLevel: 10, examStyle: "icas_style", subject: "digital_technologies", questionCount: 1, timing: "timed" },
        "idem-authority-icas-dt-y10",
      ),
    ).rejects.toMatchObject({ code: "MM229" });
  });

  it("accepts ICAS Year 7 Digital Technologies (the last year it runs)", async () => {
    await seedItem(client, "icas-dt-y7", { year: 7, style: "icas_style", subject: "digital_technologies" });
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(
      client,
      { yearLevel: 7, examStyle: "icas_style", subject: "digital_technologies", questionCount: 1, timing: "timed" },
      "idem-authority-icas-dt-y7",
    );
    expect(body.itemCount).toBe(1);
  });

  it("still refuses an unrecognised subject filter with the generic MM212, not a false MM229", async () => {
    await seedItem(client, "num-control", { year: 5, style: "naplan_style", subject: "numeracy" });
    await asAuthenticated(client, STUDENT_A);
    await expect(
      createSession(
        client,
        { yearLevel: 5, examStyle: "naplan_style", subject: "not_a_real_subject", questionCount: 1, timing: "timed" },
        "idem-authority-unrecognised",
      ),
    ).rejects.toMatchObject({ code: "MM212" });
  });

  it("leaves a genuinely valid offering with no content on MM212, distinct from MM229", async () => {
    await asAuthenticated(client, STUDENT_A);
    await expect(
      createSession(
        client,
        { yearLevel: 5, examStyle: "naplan_style", subject: "numeracy", questionCount: 1, timing: "timed" },
        "idem-authority-valid-empty",
      ),
    ).rejects.toMatchObject({ code: "MM212" });
  });
});

describe("reference tables are read-appropriate and not learner-writable", () => {
  it("grants anon and authenticated no privilege at all on any of the four tables", async () => {
    const result = await client.query<{ table_name: string; grantee: string; privilege_type: string }>(
      `select table_name, grantee, privilege_type
         from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name = any($1::text[])
          and grantee in ('anon', 'authenticated')`,
      [REFERENCE_TABLES],
    );
    expect(result.rows).toEqual([]);
  });

  it("has RLS enabled on all four tables", async () => {
    const result = await client.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = any($1::text[])`,
      [REFERENCE_TABLES],
    );
    expect(result.rows).toHaveLength(REFERENCE_TABLES.length);
    for (const row of result.rows) {
      expect(row.relrowsecurity, row.relname).toBe(true);
    }
  });

  it("cannot be read directly by an authenticated learner (RLS + no policy blocks even SELECT)", async () => {
    await asAuthenticated(client, STUDENT_A);
    /* A denied query aborts the current transaction until rolled back to a
       savepoint, so each table needs its own -- otherwise every table after
       the first reports 25P02 ("transaction is aborted"), not the 42501
       under test. */
    for (const table of REFERENCE_TABLES) {
      await client.query("savepoint sp");
      await expect(
        client.query(`select 1 from public.${table} limit 1`),
        table,
      ).rejects.toMatchObject({ code: "42501" });
      await client.query("rollback to savepoint sp");
      await client.query("release savepoint sp");
    }
  });
});
