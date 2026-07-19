/**
 * Executable form of docs/RLS_TEST_PLAN.md's R1-R5. Requires a local
 * Supabase Postgres instance with the two migrations applied — see that
 * doc, or the README in this directory, for exact run instructions.
 *
 * Each test opens its own connection, BEGINs, seeds the shared fixture as
 * the unrestricted `postgres` role, impersonates a signed-in user the way
 * PostgREST does, and always ROLLBACKs — no data is left behind.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import {
  asAnon,
  asAuthenticated,
  PARENT_C,
  seed,
  SESSION_B,
  STUDENT_A,
  STUDENT_B,
} from "./fixtures";

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

/**
 * R3's own rule: permission-denied and empty-result-set are both a pass.
 * Runs inside a savepoint so a permission-denied error on one check doesn't
 * abort the outer transaction and cascade into the next check.
 */
async function expectDeniedOrEmpty(sql: string): Promise<void> {
  await client.query("savepoint anon_check");
  try {
    const result = await client.query(sql);
    await client.query("release savepoint anon_check");
    expect(result.rows).toHaveLength(0);
  } catch (error) {
    await client.query("rollback to savepoint anon_check");
    expect((error as Error).message).toMatch(/permission denied/i);
  }
}

describe("RLS: exam_attempts / profiles impersonation (docs/RLS_TEST_PLAN.md)", () => {
  it("R1 (required): student cannot read another student's attempt", async () => {
    await asAuthenticated(client, STUDENT_A);

    const own = await client.query("select student_id from public.exam_attempts");
    expect(own.rows).toEqual([{ student_id: STUDENT_A }]);

    const other = await client.query(
      "select * from public.exam_attempts where student_id = $1",
      [STUDENT_B],
    );
    expect(other.rows).toHaveLength(0);
  });

  it("R2 (required): parent cannot read an unlinked child's attempt", async () => {
    await asAuthenticated(client, PARENT_C);

    const linked = await client.query("select student_id from public.exam_attempts");
    expect(linked.rows).toEqual([{ student_id: STUDENT_A }]);

    const unlinked = await client.query(
      "select * from public.exam_attempts where student_id = $1",
      [STUDENT_B],
    );
    expect(unlinked.rows).toHaveLength(0);
  });

  it("R3: anon reads nothing", async () => {
    await asAnon(client);

    await expectDeniedOrEmpty("select * from public.profiles");
    await expectDeniedOrEmpty("select * from public.exam_attempts");
    await expectDeniedOrEmpty("select * from public.exam_sessions");
  });

  it("R4: student cannot forge an attempt against another student's session", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(
      client.query(
        `insert into public.exam_attempts (session_id, student_id, responses, result)
         values ($1, $2, '{}'::jsonb, '{}'::jsonb)`,
        [SESSION_B, STUDENT_A],
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("R5: student cannot escalate their own role", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expect(
      client.query(`update public.profiles set role = 'admin' where id = $1`, [STUDENT_A]),
    ).rejects.toThrow(/permission denied/i);
  });
});
