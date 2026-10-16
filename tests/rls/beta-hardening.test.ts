/**
 * Beta hardening (20261016090000, 20261016091000).
 *
 *   1. handle_new_user: a self-service sign-up can only become a parent. The
 *      role a browser puts in user_metadata is ignored; only the
 *      service-role-only app_metadata can name 'student'.
 *   2. parent_request_child_erasure: a parent can request erasure of a child
 *      they are linked to — and of no one else's — and the request revokes
 *      access immediately without deleting anything; the existing processor
 *      then erases the child's data and leaves a sibling family untouched.
 *
 * Harness contract as elsewhere: seed as the unrestricted role, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, seed, PARENT_C, STUDENT_A, STUDENT_B, TEACHER_D } from "./fixtures";

let client: Client;

const OTHER_PARENT = "00000000-0000-0000-0000-0000000000b1";
const NEW_USER = "00000000-0000-0000-0000-0000000000c1";

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

async function insertAuthUser(opts: {
  id: string;
  appMeta?: Record<string, unknown> | null;
  userMeta?: Record<string, unknown> | null;
}): Promise<string | undefined> {
  await asOwner();
  await client.query(
    `insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
     values ($1, $2, $3::jsonb, $4::jsonb)`,
    [
      opts.id,
      `${opts.id}@test.local`,
      opts.appMeta === undefined || opts.appMeta === null ? null : JSON.stringify(opts.appMeta),
      opts.userMeta === undefined || opts.userMeta === null ? null : JSON.stringify(opts.userMeta),
    ],
  );
  const profile = await client.query<{ role: string }>(`select role from public.profiles where id = $1`, [opts.id]);
  return profile.rows[0]?.role;
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

describe("handle_new_user — sign-up can only ever be a parent", () => {
  const GOTRUE = { provider: "email", providers: ["email"] };

  it.each(["student", "teacher", "admin", "superuser", ""])(
    "ignores user_metadata role %j on a GoTrue-created user and makes a parent",
    async (requested) => {
      const role = await insertAuthUser({
        id: NEW_USER,
        appMeta: GOTRUE,
        userMeta: { role: requested, display_name: "Stranger" },
      });
      expect(role).toBe("parent");
    },
  );

  it("makes a parent when no role is supplied at all", async () => {
    expect(await insertAuthUser({ id: NEW_USER, appMeta: GOTRUE, userMeta: { display_name: "No Role" } })).toBe(
      "parent",
    );
  });

  it("still honours the service-role-only app_metadata role for a provisioned student", async () => {
    expect(
      await insertAuthUser({ id: NEW_USER, appMeta: { ...GOTRUE, role: "student" }, userMeta: { role: "parent" } }),
    ).toBe("student");
  });

  it("does not let app_metadata name a role beyond student/parent", async () => {
    expect(await insertAuthUser({ id: NEW_USER, appMeta: { ...GOTRUE, role: "admin" } })).toBe("parent");
  });

  it("keeps the fail-closed 'student' default for a direct SQL insert with no GoTrue metadata", async () => {
    expect(await insertAuthUser({ id: NEW_USER, userMeta: { role: "parent" } })).toBe("student");
  });

  it("still takes display_name from user_metadata", async () => {
    await insertAuthUser({ id: NEW_USER, appMeta: GOTRUE, userMeta: { display_name: "  Ada  " } });
    const row = await client.query<{ display_name: string }>(`select display_name from public.profiles where id = $1`, [
      NEW_USER,
    ]);
    expect(row.rows[0]?.display_name).toBe("Ada");
  });
});

describe("parent_request_child_erasure", () => {
  async function erase(actor: string, child: string): Promise<Record<string, unknown>> {
    await asAuthenticated(client, actor);
    const result = await client.query<{ body: Record<string, unknown> }>(
      `select public.parent_request_child_erasure($1::uuid) as body`,
      [child],
    );
    return result.rows[0]!.body;
  }

  async function addOtherParent(): Promise<void> {
    await insertAuthUser({ id: OTHER_PARENT, appMeta: { provider: "email" } });
  }

  async function seedLiveSession(studentId: string): Promise<void> {
    await asOwner();
    await client.query(`insert into auth.sessions (id, user_id) values (gen_random_uuid(), $1)`, [studentId]);
    await client.query(`insert into auth.refresh_tokens (token, user_id) values ($1, $2)`, [`rt-${studentId}`, studentId]);
  }

  async function count(sql: string, params: unknown[]): Promise<number> {
    await asOwner();
    const result = await client.query<{ n: string }>(sql, params);
    return Number(result.rows[0]!.n);
  }

  it("lets a parent request erasure of their linked child: pending, thirty days out, attributed to the parent", async () => {
    const body = await erase(PARENT_C, STUDENT_A);
    expect(body.studentId).toBe(STUDENT_A);
    expect(body.alreadyRequested).toBe(false);

    await asOwner();
    const row = await client.query<{ status: string; requested_by: string; ticket_ref: string; days_out: string }>(
      `select status, requested_by, ticket_ref,
              round(extract(epoch from (execute_after - requested_at)) / 86400)::text as days_out
         from public.erasure_requests where id = $1`,
      [body.requestId],
    );
    expect(row.rows[0]).toMatchObject({
      status: "pending",
      requested_by: PARENT_C,
      ticket_ref: `parent-self-service:${PARENT_C}`,
      days_out: "30",
    });
  });

  it("revokes the child's access immediately and deletes nothing yet", async () => {
    await seedLiveSession(STUDENT_A);
    const attemptsBefore = await count(`select count(*)::text as n from public.exam_attempts where student_id = $1`, [STUDENT_A]);
    expect(attemptsBefore).toBeGreaterThan(0);

    await erase(PARENT_C, STUDENT_A);

    await asOwner();
    const flags = await client.query<{ revoked: boolean; banned: boolean }>(
      `select p.access_revoked_at is not null as revoked, u.banned_until is not null as banned
         from public.profiles p join auth.users u on u.id = p.id where p.id = $1`,
      [STUDENT_A],
    );
    expect(flags.rows[0]).toEqual({ revoked: true, banned: true });
    expect(await count(`select count(*)::text as n from auth.sessions where user_id = $1`, [STUDENT_A])).toBe(0);
    expect(await count(`select count(*)::text as n from auth.refresh_tokens where user_id = $1`, [STUDENT_A])).toBe(0);

    /* Deletes nothing: the child, the link and the history are all still here. */
    expect(await count(`select count(*)::text as n from public.profiles where id = $1`, [STUDENT_A])).toBe(1);
    expect(await count(`select count(*)::text as n from public.parent_children where child_id = $1`, [STUDENT_A])).toBe(1);
    expect(await count(`select count(*)::text as n from public.exam_attempts where student_id = $1`, [STUDENT_A])).toBe(attemptsBefore);
  });

  it("refuses a child the parent is not linked to, and changes nothing (MM251)", async () => {
    await addOtherParent();

    /* PARENT_C is linked to STUDENT_A only; STUDENT_B belongs to no one here. */
    await asAuthenticated(client, PARENT_C);
    await inSavepoint(() =>
      expect(client.query(`select public.parent_request_child_erasure($1::uuid)`, [STUDENT_B])).rejects.toMatchObject({
        code: "MM251",
      }),
    );
    /* A different parent naming PARENT_C's child is refused the same way. */
    await asAuthenticated(client, OTHER_PARENT);
    await inSavepoint(() =>
      expect(client.query(`select public.parent_request_child_erasure($1::uuid)`, [STUDENT_A])).rejects.toMatchObject({
        code: "MM251",
      }),
    );

    expect(await count(`select count(*)::text as n from public.erasure_requests`, [])).toBe(0);
    expect(await count(`select count(*)::text as n from public.profiles where access_revoked_at is not null`, [])).toBe(0);
  });

  it("gives an unknown child id the same answer as an unlinked one (no existence leak)", async () => {
    await asAuthenticated(client, PARENT_C);
    await inSavepoint(() =>
      expect(
        client.query(`select public.parent_request_child_erasure('99999999-9999-9999-9999-999999999999'::uuid)`),
      ).rejects.toMatchObject({ code: "MM251" }),
    );
  });

  it("refuses a student, a teacher, and a null child (MM250 / MM251)", async () => {
    for (const actor of [STUDENT_A, TEACHER_D]) {
      await asAuthenticated(client, actor);
      await inSavepoint(() =>
        expect(client.query(`select public.parent_request_child_erasure($1::uuid)`, [STUDENT_A])).rejects.toMatchObject({
          code: "MM250",
        }),
      );
    }
    await asAuthenticated(client, PARENT_C);
    await inSavepoint(() =>
      expect(client.query(`select public.parent_request_child_erasure(null)`)).rejects.toMatchObject({ code: "MM251" }),
    );
  });

  it("is not callable by anon", async () => {
    await asAnon(client);
    await expect(
      client.query(`select public.parent_request_child_erasure($1::uuid)`, [STUDENT_A]),
    ).rejects.toMatchObject({ message: expect.stringMatching(/permission denied/i) });
  });

  it("is idempotent: a repeat returns the same pending request rather than a second", async () => {
    const first = await erase(PARENT_C, STUDENT_A);
    const second = await erase(PARENT_C, STUDENT_A);

    expect(second.requestId).toBe(first.requestId);
    expect(second.alreadyRequested).toBe(true);
    expect(
      await count(`select count(*)::text as n from public.erasure_requests where student_id = $1 and status = 'pending'`, [
        STUDENT_A,
      ]),
    ).toBe(1);
  });

  it("does not grant the parent anything on erasure_requests or erase_student", async () => {
    await erase(PARENT_C, STUDENT_A);

    await asAuthenticated(client, PARENT_C);
    await inSavepoint(() =>
      expect(client.query(`select * from public.erasure_requests`)).resolves.toMatchObject({ rows: [] }),
    );
    await inSavepoint(() =>
      expect(client.query(`select public.erase_student($1::uuid, 'x')`, [STUDENT_A])).rejects.toMatchObject({
        message: expect.stringMatching(/permission denied/i),
      }),
    );
  });

  it("end to end: once due, the processor erases that child completely and leaves another family untouched", async () => {
    await erase(PARENT_C, STUDENT_A);

    /* Backdate the window (the function always sets +30 days) and run the
       owner-only worker, exactly as the scheduler would. */
    await asOwner();
    await client.query(
      `update public.erasure_requests
          set requested_at = now() - interval '31 days', execute_after = now() - interval '1 day'
        where student_id = $1`,
      [STUDENT_A],
    );
    await client.query(`select public.process_due_erasures()`);

    for (const table of ["profiles"]) {
      expect(await count(`select count(*)::text as n from public.${table} where id = $1`, [STUDENT_A])).toBe(0);
    }
    expect(await count(`select count(*)::text as n from auth.users where id = $1`, [STUDENT_A])).toBe(0);
    expect(await count(`select count(*)::text as n from public.exam_attempts where student_id = $1`, [STUDENT_A])).toBe(0);
    expect(await count(`select count(*)::text as n from public.exam_sessions where student_id = $1`, [STUDENT_A])).toBe(0);
    expect(await count(`select count(*)::text as n from public.parent_children where child_id = $1`, [STUDENT_A])).toBe(0);
    expect(await count(`select count(*)::text as n from public.erasure_requests where student_id = $1 and status = 'executed'`, [STUDENT_A])).toBe(1);

    /* The other child and the parent are still there. */
    expect(await count(`select count(*)::text as n from public.profiles where id = $1`, [STUDENT_B])).toBe(1);
    expect(await count(`select count(*)::text as n from public.exam_attempts where student_id = $1`, [STUDENT_B])).toBeGreaterThan(0);
    expect(await count(`select count(*)::text as n from public.profiles where id = $1`, [PARENT_C])).toBe(1);
  });
});
