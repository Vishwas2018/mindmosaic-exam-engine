import { readFileSync } from "node:fs";
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import {
  asAnon,
  asAuthenticated,
  seed,
  STUDENT_A,
  STUDENT_B,
  PARENT_C,
  TEACHER_D,
} from "./fixtures";

let client: Client;
const hash = "a".repeat(64);
const checks = {
  correctness: true,
  originality: true,
  ageAppropriateness: true,
};

describe("admin draft review approval RLS", () => {
  beforeEach(async () => {
    client = await connect();
    await client.query("begin");
    // Exercise the exact new migration on pre-migration local databases too.
    // DDL and fixtures are rolled back; no persistent schema change is made.
    const { rows } = await client.query(
      "select to_regclass('public.admin_draft_review_approvals') as relation",
    );
    if (!rows[0].relation)
      await client.query(
        readFileSync(
          "supabase/migrations/20261019100000_admin_draft_review_approvals.sql",
          "utf8",
        ),
      );
    await seed(client);
    await client.query("update public.profiles set role='admin' where id=$1", [
      STUDENT_B,
    ]);
  });
  afterEach(async () => {
    await client.query("rollback");
    await client.end();
  });

  async function insert(actor = STUDENT_B) {
    return client.query(
      "insert into public.admin_draft_review_approvals(question_id,content_hash,approved_by,checks) values ('scholarship-y6-vr-001',$1,$2,$3::jsonb) returning *",
      [hash, actor, JSON.stringify(checks)],
    );
  }

  it("denies anonymous reads", async () => {
    await asAnon(client);
    await expect(
      client.query("select * from public.admin_draft_review_approvals"),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it.each([STUDENT_A, PARENT_C, TEACHER_D])(
    "denies non-admin %s writes and hides decisions",
    async (actor) => {
      await asAuthenticated(client, STUDENT_B);
      await insert();
      await asAuthenticated(client, actor);
      expect(
        (
          await client.query(
            "select * from public.admin_draft_review_approvals",
          )
        ).rows,
      ).toEqual([]);
      await expect(insert(actor)).rejects.toMatchObject({ code: "42501" });
    },
  );

  it("allows an admin's explicit decision without creating a student attempt", async () => {
    const before = (
      await client.query("select count(*) from public.exam_attempts")
    ).rows[0].count;
    await asAuthenticated(client, STUDENT_B);
    const approval = await insert();
    expect(approval.rows[0].content_hash).toBe(hash);
    expect(approval.rows[0].approved_by).toBe(STUDENT_B);
    await client.query("reset role");
    expect(
      (await client.query("select count(*) from public.exam_attempts")).rows[0]
        .count,
    ).toBe(before);
  });

  it("denies impersonating another approver", async () => {
    await asAuthenticated(client, STUDENT_B);
    await expect(insert(STUDENT_A)).rejects.toMatchObject({ code: "42501" });
  });

  it("denies revoked admins", async () => {
    await client.query(
      "update public.profiles set access_revoked_at=now() where id=$1",
      [STUDENT_B],
    );
    await asAuthenticated(client, STUDENT_B);
    await expect(insert()).rejects.toMatchObject({ code: "42501" });
  });

  it("does not allow overwriting approval history", async () => {
    await asAuthenticated(client, STUDENT_B);
    await insert();
    await expect(
      client.query(
        "update public.admin_draft_review_approvals set content_hash=$1",
        ["b".repeat(64)],
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
});
