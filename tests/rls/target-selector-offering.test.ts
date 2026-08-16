/**
 * Coverage for supabase/migrations/20260821090000_target_selector_canonical_offering.sql
 * (Gate A item A11, docs/phase2-cutover-readiness-checklist.md; external
 * review #7).
 *
 * Two bugs, one migration. `create_assessment_session` compared the raw
 * `subject` filter straight against `item_versions.source_subject`, so a
 * `language` paper (bank subject `language_conventions`) matched zero rows;
 * and it never checked whether the requested (examStyle, yearLevel) pair is a
 * real sitting at all, so NAPLAN Year 4 fell through to the exact same
 * "no eligible content" refusal a genuine coverage gap would raise — the two
 * were indistinguishable from the caller's side.
 *
 * Same harness contract as the other suites here: seed as the unrestricted
 * role, impersonate the way PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { REGISTRY_SUBJECT_BY_FILTER } from "@/features/exam-engine/selection/selection-config";
import { EXAM_STYLE_YEAR_LEVELS } from "@/features/taxonomy/year-registry";

import { connect } from "./db";
import { asAuthenticated, seed, STUDENT_A } from "./fixtures";

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

/** One item in the exact (year, style, bank-subject) cell requested. */
async function seedItem(
  target: Client,
  label: string,
  scope: { year: number; style: string; subject: string },
): Promise<void> {
  const item = await target.query<{ id: string }>(
    `insert into public.items (item_code, origin, provenance_class)
     values ($1, 'test_seed', 'curated_git_authored') returning id`,
    [`offering-${label}`],
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

describe("the canonical subject mapping — every isolable filter selects a non-empty paper", () => {
  /* REGISTRY_SUBJECT_BY_FILTER is the one place TS states the filter->bank
     mapping (selection-config.ts); this seeds a bank item under each real
     bank subject at a valid NAPLAN or ICAS offering and proves the RPC's
     hard-coded mapping agrees with it — 'language' is the pair that was
     actually broken, and the other five are regression coverage so the fix
     cannot narrow to "just language" without this file noticing. */
  const OFFERINGS: Record<string, { year: number; style: string }> = {
    numeracy: { year: 5, style: "naplan_style" },
    reading: { year: 5, style: "naplan_style" },
    language: { year: 5, style: "naplan_style" },
    science: { year: 5, style: "icas_style" },
    digital_technologies: { year: 5, style: "icas_style" },
    spelling: { year: 5, style: "icas_style" },
  };

  it.each(Object.entries(REGISTRY_SUBJECT_BY_FILTER))(
    "filter '%s' -> bank subject '%s'",
    async (filter, bankSubject) => {
      const offering = OFFERINGS[filter]!;
      await seedItem(client, filter, { year: offering.year, style: offering.style, subject: bankSubject });

      await asAuthenticated(client, STUDENT_A);
      const body = await createSession(
        client,
        { yearLevel: offering.year, examStyle: offering.style, subject: filter, questionCount: 1, timing: "timed" },
        `idem-${filter}`,
      );
      expect(body.itemCount).toBe(1);
    },
  );

  it("still refuses an unrecognised subject filter with the generic MM212, not a false match", async () => {
    await seedItem(client, "num-control", { year: 5, style: "naplan_style", subject: "numeracy" });
    await asAuthenticated(client, STUDENT_A);
    await expect(
      createSession(
        client,
        { yearLevel: 5, examStyle: "naplan_style", subject: "not_a_real_subject", questionCount: 1, timing: "timed" },
        "idem-unrecognised",
      ),
    ).rejects.toMatchObject({ code: "MM212" });
  });
});

describe("the offering boundary — an (examStyle, yearLevel) pair that is not a real sitting", () => {
  it("rejects NAPLAN Year 4 with MM229, before any content is queried", async () => {
    /* No item seeded at all: if the rejection ever regressed into a content
       query, it would still fail — MM212, the wrong code — rather than pass. */
    await asAuthenticated(client, STUDENT_A);
    await expect(
      createSession(
        client,
        { yearLevel: 4, examStyle: "naplan_style", subject: "mixed", questionCount: 1, timing: "timed" },
        "idem-naplan-y4",
      ),
    ).rejects.toMatchObject({ code: "MM229" });
  });

  it("rejects ICAS Year 1 with MM229 (ICAS starts at Year 2)", async () => {
    await asAuthenticated(client, STUDENT_A);
    await expect(
      createSession(
        client,
        { yearLevel: 1, examStyle: "icas_style", subject: "mixed", questionCount: 1, timing: "timed" },
        "idem-icas-y1",
      ),
    ).rejects.toMatchObject({ code: "MM229" });
  });

  it("does not reject a fixed year with a 'mixed' style — the axis is not pinned", async () => {
    /* Year 4 is invalid for NAPLAN but valid for ICAS; with style left
       unpinned there is no fixed offering to validate, so this must reach the
       content query rather than MM229. */
    await seedItem(client, "icas-y4", { year: 4, style: "icas_style", subject: "numeracy" });
    await asAuthenticated(client, STUDENT_A);
    const body = await createSession(
      client,
      { yearLevel: 4, examStyle: "mixed", subject: "numeracy", questionCount: 1, timing: "timed" },
      "idem-y4-mixed-style",
    );
    expect(body.itemCount).toBe(1);
  });

  it("leaves a genuinely valid offering with no content on MM212, distinct from MM229", async () => {
    /* Year 5 NAPLAN is a real sitting; this bank has nothing in it. The two
       failure modes must stay distinguishable — this is not the same case as
       the tests above, which never reach the content query at all. */
    await asAuthenticated(client, STUDENT_A);
    await expect(
      createSession(
        client,
        { yearLevel: 5, examStyle: "naplan_style", subject: "numeracy", questionCount: 1, timing: "timed" },
        "idem-valid-empty",
      ),
    ).rejects.toMatchObject({ code: "MM212" });
  });

  it("agrees with EXAM_STYLE_YEAR_LEVELS on every year for both styles", async () => {
    /* The exhaustive form of the two cases above: every year 1-12 crossed
       with both styles, asserting MM229 fires exactly where
       EXAM_STYLE_YEAR_LEVELS says the pair is not a real sitting, and does
       NOT fire where it is (those fall through to MM212 with no content
       seeded, never MM229). */
    for (const style of ["naplan_style", "icas_style"] as const) {
      const validYears = new Set(EXAM_STYLE_YEAR_LEVELS[style]);
      for (let year = 1; year <= 12; year += 1) {
        await client.query("savepoint sp");
        await asAuthenticated(client, STUDENT_A);
        const attempt = createSession(
          client,
          { yearLevel: year, examStyle: style, subject: "mixed", questionCount: 1, timing: "timed" },
          `idem-${style}-y${year}`,
        );
        if (validYears.has(year as never)) {
          await expect(attempt, `${style} year ${year}`).rejects.toMatchObject({ code: "MM212" });
        } else {
          await expect(attempt, `${style} year ${year}`).rejects.toMatchObject({ code: "MM229" });
        }
        await client.query("rollback to savepoint sp");
        await client.query("release savepoint sp");
      }
    }
  });
});
