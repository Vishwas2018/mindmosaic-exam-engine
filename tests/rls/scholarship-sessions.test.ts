/**
 * Scholarship Year 6 on the legacy session path: tenant isolation, role gating, first-class mode, duplicate
 * submission, immutable history, the offering seed and the migration's re-run safety.
 *
 * Same harness contract as the other suites here: seed as the unrestricted role, impersonate the way PostgREST
 * does, always ROLLBACK.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, PARENT_C, seed, SESSION_A, STUDENT_A, STUDENT_B, TEACHER_D } from "./fixtures";

let client: Client;

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

const SCHOLARSHIP_CONFIG = {
  yearLevel: 6,
  examStyle: "scholarship_style",
  subject: "numerical_reasoning",
  questionCount: 40,
  timing: "timed",
  patternId: "scholarship-y6-numerical-reasoning-full",
  bankId: "published",
};
const IDS = ["scholarship-y6-nr-001", "scholarship-y6-nr-002", "scholarship-y6-nr-003"];

async function createSession(config: Record<string, unknown> = SCHOLARSHIP_CONFIG): Promise<string> {
  const created = await client.query(
    `select public.create_exam_session($1::jsonb, 'seed-scholarship', $2::text[], now() + interval '1 hour') as id`,
    [JSON.stringify(config), IDS],
  );
  return created.rows[0].id as string;
}

describe("scholarship sessions: isolation and roles", () => {
  it("records the server's own selection under the caller, with the standard mode by default", async () => {
    await asAuthenticated(client, STUDENT_A);
    const id = await createSession();
    const row = await client.query(
      `select student_id, mode, selected_question_ids from public.exam_sessions where id = $1`,
      [id],
    );
    expect(row.rows).toEqual([{ student_id: STUDENT_A, mode: "standard", selected_question_ids: IDS }]);
  });

  it("records Confidence Mode as a first-class column, from either spelling of the request", async () => {
    await asAuthenticated(client, STUDENT_A);
    const byMode = await createSession({ ...SCHOLARSHIP_CONFIG, mode: "confidence" });
    const byFlag = await createSession({ ...SCHOLARSHIP_CONFIG, confidenceMode: true });
    const modes = await client.query(`select mode from public.exam_sessions where id = any($1::uuid[])`, [[byMode, byFlag]]);
    expect(modes.rows.map((r) => r.mode)).toEqual(["confidence", "confidence"]);
    await client.query("savepoint bad");
    await expect(
      client.query(
        `select public.create_exam_session('{"mode":"preview"}'::jsonb, 's', array['x'], now() + interval '1 hour')`,
      ),
    ).rejects.toThrow(/mode|check constraint/i);
    await client.query("rollback to savepoint bad");
  });

  it("keeps another student's scholarship session and attempt invisible, and shows a linked parent their own child's", async () => {
    await asAuthenticated(client, STUDENT_A);
    const id = await createSession();
    await client.query(`select public.record_exam_attempt($1, '{}'::jsonb, '{"correctCount":2}'::jsonb)`, [id]);

    await client.query("reset role");
    await asAuthenticated(client, STUDENT_B);
    expect((await client.query(`select 1 from public.exam_sessions where id = $1`, [id])).rows).toHaveLength(0);
    expect((await client.query(`select 1 from public.exam_attempts where session_id = $1`, [id])).rows).toHaveLength(0);

    await client.query("reset role");
    await asAuthenticated(client, PARENT_C);
    expect((await client.query(`select 1 from public.exam_attempts where session_id = $1`, [id])).rows).toHaveLength(1);
  });

  it("refuses a teacher or parent creating a scholarship session (MM002)", async () => {
    for (const who of [TEACHER_D, PARENT_C]) {
      await client.query("reset role");
      await client.query("savepoint s");
      await asAuthenticated(client, who);
      await expect(
        client.query(`select public.create_exam_session($1::jsonb, 's', $2::text[], now() + interval '1 hour')`, [
          JSON.stringify(SCHOLARSHIP_CONFIG),
          IDS,
        ]),
      ).rejects.toMatchObject({ code: "MM002" });
      await client.query("rollback to savepoint s");
    }
  });

  it("refuses an anonymous caller", async () => {
    await client.query("set local role anon");
    await expect(
      client.query(`select public.create_exam_session($1::jsonb, 's', $2::text[], now() + interval '1 hour')`, [
        JSON.stringify(SCHOLARSHIP_CONFIG),
        IDS,
      ]),
    ).rejects.toThrow(/permission denied/i);
  });
});

describe("scholarship attempts: duplicate submission and history", () => {
  it("accepts one submission per session and refuses a second without changing the first", async () => {
    await asAuthenticated(client, STUDENT_A);
    const id = await createSession();
    const first = await client.query(
      `select public.record_exam_attempt($1, '{"a":"b"}'::jsonb, '{"correctCount":1}'::jsonb) as attempt_id`,
      [id],
    );
    await client.query("savepoint dup");
    await expect(
      client.query(`select public.record_exam_attempt($1, '{"a":"c"}'::jsonb, '{"correctCount":40}'::jsonb)`, [id]),
    ).rejects.toMatchObject({ code: "23505" });
    await client.query("rollback to savepoint dup");
    const stored = await client.query(`select id, result from public.exam_attempts where session_id = $1`, [id]);
    expect(stored.rows).toEqual([{ id: first.rows[0].attempt_id, result: { correctCount: 1 } }]);
  });

  it("will not record an attempt against another student's session (MM003)", async () => {
    await asAuthenticated(client, STUDENT_B);
    await expect(
      client.query(`select public.record_exam_attempt($1, '{}'::jsonb, '{}'::jsonb)`, [SESSION_A]),
    ).rejects.toMatchObject({ code: "MM003" });
  });

  it("keeps a recorded scholarship result immutable for the student", async () => {
    await asAuthenticated(client, STUDENT_A);
    const id = await createSession();
    await client.query(`select public.record_exam_attempt($1, '{}'::jsonb, '{"correctCount":1}'::jsonb)`, [id]);
    await client.query("savepoint upd");
    await expect(
      client.query(`update public.exam_attempts set result = '{"correctCount":40}'::jsonb where session_id = $1`, [id]),
    ).rejects.toThrow(/permission denied|row-level security/i);
    await client.query("rollback to savepoint upd");
    await expect(client.query(`delete from public.exam_attempts where session_id = $1`, [id])).rejects.toThrow(
      /permission denied|row-level security/i,
    );
  });
});

describe("scholarship offerings and gate settings", () => {
  it("seeds exactly the five Year 6 offerings under the scholarship programme, active", async () => {
    const rows = await client.query(
      `select subject_id from public.programme_offerings
        where programme_id = 'edutest_scholarship_prep' and year_level = 6 and active order by subject_id`,
    );
    expect(rows.rows.map((r) => r.subject_id)).toEqual(
      ["numerical_reasoning", "numeracy", "reading", "verbal_reasoning", "writing"].sort(),
    );
  });

  it("enforces approval for every scholarship programme in the database", async () => {
    const rows = await client.query(
      `select programme_id, enforced from public.publication_gate_settings
        where programme_id like 'scholarship-%' or programme_id like 'edutest%' order by programme_id`,
    );
    expect(rows.rows.length).toBe(7);
    expect(rows.rows.every((r) => r.enforced === true)).toBe(true);
  });

  it("gives no learner any access to the offering tables", async () => {
    await asAuthenticated(client, STUDENT_A);
    for (const table of ["programme_offerings", "programmes", "assessment_families"]) {
      await client.query("savepoint t");
      const outcome = await client.query(`select 1 from public.${table} limit 1`).then(
        (r) => r.rows.length,
        (e: Error) => e.message,
      );
      expect(outcome === 0 || /permission denied/i.test(String(outcome)), table).toBe(true);
      await client.query("rollback to savepoint t");
    }
  });
});

describe("20261014090000_scholarship_programme_offerings.sql is safe to run again", () => {
  it("changes nothing the second time", async () => {
    const sql = readFileSync(
      path.join(process.cwd(), "supabase/migrations/20261014090000_scholarship_programme_offerings.sql"),
      "utf8",
    );
    const count = async () =>
      (
        await client.query(
          `select (select count(*) from public.programme_offerings where programme_id = 'edutest_scholarship_prep')::int as offerings,
                  (select count(*) from public.blueprint_versions where blueprint_id like 'phase2-whole-pool.edutest_scholarship_prep.%')::int as blueprints,
                  (select count(*) from public.assessment_profile_versions where profile_id like 'phase2-fixed.edutest_scholarship_prep.%')::int as profiles,
                  (select count(*) from public.publication_gate_settings where programme_id like 'scholarship-%' or programme_id like 'edutest%')::int as gates`,
        )
      ).rows[0];
    const before = await count();
    await client.query(sql);
    expect(await count()).toEqual(before);
    expect(before).toEqual({ offerings: 5, blueprints: 5, profiles: 5, gates: 7 });
  });

  it("leaves create_exam_session executable by authenticated users only", async () => {
    const grants = await client.query(
      `select grantee from information_schema.routine_privileges
        where routine_schema = 'public' and routine_name = 'create_exam_session' and privilege_type = 'EXECUTE'
        order by grantee`,
    );
    const who = grants.rows.map((r) => r.grantee);
    expect(who).toContain("authenticated");
    expect(who).not.toContain("anon");
    expect(who).not.toContain("PUBLIC");
  });
});
