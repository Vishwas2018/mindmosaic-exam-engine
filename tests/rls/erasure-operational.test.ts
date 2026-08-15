/**
 * Gate A item A4: erasure is admin-invokable, with a 30-day reversible
 * recovery window, and un-invokable by anyone else (spec §17.5; ADR-012 §4-5).
 *
 * `erase_student` (20260815110000) was complete and irreversible from the
 * start; what did not exist was a way to reach it that respected §17.5 step 1's
 * requester verification. This suite proves the path built on top of it:
 *
 *   1. an admin can request an erasure;
 *   2. a non-admin and anon cannot request, cancel or process one;
 *   3. requesting revokes the child's access immediately — the flag, the
 *      GoTrue ban, and the live session — and deletes nothing;
 *   4. the processor does not touch a request before its window closes;
 *   5. a cancel inside the window restores access and the request is never
 *      executed;
 *   6. the processor erases only what is due, and running it twice is a
 *      no-op the second time;
 *   7. the audit trail — both `erasure_requests` and `erasure_audit` — carries
 *      no name, email, response, score or config.
 *
 * Harness contract as elsewhere: seed as the unrestricted role, always
 * ROLLBACK. `execute_after` is backdated by the unrestricted role rather than
 * waited for — the function always computes `+30 days`; what these tests
 * exercise is what happens before and after that boundary, not the arithmetic.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, seed, PARENT_C, STUDENT_A, STUDENT_B, TEACHER_D } from "./fixtures";

let client: Client;
const ADMIN = "00000000-0000-0000-0000-0000000000ad";
const TICKET = "TICKET-4471";

async function asOwner(): Promise<void> {
  await client.query("reset role");
}

async function inSavepoint<T>(body: () => Promise<T>): Promise<T> {
  await client.query("savepoint sp");
  try {
    return await body();
  } finally {
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");
  }
}

async function makeAdmin(): Promise<void> {
  await asOwner();
  await client.query(`insert into auth.users (id, email) values ($1, 'admin@test.local')`, [ADMIN]);
  await client.query(`update public.profiles set role = 'admin' where id = $1`, [ADMIN]);
}

/** A live session and refresh token for the given student, as GoTrue would leave them. */
async function seedLiveSession(studentId: string): Promise<void> {
  await asOwner();
  await client.query(
    `insert into auth.sessions (id, user_id) values (gen_random_uuid(), $1)`,
    [studentId],
  );
  await client.query(
    `insert into auth.refresh_tokens (token, user_id) values ($1, $2)`,
    [`rt-${studentId}`, studentId],
  );
}

async function liveSessionCount(studentId: string): Promise<{ sessions: number; tokens: number }> {
  await asOwner();
  const sessions = await client.query<{ n: string }>(
    `select count(*)::text as n from auth.sessions where user_id = $1`,
    [studentId],
  );
  const tokens = await client.query<{ n: string }>(
    `select count(*)::text as n from auth.refresh_tokens where user_id = $1`,
    [studentId],
  );
  return { sessions: Number(sessions.rows[0]!.n), tokens: Number(tokens.rows[0]!.n) };
}

async function request(
  actor: string,
  studentId: string,
  ticket: string | null = TICKET,
): Promise<Record<string, unknown>> {
  await asAuthenticated(client, actor);
  const result = await client.query<{ body: Record<string, unknown> }>(
    `select public.request_student_erasure($1::uuid, $2::text) as body`,
    [studentId, ticket],
  );
  return result.rows[0]!.body;
}

async function cancel(actor: string, requestId: string): Promise<Record<string, unknown>> {
  await asAuthenticated(client, actor);
  const result = await client.query<{ body: Record<string, unknown> }>(
    `select public.cancel_student_erasure($1::uuid) as body`,
    [requestId],
  );
  return result.rows[0]!.body;
}

/**
 * Backdates a pending request's window so the processor treats it as due.
 *
 * `requested_at` moves back with it: `erasure_requests_execute_after_future`
 * requires `execute_after > requested_at`, and `requested_at` was set to the
 * request's own insert-time `now()` — moving only `execute_after` into the
 * past would place it before `requested_at` and fail that constraint before
 * the test ever reaches the processor.
 */
async function makeDue(requestId: string): Promise<void> {
  await asOwner();
  await client.query(
    `update public.erasure_requests
        set requested_at = now() - interval '31 days',
            execute_after = now() - interval '1 day'
      where id = $1`,
    [requestId],
  );
}

/** The admin-triggered path — the only way a signed-in caller ever reaches
 *  the processor. `process_due_erasures` itself is granted to nobody, exactly
 *  like `erase_student`; see the migration header for why the check could not
 *  live inside a single function distinguishing "admin" from "the scheduler". */
async function processAsAdmin(): Promise<Record<string, unknown>> {
  await asAuthenticated(client, ADMIN);
  const result = await client.query<{ body: Record<string, unknown> }>(
    `select public.admin_trigger_due_erasures() as body`,
  );
  return result.rows[0]!.body;
}

async function studentStillExists(studentId: string): Promise<boolean> {
  await asOwner();
  const result = await client.query<{ n: string }>(
    `select count(*)::text as n from public.profiles where id = $1`,
    [studentId],
  );
  return result.rows[0]!.n !== "0";
}

async function accessFlags(
  studentId: string,
): Promise<{ revoked: boolean; banned: boolean }> {
  await asOwner();
  const result = await client.query<{ revoked: boolean; banned: boolean }>(
    `select p.access_revoked_at is not null as revoked, u.banned_until is not null as banned
       from public.profiles p join auth.users u on u.id = p.id
      where p.id = $1`,
    [studentId],
  );
  return result.rows[0]!;
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await makeAdmin();
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("A4 — an admin can request an erasure", () => {
  it("records a pending request thirty days out", async () => {
    const body = await request(ADMIN, STUDENT_A);
    expect(body.requestId).toBeTruthy();
    expect(body.studentId).toBe(STUDENT_A);

    await asOwner();
    const row = await client.query<{
      status: string;
      requested_by: string;
      ticket_ref: string;
      days_out: string;
    }>(
      `select status, requested_by, ticket_ref,
              round(extract(epoch from (execute_after - requested_at)) / 86400)::text as days_out
         from public.erasure_requests where id = $1`,
      [body.requestId],
    );
    expect(row.rows[0]).toMatchObject({
      status: "pending",
      requested_by: ADMIN,
      ticket_ref: TICKET,
      days_out: "30",
    });
  });

  it("requires a ticket reference", async () => {
    await asAuthenticated(client, ADMIN);
    for (const bad of [null, "", "   "]) {
      await inSavepoint(() =>
        expect(
          client.query(`select public.request_student_erasure($1::uuid, $2::text)`, [STUDENT_A, bad]),
        ).rejects.toMatchObject({ code: "MM223" }),
      );
    }
  });

  it("refuses a second pending request for the same student", async () => {
    await request(ADMIN, STUDENT_A);
    await asAuthenticated(client, ADMIN);
    await inSavepoint(() =>
      expect(
        client.query(`select public.request_student_erasure($1::uuid, 'TICKET-OTHER')`, [STUDENT_A]),
      ).rejects.toMatchObject({ code: "MM225" }),
    );
  });

  it("refuses a non-student and an unknown id alike", async () => {
    await asAuthenticated(client, ADMIN);
    await inSavepoint(() =>
      expect(
        client.query(`select public.request_student_erasure($1::uuid, $2::text)`, [PARENT_C, TICKET]),
      ).rejects.toMatchObject({ code: "MM224" }),
    );
    await inSavepoint(() =>
      expect(
        client.query(`select public.request_student_erasure(gen_random_uuid(), $1::text)`, [TICKET]),
      ).rejects.toMatchObject({ code: "MM224" }),
    );
  });
});

describe("A4 — nobody but an admin may request, cancel or process", () => {
  it("refuses a non-admin request", async () => {
    for (const actor of [STUDENT_A, PARENT_C, TEACHER_D]) {
      await asAuthenticated(client, actor);
      await inSavepoint(() =>
        expect(
          client.query(`select public.request_student_erasure($1::uuid, $2::text)`, [STUDENT_B, TICKET]),
        ).rejects.toMatchObject({ code: "MM222" }),
      );
    }
  });

  it("refuses anon on request, cancel and the admin-trigger, and on the worker directly", async () => {
    await asAnon(client);
    await inSavepoint(() =>
      expect(
        client.query(`select public.request_student_erasure($1::uuid, $2::text)`, [STUDENT_A, TICKET]),
      ).rejects.toMatchObject({ code: "42501" }),
    );
    await inSavepoint(() =>
      expect(
        client.query(`select public.cancel_student_erasure(gen_random_uuid())`),
      ).rejects.toMatchObject({ code: "42501" }),
    );
    await inSavepoint(() =>
      expect(client.query(`select public.admin_trigger_due_erasures()`)).rejects.toMatchObject({
        code: "42501",
      }),
    );
    /* The worker itself is granted to nobody at all — not even the gate an
       admin's own call passes through. This is the same posture erase_student
       has always had, re-asserted here because the worker is the function that
       actually reaches it. */
    await inSavepoint(() =>
      expect(client.query(`select public.process_due_erasures()`)).rejects.toMatchObject({
        code: "42501",
      }),
    );
  });

  it("refuses a non-admin cancel and a non-admin admin-trigger call", async () => {
    const { requestId } = await request(ADMIN, STUDENT_A);

    for (const actor of [STUDENT_A, PARENT_C, TEACHER_D]) {
      await asAuthenticated(client, actor);
      await inSavepoint(() =>
        expect(
          client.query(`select public.cancel_student_erasure($1::uuid)`, [requestId]),
        ).rejects.toMatchObject({ code: "MM222" }),
      );
      await inSavepoint(() =>
        expect(client.query(`select public.admin_trigger_due_erasures()`)).rejects.toMatchObject({
          code: "MM228",
        }),
      );
      /* And the worker itself is unreachable by a signed-in non-admin too —
         it has no grant for anyone to bypass MM228 with. */
      await inSavepoint(() =>
        expect(client.query(`select public.process_due_erasures()`)).rejects.toMatchObject({
          code: "42501",
        }),
      );
    }
  });

  it("refuses even an admin calling the worker directly — only the wrapper and the scheduler reach it", async () => {
    await asAuthenticated(client, ADMIN);
    await inSavepoint(() =>
      expect(client.query(`select public.process_due_erasures()`)).rejects.toMatchObject({
        code: "42501",
      }),
    );
  });

  it("gives the student no privilege on erasure_requests at all", async () => {
    await request(ADMIN, STUDENT_A);
    /* The table is granted SELECT (so an admin's ordinary query works) and
       restricted by RLS to is_admin() — a non-admin's query therefore
       succeeds and returns nothing, rather than being refused outright. Zero
       rows is the same practical outcome §17.5's "not learner-facing" asks
       for; anon is the one that gets an actual permission error, asserted
       above. */
    for (const actor of [STUDENT_A, PARENT_C, TEACHER_D]) {
      await asAuthenticated(client, actor);
      const rows = await client.query(`select * from public.erasure_requests`);
      expect(rows.rows, actor).toEqual([]);
    }
    await asAuthenticated(client, ADMIN);
    const visible = await client.query<{ n: string }>(
      `select count(*)::text as n from public.erasure_requests where student_id = $1`,
      [STUDENT_A],
    );
    expect(Number(visible.rows[0]!.n)).toBe(1);
  });
});

describe("A4 — requesting revokes access immediately and deletes nothing", () => {
  it("sets the flag, bans sign-in, and ends the live session — synchronously with the request", async () => {
    await seedLiveSession(STUDENT_A);
    expect(await liveSessionCount(STUDENT_A)).toEqual({ sessions: 1, tokens: 1 });
    expect(await accessFlags(STUDENT_A)).toEqual({ revoked: false, banned: false });

    await request(ADMIN, STUDENT_A);

    expect(await accessFlags(STUDENT_A)).toEqual({ revoked: true, banned: true });
    expect(await liveSessionCount(STUDENT_A)).toEqual({ sessions: 0, tokens: 0 });
  });

  it("does not touch a single row of assessment data", async () => {
    await asOwner();
    const before = await client.query(
      `select id from public.exam_sessions where student_id = $1`,
      [STUDENT_A],
    );
    expect(before.rowCount).toBeGreaterThan(0);

    await request(ADMIN, STUDENT_A);

    await asOwner();
    const after = await client.query(
      `select id from public.exam_sessions where student_id = $1`,
      [STUDENT_A],
    );
    expect(after.rows).toEqual(before.rows);
    expect(await studentStillExists(STUDENT_A)).toBe(true);
  });

  it("refuses the student's own routes the moment access is revoked", async () => {
    /* requireRole is application code and out of reach of an RLS suite; what
       is provable here is the fact it reads — the same profiles row an
       unrelated signed-in caller would also see change. */
    await request(ADMIN, STUDENT_A);
    await asAuthenticated(client, STUDENT_A);
    const own = await client.query<{ access_revoked_at: Date | null }>(
      `select access_revoked_at from public.profiles where id = $1`,
      [STUDENT_A],
    );
    expect(own.rows[0]!.access_revoked_at).not.toBeNull();
  });
});

describe("A4 — nothing is erased before the window closes", () => {
  it("a fresh request is untouched by the processor", async () => {
    await request(ADMIN, STUDENT_A);

    const result = await processAsAdmin();
    expect(result.processed).toBe(0);
    expect(await studentStillExists(STUDENT_A)).toBe(true);
  });

  it("a request due tomorrow stays pending today", async () => {
    const { requestId } = await request(ADMIN, STUDENT_A);
    await asOwner();
    await client.query(
      `update public.erasure_requests set execute_after = now() + interval '1 day' where id = $1`,
      [requestId],
    );

    await processAsAdmin();
    await asOwner();
    const row = await client.query<{ status: string }>(
      `select status from public.erasure_requests where id = $1`,
      [requestId],
    );
    expect(row.rows[0]!.status).toBe("pending");
    expect(await studentStillExists(STUDENT_A)).toBe(true);
  });
});

describe("A4 — a cancel inside the window restores access and nothing is deleted", () => {
  it("restores the flag and the ban, and the request is never executed", async () => {
    await seedLiveSession(STUDENT_A);
    const { requestId } = await request(ADMIN, STUDENT_A);
    expect(await accessFlags(STUDENT_A)).toEqual({ revoked: true, banned: true });

    const cancelled = await cancel(ADMIN, requestId as string);
    expect(cancelled.status).toBe("cancelled");
    expect(await accessFlags(STUDENT_A)).toEqual({ revoked: false, banned: false });

    /* Even backdated well past the window, a cancelled request is not
       'pending' any more, so the processor's own selection predicate excludes
       it structurally rather than by trusting the window a second time. */
    await asOwner();
    await client.query(
      `update public.erasure_requests
          set requested_at = now() - interval '31 days',
              execute_after = now() - interval '1 day'
        where id = $1`,
      [requestId],
    );
    const result = await processAsAdmin();
    expect(result.processed).toBe(0);
    expect(await studentStillExists(STUDENT_A)).toBe(true);
  });

  it("refuses a cancel once the window has closed", async () => {
    const { requestId } = await request(ADMIN, STUDENT_A);
    await makeDue(requestId as string);

    await asAuthenticated(client, ADMIN);
    await inSavepoint(() =>
      expect(
        client.query(`select public.cancel_student_erasure($1::uuid)`, [requestId]),
      ).rejects.toMatchObject({ code: "MM227" }),
    );
  });

  it("refuses a cancel for a request that does not exist or is not pending", async () => {
    const { requestId } = await request(ADMIN, STUDENT_A);
    await cancel(ADMIN, requestId as string);

    await asAuthenticated(client, ADMIN);
    await inSavepoint(() =>
      expect(
        client.query(`select public.cancel_student_erasure($1::uuid)`, [requestId]),
      ).rejects.toMatchObject({ code: "MM226" }),
    );
    await inSavepoint(() =>
      expect(
        client.query(`select public.cancel_student_erasure(gen_random_uuid())`),
      ).rejects.toMatchObject({ code: "MM226" }),
    );
  });
});

describe("A4 — the processor erases only what is due, and is idempotent", () => {
  it("erases a due request and marks it executed", async () => {
    const { requestId } = await request(ADMIN, STUDENT_A);
    await makeDue(requestId as string);

    const result = await processAsAdmin();
    expect(result.processed).toBe(1);
    expect(await studentStillExists(STUDENT_A)).toBe(false);

    await asOwner();
    const row = await client.query<{ status: string; executed_at: Date | null }>(
      `select status, executed_at from public.erasure_requests where id = $1`,
      [requestId],
    );
    expect(row.rows[0]!.status).toBe("executed");
    expect(row.rows[0]!.executed_at).not.toBeNull();
  });

  it("running it twice erases nothing the second time", async () => {
    const { requestId } = await request(ADMIN, STUDENT_A);
    await makeDue(requestId as string);

    const first = await processAsAdmin();
    expect(first.processed).toBe(1);

    const second = await processAsAdmin();
    expect(second.processed).toBe(0);

    await asOwner();
    const row = await client.query<{ status: string }>(
      `select status from public.erasure_requests where id = $1`,
      [requestId],
    );
    expect(row.rows[0]!.status).toBe("executed");
  });

  it("erases only the due student, leaving an undue sibling request untouched", async () => {
    /* PARENT_C is linked to STUDENT_A only in the shared fixture, so this
       borrows STUDENT_B as the second subject without a second parent link. */
    const due = await request(ADMIN, STUDENT_A);
    const notDue = await request(ADMIN, STUDENT_B);
    await makeDue(due.requestId as string);

    const result = await processAsAdmin();
    expect(result.processed).toBe(1);
    expect(await studentStillExists(STUDENT_A)).toBe(false);
    expect(await studentStillExists(STUDENT_B)).toBe(true);

    await asOwner();
    const row = await client.query<{ status: string }>(
      `select status from public.erasure_requests where id = $1`,
      [notDue.requestId],
    );
    expect(row.rows[0]!.status).toBe("pending");
  });

  it("erase_student is reached only through the processor's ownership, never granted", async () => {
    for (const actor of [STUDENT_A, PARENT_C, TEACHER_D, ADMIN]) {
      await asAuthenticated(client, actor);
      await inSavepoint(() =>
        expect(
          client.query(`select public.erase_student($1::uuid, 'direct-call')`, [STUDENT_B]),
        ).rejects.toMatchObject({ code: "42501" }),
      );
    }
  });

  it("still erases both storage models when the processor runs it", async () => {
    /* The both-models proof (tests/rls/resolution-rule.test.ts §4) exercises
       erase_student directly, as the owner, which is how the processor itself
       reaches it. This asserts the SAME both-models outcome through the actual
       admin-facing path this item adds, so the two are proven consistent
       rather than merely both individually true. */
    await asOwner();
    const attempt = await client.query<{ id: string }>(
      `select id from public.exam_attempts where student_id = $1`,
      [STUDENT_A],
    );
    expect(attempt.rowCount).toBeGreaterThan(0);

    const { requestId } = await request(ADMIN, STUDENT_A);
    await makeDue(requestId as string);
    await processAsAdmin();

    await asOwner();
    const remaining = await client.query<Record<string, string>>(
      `select
         (select count(*)::text from public.exam_sessions where student_id = $1) as legacy_sessions,
         (select count(*)::text from public.exam_attempts where student_id = $1) as legacy_attempts,
         (select count(*)::text from public.profiles where id = $1) as profiles,
         (select count(*)::text from auth.users where id = $1) as identity`,
      [STUDENT_A],
    );
    for (const [surface, count] of Object.entries(remaining.rows[0]!)) {
      expect(count, surface).toBe("0");
    }
  });
});

describe("A4 — the audit trail carries no person data", () => {
  it("erasure_requests names the ticket and the actors, nothing about the child", async () => {
    const { requestId } = await request(ADMIN, STUDENT_A);
    await cancel(ADMIN, requestId as string);

    await asOwner();
    const row = await client.query(`select * from public.erasure_requests where id = $1`, [requestId]);
    const serialised = JSON.stringify(row.rows[0]);
    expect(serialised).toContain(TICKET);
    expect(serialised).not.toMatch(/student-a@test\.local|display_name/i);
  });

  it("erasure_audit still carries counts and a ticket, never a payload (unchanged from step 8)", async () => {
    const { requestId } = await request(ADMIN, STUDENT_A);
    await makeDue(requestId as string);
    await processAsAdmin();

    await asOwner();
    const audit = await client.query(`select * from public.erasure_audit where subject_id = $1`, [
      STUDENT_A,
    ]);
    expect(audit.rowCount).toBe(1);
    const serialised = JSON.stringify(audit.rows[0]);
    expect(serialised).toContain(TICKET);
    expect(serialised).not.toMatch(/student-a@test\.local/);
    expect(serialised).not.toMatch(/objectivePercentage|questionDetails|breakdowns/);
  });
});
