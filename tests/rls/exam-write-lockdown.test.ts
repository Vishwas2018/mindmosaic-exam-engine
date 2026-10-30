/**
 * Legacy exam write lockdown (P1 assessment-integrity fix, ADR-005 interim).
 *
 * Before 20261031090100, `authenticated` could EXECUTE the SECURITY DEFINER
 * functions public.create_exam_session and public.record_exam_attempt straight
 * over PostgREST. The first accepts a caller-chosen question list and config
 * (a forged "full NAPLAN paper" of one question), the second stores a
 * caller-chosen `p_result` (a forged 100%). The Next.js routes were correct;
 * the functions behind them were the hole.
 *
 * The fix: the two writes are made by the server only, through
 * public.create_exam_session_for / public.record_exam_attempt_for, which take
 * the (already-verified) student id as an argument and are executable by one
 * dedicated least-privilege role, `mindmosaic_exam_writer`, and nobody else.
 *
 * Each test BEGINs on its own connection, seeds as the unrestricted role,
 * impersonates a user the way PostgREST does, and ROLLBACKs. Cases that need a
 * real login as the writer role open a separate connection and write nothing.
 */
import { Client } from "pg";
import type { Client as PgClient } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect, connectAsExamWriterRole } from "./db";
import {
  asAnon,
  asAuthenticated,
  PARENT_C,
  seed,
  SESSION_A,
  SESSION_B,
  STUDENT_A,
  STUDENT_B,
  TEACHER_D,
} from "./fixtures";

let client: PgClient;

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

const NO_FUNCTION_PRIVILEGE = /permission denied for function/i;
const DENIED_WRITE = /permission denied|row-level security/i;

/** A forged one-question "full NAPLAN paper", exactly what the exploit sent. */
const FORGED_CONFIG = JSON.stringify({
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: "full",
  timing: "timed",
  patternId: "naplan-y3-numeracy-full",
  bankId: "published",
  mode: "standard",
});

/** Runs a statement that is expected to fail, inside a savepoint so the outer transaction survives. */
async function attempt(sql: string, params: unknown[] = []): Promise<{ ok: true; rows: unknown[] } | { ok: false; error: Error & { code?: string } }> {
  await client.query("savepoint probe");
  try {
    const result = await client.query(sql, params);
    await client.query("release savepoint probe");
    return { ok: true, rows: result.rows };
  } catch (error) {
    await client.query("rollback to savepoint probe");
    return { ok: false, error: error as Error & { code?: string } };
  }
}

describe("direct RPC exploit: a student can no longer forge a paper or a result", () => {
  it("denies create_exam_session to an authenticated student (forged one-question paper)", async () => {
    await asAuthenticated(client, STUDENT_A);
    const out = await attempt(
      `select public.create_exam_session($1::jsonb, 'seed-forged', array['one-question-only'], now() + interval '1 hour')`,
      [FORGED_CONFIG],
    );
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error.code).toBe("42501");
      expect(out.error.message).toMatch(NO_FUNCTION_PRIVILEGE);
    }
  });

  it("denies create_exam_session even for a non-existent question id", async () => {
    await asAuthenticated(client, STUDENT_A);
    const out = await attempt(
      `select public.create_exam_session($1::jsonb, 's', array['no-such-question-id'], now() + interval '1 hour')`,
      [FORGED_CONFIG],
    );
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.code).toBe("42501");
  });

  it("denies record_exam_attempt to an authenticated student on their OWN fresh session (forged 100% result)", async () => {
    // The session is created by the unrestricted seed role, standing in for the server.
    const created = await client.query(
      `insert into public.exam_sessions (student_id, config, seed, selected_question_ids, expires_at, mode)
       values ($1, '{}'::jsonb, 'seed-own', array['q1'], now() + interval '1 hour', 'standard') returning id`,
      [STUDENT_A],
    );
    const ownSession = created.rows[0].id as string;
    await asAuthenticated(client, STUDENT_A);
    const out = await attempt(
      `select public.record_exam_attempt($1, '{}'::jsonb, '{"correctCount":36,"objectiveMarksEarned":36,"objectiveMarksAvailable":36,"objectivePercentage":100}'::jsonb)`,
      [ownSession],
    );
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error.code).toBe("42501");
      expect(out.error.message).toMatch(NO_FUNCTION_PRIVILEGE);
    }
    await client.query("reset role");
    const stored = await client.query(`select 1 from public.exam_attempts where session_id = $1`, [ownSession]);
    expect(stored.rows).toHaveLength(0);
  });

  it("denies both legacy RPCs to anon", async () => {
    await asAnon(client);
    const a = await attempt(`select public.create_exam_session('{}'::jsonb, 's', array['q1'], now() + interval '1 hour')`);
    const b = await attempt(`select public.record_exam_attempt($1, '{}'::jsonb, '{}'::jsonb)`, [SESSION_A]);
    for (const out of [a, b]) {
      expect(out.ok).toBe(false);
      if (!out.ok) expect(out.error.code).toBe("42501");
    }
  });

  it("denies the new server-only _for functions to authenticated and anon (the replacement must not become the new hole)", async () => {
    for (const as of ["authenticated", "anon"] as const) {
      await client.query("reset role");
      if (as === "authenticated") await asAuthenticated(client, STUDENT_A);
      else await asAnon(client);
      const create = await attempt(
        `select public.create_exam_session_for($1, '{}'::jsonb, 's', array['q1'], now() + interval '1 hour')`,
        [STUDENT_A],
      );
      const record = await attempt(
        `select public.record_exam_attempt_for($1, $2, '{}'::jsonb, '{"correctCount":999}'::jsonb)`,
        [STUDENT_A, SESSION_A],
      );
      for (const out of [create, record]) {
        expect(out.ok).toBe(false);
        if (!out.ok) expect(out.error.code).toBe("42501");
      }
    }
  });

  it("no overload of either legacy function, nor either replacement, is executable by anon, authenticated or PUBLIC", async () => {
    await client.query("reset role");
    const rows = await client.query(
      `select p.oid::regprocedure::text as sig, a.grantee::regrole::text as grantee
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a on a.privilege_type = 'EXECUTE'
        where n.nspname = 'public'
          and p.proname in ('create_exam_session', 'record_exam_attempt', 'create_exam_session_for', 'record_exam_attempt_for')
          and a.grantee::regrole::text in ('anon', 'authenticated', '-', 'public')`,
    );
    expect(rows.rows).toEqual([]);
  });

  it("the replacements are executable by the postgres owner and the writer role only", async () => {
    await client.query("reset role");
    const rows = await client.query(
      `select p.proname, array_agg(distinct a.grantee::regrole::text order by a.grantee::regrole::text) as grantees
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a on a.privilege_type = 'EXECUTE'
        where n.nspname = 'public' and p.proname in ('create_exam_session_for', 'record_exam_attempt_for')
        group by p.proname order by p.proname`,
    );
    expect(rows.rows).toEqual([
      { proname: "create_exam_session_for", grantees: ["mindmosaic_exam_writer", "postgres"] },
      { proname: "record_exam_attempt_for", grantees: ["mindmosaic_exam_writer", "postgres"] },
    ]);
  });
});

describe("no bypass through direct table writes or another function", () => {
  it("a student cannot insert, rewrite or delete exam_sessions or exam_attempts", async () => {
    await asAuthenticated(client, STUDENT_A);
    const statements: [string, unknown[]][] = [
      [`insert into public.exam_sessions (student_id, config, seed, selected_question_ids, expires_at) values ('${STUDENT_A}', '{}'::jsonb, 's', array['q1'], now() + interval '1 hour')`, []],
      [`update public.exam_sessions set selected_question_ids = array['one-easy-question'] where student_id = '${STUDENT_A}'`, []],
      [`update public.exam_sessions set expires_at = now() + interval '10 years' where student_id = '${STUDENT_A}'`, []],
      [`delete from public.exam_sessions where student_id = '${STUDENT_A}'`, []],
      [`insert into public.exam_attempts (session_id, student_id, responses, result) values ('${SESSION_A}', '${STUDENT_A}', '{}'::jsonb, '{"correctCount":36}'::jsonb)`, []],
      [`update public.exam_attempts set result = '{"correctCount":36}'::jsonb where student_id = '${STUDENT_A}'`, []],
      [`delete from public.exam_attempts where student_id = '${STUDENT_A}'`, []],
      [`truncate public.exam_attempts`, []],
      [`truncate public.exam_sessions`, []],
    ];
    for (const [sql, params] of statements) {
      const out = await attempt(sql, params);
      expect(out.ok, sql).toBe(false);
      if (!out.ok) expect(out.error.message, sql).toMatch(DENIED_WRITE);
    }
  });

  it("autosave (exam_responses) still cannot change a recorded result or another student's session", async () => {
    await asAuthenticated(client, STUDENT_B);
    const out = await attempt(
      `insert into public.exam_responses (session_id, student_id, responses) values ($1, $2, '{}'::jsonb)`,
      [SESSION_A, STUDENT_B],
    );
    expect(out.ok).toBe(false);
  });

  it("no function a client can execute writes exam_sessions or exam_attempts (nothing else can mint a result)", async () => {
    await client.query("reset role");
    const defs = await client.query(
      `select p.oid::regprocedure::text as sig, pg_get_functiondef(p.oid) as def
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.prokind = 'f'
          and (has_function_privilege('authenticated', p.oid, 'EXECUTE') or has_function_privilege('anon', p.oid, 'EXECUTE'))`,
    );
    const writes = /(insert\s+into|update|delete\s+from)\s+(public\.)?(exam_attempts|exam_sessions)\b/i;
    expect(defs.rows.filter((r: { def: string }) => writes.test(r.def)).map((r: { sig: string }) => r.sig)).toEqual([]);
  });

  it("the target-model create function still refuses an out-of-cohort student (the version_pinned path is not an alternative way in)", async () => {
    await asAuthenticated(client, STUDENT_A);
    const out = await attempt(`select public.create_assessment_session('{"mode":"practice"}'::jsonb, 'k-lockdown')`);
    expect(out.ok).toBe(false);
  });
});

describe("legitimate server path: create_exam_session_for / record_exam_attempt_for", () => {
  it("creates a session owned by the named student, with the server-chosen ids and expiry", async () => {
    const created = await client.query(
      `select public.create_exam_session_for($1, '{"bankId":"published"}'::jsonb, 'seed-x', array['q1','q2'], now() + interval '1 hour') as id`,
      [STUDENT_A],
    );
    const id = created.rows[0].id as string;
    const row = await client.query(`select student_id, seed, selected_question_ids, mode from public.exam_sessions where id = $1`, [id]);
    expect(row.rows).toEqual([{ student_id: STUDENT_A, seed: "seed-x", selected_question_ids: ["q1", "q2"], mode: "standard" }]);
  });

  it("derives confidence mode exactly as the legacy function did", async () => {
    const created = await client.query(
      `select public.create_exam_session_for($1, '{"confidenceMode":true}'::jsonb, 's', array['q1'], now() + interval '1 hour') as id`,
      [STUDENT_A],
    );
    const row = await client.query(`select mode from public.exam_sessions where id = $1`, [created.rows[0].id]);
    expect(row.rows).toEqual([{ mode: "confidence" }]);
  });

  it("refuses a missing student id (MM001) and a non-student (MM002)", async () => {
    const none = await attempt(`select public.create_exam_session_for(null, '{}'::jsonb, 's', array['q1'], now() + interval '1 hour')`);
    expect(none.ok).toBe(false);
    if (!none.ok) expect(none.error.code).toBe("MM001");
    for (const id of [TEACHER_D, PARENT_C]) {
      const out = await attempt(`select public.create_exam_session_for($1, '{}'::jsonb, 's', array['q1'], now() + interval '1 hour')`, [id]);
      expect(out.ok).toBe(false);
      if (!out.ok) expect(out.error.code).toBe("MM002");
    }
  });

  it("records one attempt, owned by the student, readable by them and by nobody else", async () => {
    const created = await client.query(
      `select public.create_exam_session_for($1, '{}'::jsonb, 's', array['q1'], now() + interval '1 hour') as id`,
      [STUDENT_A],
    );
    const sessionId = created.rows[0].id as string;
    const attemptRow = await client.query(
      `select public.record_exam_attempt_for($1, $2, '{"q1":"a"}'::jsonb, '{"correctCount":1}'::jsonb) as id`,
      [STUDENT_A, sessionId],
    );
    expect(attemptRow.rows[0].id).toBeTruthy();

    await asAuthenticated(client, STUDENT_A);
    const mine = await client.query(`select result, student_id from public.exam_attempts where session_id = $1`, [sessionId]);
    expect(mine.rows).toEqual([{ result: { correctCount: 1 }, student_id: STUDENT_A }]);

    await client.query("reset role");
    await asAuthenticated(client, STUDENT_B);
    expect((await client.query(`select 1 from public.exam_attempts where session_id = $1`, [sessionId])).rows).toHaveLength(0);
    expect((await client.query(`select 1 from public.exam_sessions where id = $1`, [sessionId])).rows).toHaveLength(0);
  });

  it("refuses a duplicate submission with the unique violation the route maps to 409, leaving the first result intact", async () => {
    const created = await client.query(
      `select public.create_exam_session_for($1, '{}'::jsonb, 's', array['q1'], now() + interval '1 hour') as id`,
      [STUDENT_A],
    );
    const sessionId = created.rows[0].id as string;
    await client.query(`select public.record_exam_attempt_for($1, $2, '{}'::jsonb, '{"correctCount":1}'::jsonb)`, [STUDENT_A, sessionId]);
    const dup = await attempt(`select public.record_exam_attempt_for($1, $2, '{}'::jsonb, '{"correctCount":40}'::jsonb)`, [STUDENT_A, sessionId]);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.code).toBe("23505");
    const stored = await client.query(`select result from public.exam_attempts where session_id = $1`, [sessionId]);
    expect(stored.rows).toEqual([{ result: { correctCount: 1 } }]);
  });

  it("will not record an attempt against another student's session (MM003) or an expired one (MM004)", async () => {
    const other = await attempt(`select public.record_exam_attempt_for($1, $2, '{}'::jsonb, '{}'::jsonb)`, [STUDENT_B, SESSION_A]);
    expect(other.ok).toBe(false);
    if (!other.ok) expect(other.error.code).toBe("MM003");

    const expired = await client.query(
      `insert into public.exam_sessions (student_id, config, seed, selected_question_ids, expires_at, mode)
       values ($1, '{}'::jsonb, 'old', array['q1'], now() - interval '1 minute', 'standard') returning id`,
      [STUDENT_B],
    );
    const late = await attempt(`select public.record_exam_attempt_for($1, $2, '{}'::jsonb, '{}'::jsonb)`, [STUDENT_B, expired.rows[0].id]);
    expect(late.ok).toBe(false);
    if (!late.ok) expect(late.error.code).toBe("MM004");
    void SESSION_B;
  });

  it("an unrelated student cannot read, autosave into or submit someone else's session through the table API", async () => {
    await asAuthenticated(client, STUDENT_B);
    expect((await client.query(`select 1 from public.exam_sessions where id = $1`, [SESSION_A])).rows).toHaveLength(0);
    const autosave = await attempt(
      `insert into public.exam_responses (session_id, student_id, responses) values ($1, $2, '{}'::jsonb)`,
      [SESSION_A, STUDENT_B],
    );
    expect(autosave.ok).toBe(false);
  });
});

describe("mindmosaic_exam_writer: the least-privilege identity", () => {
  it("is a plain login role: no superuser, createdb, createrole, replication, bypassrls or inheritance", async () => {
    await client.query("reset role");
    const role = await client.query(
      `select rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls, rolinherit, rolcanlogin
         from pg_roles where rolname = 'mindmosaic_exam_writer'`,
    );
    expect(role.rows).toEqual([
      { rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: false, rolinherit: false, rolcanlogin: true },
    ]);
  });

  it("holds no table, sequence or other-function privilege at all; its whole privilege set is the two functions", async () => {
    await client.query("reset role");
    const tables = await client.query(
      `select table_schema, table_name, privilege_type from information_schema.table_privileges where grantee = 'mindmosaic_exam_writer'`,
    );
    expect(tables.rows).toEqual([]);
    /* Functions PUBLIC can execute (RLS helpers, trigger functions) are available to anon as well, so they are not
       this role's privilege. The assertion is therefore: nothing is executable by the writer that anon cannot also
       execute, other than the two write functions. */
    const fns = await client.query(
      `select p.proname
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname not in ('pg_catalog', 'information_schema') and p.prokind in ('f', 'p')
          and has_function_privilege('mindmosaic_exam_writer', p.oid, 'EXECUTE')
          and not has_function_privilege('anon', p.oid, 'EXECUTE')
        order by 1`,
    );
    expect(fns.rows.map((r: { proname: string }) => r.proname)).toEqual(["create_exam_session_for", "record_exam_attempt_for"]);
  });

  it("can log in and call the two functions; a call for a non-student is refused by the function body, proving it ran", async () => {
    let writer: Client;
    try {
      writer = await connectAsExamWriterRole();
    } catch (error) {
      throw new Error(`cannot connect as mindmosaic_exam_writer — run \`npm run exam-writer:bootstrap\` (${(error as Error).message})`);
    }
    try {
      await expect(
        writer.query(`select public.create_exam_session_for('${TEACHER_D}', '{}'::jsonb, 's', array['q1'], now() + interval '1 hour')`),
      ).rejects.toMatchObject({ code: "MM002" });
      await expect(
        writer.query(`select public.record_exam_attempt_for('${STUDENT_A}', '${SESSION_B}', '{}'::jsonb, '{}'::jsonb)`),
      ).rejects.toMatchObject({ code: "MM003" });
    } finally {
      await writer.end();
    }
  });

  it("over a real connection it can read nothing and execute neither legacy function nor any target-model function", async () => {
    const writer = await connectAsExamWriterRole();
    try {
      for (const sql of [
        `select * from public.exam_sessions limit 1`,
        `select * from public.exam_attempts limit 1`,
        `select * from public.profiles limit 1`,
        `insert into public.exam_attempts (session_id, student_id, responses, result) values ('${SESSION_A}', '${STUDENT_A}', '{}'::jsonb, '{}'::jsonb)`,
        `select public.create_exam_session('{}'::jsonb, 's', array['q1'], now() + interval '1 hour')`,
        `select public.record_exam_attempt('${SESSION_A}', '{}'::jsonb, '{}'::jsonb)`,
        `select public.create_assessment_session('{}'::jsonb, 'k')`,
      ]) {
        await expect(writer.query(sql), sql).rejects.toMatchObject({ code: "42501" });
      }
    } finally {
      await writer.end();
    }
  });
});
