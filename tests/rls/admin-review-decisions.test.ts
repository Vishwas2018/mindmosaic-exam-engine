import { readFileSync } from "node:fs";
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import {
  asAnon,
  asAuthenticated,
  PARENT_C,
  seed,
  STUDENT_A,
  STUDENT_B,
  TEACHER_D,
} from "./fixtures";

let client: Client;

const HASH_V1 = "a".repeat(64);
const HASH_V2 = "b".repeat(64);
const PUB_HASH = "c".repeat(64);
const FINGERPRINT = "d".repeat(64);
const ALL_CHECKS = {
  correctness: true,
  originality: true,
  ageAppropriateness: true,
  editorialInterpretation: true,
  difficultyCalibrated: true,
};

describe("admin draft review decisions RLS, immutability, human-only guards and rollback", () => {
  beforeEach(async () => {
    client = await connect();
    await client.query("begin");
    // Apply migrations inside rolled-back transaction if local DB is pre-migration.
    const legacy = await client.query(
      "select to_regclass('public.admin_draft_review_approvals') as rel",
    );
    if (!legacy.rows[0].rel) {
      await client.query(
        readFileSync(
          "supabase/migrations/20261019100000_admin_draft_review_approvals.sql",
          "utf8",
        ),
      );
    }
    const extended = await client.query(
      "select to_regclass('public.admin_draft_review_decisions') as rel",
    );
    if (!extended.rows[0].rel) {
      await client.query(
        readFileSync(
          "supabase/migrations/20261124090000_admin_review_decisions.sql",
          "utf8",
        ),
      );
    }
    await seed(client);
    await client.query("update public.profiles set role='admin' where id=$1", [
      STUDENT_B,
    ]);
  });

  afterEach(async () => {
    await client.query("rollback");
    await client.end();
  });

  async function insertDecision(
    overrides: Partial<{
      bankId: string;
      batchId: string;
      questionId: string;
      itemKind: string;
      pool: string;
      contentHash: string;
      publishedContentHash: string;
      decision: string;
      checks: Record<string, boolean>;
      blindSolved: boolean;
      notes: string;
      reviewerId: string;
      reviewerName: string;
      reviewerEmail: string;
    }> = {},
  ) {
    return client.query(
      `insert into public.admin_draft_review_decisions (
        bank_id, batch_id, question_id, item_kind, pool, source_revision, revision_number,
        content_hash, candidate_hash, published_content_hash, decision, checks, blind_solved,
        notes, reviewer_id, reviewer_name, reviewer_email, question_snapshot, evidence_fingerprint
      ) values (
        $1, $2, $3, $4, $5, 'vihaan-scholarship-500:test', 1,
        $6, $6, $7, $8, $9::jsonb, $10,
        $11, $12, $13, $14, '{"id":"vihaan-e500-m001"}'::jsonb, $15
      ) returning *`,
      [
        overrides.bankId ?? "vihaan-scholarship-500",
        overrides.batchId ?? "vihaan-expansion-01",
        overrides.questionId ?? "vihaan-e500-m001",
        overrides.itemKind ?? "question",
        overrides.pool ?? "practice",
        overrides.contentHash ?? HASH_V1,
        overrides.publishedContentHash ?? PUB_HASH,
        overrides.decision ?? "approve",
        JSON.stringify(overrides.checks ?? ALL_CHECKS),
        overrides.blindSolved ?? true,
        overrides.notes ?? "",
        overrides.reviewerId ?? STUDENT_B,
        overrides.reviewerName ?? "Vishwas Joshi",
        overrides.reviewerEmail ?? "vishwas@mindmosaic.dev",
        FINGERPRINT,
      ],
    );
  }

  async function expectPgError(
    code: string,
    fn: () => Promise<unknown>,
  ): Promise<void> {
    await client.query("savepoint rls_expect_err");
    try {
      await expect(fn()).rejects.toMatchObject({ code });
    } finally {
      await client.query("rollback to savepoint rls_expect_err");
      await client.query("release savepoint rls_expect_err");
    }
  }

  it("denies anonymous reads and writes", async () => {
    await asAnon(client);
    await expectPgError("42501", () =>
      client.query("select * from public.admin_draft_review_decisions"),
    );
    await expectPgError("42501", () => insertDecision());
  });

  it.each([STUDENT_A, PARENT_C, TEACHER_D])(
    "denies non-admin role %s from reading or writing review decisions",
    async (actor) => {
      await asAuthenticated(client, STUDENT_B);
      await insertDecision();

      await asAuthenticated(client, actor);
      const visible = await client.query(
        "select * from public.admin_draft_review_decisions",
      );
      expect(visible.rows).toEqual([]);
      await expectPgError("42501", () => insertDecision({ reviewerId: actor }));
    },
  );

  it("denies impersonating another reviewer_id and denies revoked admins", async () => {
    await asAuthenticated(client, STUDENT_B);
    await expectPgError("42501", () =>
      insertDecision({ reviewerId: STUDENT_A }),
    );

    await client.query("reset role");
    await client.query(
      "update public.profiles set access_revoked_at = now() where id = $1",
      [STUDENT_B],
    );
    await asAuthenticated(client, STUDENT_B);
    await expectPgError("42501", () => insertDecision());
  });

  it("enforces human-only reviewer names, full approval checks, and mandatory revise/reject rationale at the DB boundary", async () => {
    await asAuthenticated(client, STUDENT_B);

    // AI / automated / single-word names rejected by CHECK constraint (23514).
    for (const badName of ["Admin", "Claude Sonnet", "OpenAI Codex", "AI Bot"]) {
      await expectPgError("23514", () =>
        insertDecision({ reviewerName: badName }),
      );
    }

    // Approve without all 5 checks rejected.
    await expectPgError("23514", () =>
      insertDecision({
        decision: "approve",
        checks: { ...ALL_CHECKS, difficultyCalibrated: false },
      }),
    );

    // Revise / reject without >= 10 chars notes rejected.
    await expectPgError("23514", () =>
      insertDecision({ decision: "revise", notes: "too short" }),
    );
    await expectPgError("23514", () =>
      insertDecision({ decision: "reject", notes: "" }),
    );
  });

  it("records approve/revise/reject cleanly, blocks duplicate same-revision approval, allows fresh approval after revision change, and enforces immutability", async () => {
    const attemptsBefore = (
      await client.query("select count(*) from public.exam_attempts")
    ).rows[0].count;

    await asAuthenticated(client, STUDENT_B);
    const revReq = await insertDecision({
      decision: "revise",
      notes: "Clarify distractor B wording to eliminate ambiguity.",
    });
    expect(revReq.rows[0].decision).toBe("revise");

    const approvedV1 = await insertDecision({
      decision: "approve",
      contentHash: HASH_V1,
    });
    expect(approvedV1.rows[0].reviewer_name).toBe("Vishwas Joshi");
    expect(approvedV1.rows[0].blind_solved).toBe(true);

    // Duplicate approval for exact same revision blocked (23505).
    await expectPgError("23505", () =>
      insertDecision({ decision: "approve", contentHash: HASH_V1 }),
    );

    // Approval for a new revision (HASH_V2) succeeds.
    const approvedV2 = await insertDecision({
      decision: "approve",
      contentHash: HASH_V2,
    });
    expect(approvedV2.rows[0].content_hash).toBe(HASH_V2);

    // Authenticated role cannot UPDATE or DELETE (privilege revoked: 42501).
    await expectPgError("42501", () =>
      client.query(
        "update public.admin_draft_review_decisions set notes='tampered'",
      ),
    );
    await expectPgError("42501", () =>
      client.query("delete from public.admin_draft_review_decisions"),
    );

    // Even privileged owner cannot mutate or delete due to immutability trigger (MM106).
    await client.query("reset role");
    await expectPgError("MM106", () =>
      client.query(
        "update public.admin_draft_review_decisions set notes='tampered'",
      ),
    );
    await expectPgError("MM106", () =>
      client.query("delete from public.admin_draft_review_decisions"),
    );

    // Student attempts table untouched.
    const attemptsAfter = (
      await client.query("select count(*) from public.exam_attempts")
    ).rows[0].count;
    expect(attemptsAfter).toBe(attemptsBefore);
  });

  it("executes rollback SQL cleanly while preserving legacy admin_draft_review_approvals rows", async () => {
    await asAuthenticated(client, STUDENT_B);
    await client.query(
      "insert into public.admin_draft_review_approvals(question_id, content_hash, approved_by, checks) values ('scholarship-y6-vr-001', $1, $2, '{\"correctness\":true,\"originality\":true,\"ageAppropriateness\":true}'::jsonb)",
      [HASH_V1, STUDENT_B],
    );
    await insertDecision();

    await client.query("reset role");
    const rollbackSql = readFileSync(
      "supabase/migrations/rollbacks/20261124090000_admin_review_decisions.down.sql",
      "utf8",
    )
      // Execute inside our outer test transaction without nested BEGIN/COMMIT.
      .replace(/^\s*begin;\s*$/gim, "")
      .replace(/^\s*commit;\s*$/gim, "");
    await client.query(rollbackSql);

    const dropped = await client.query(
      "select to_regclass('public.admin_draft_review_decisions') as rel",
    );
    expect(dropped.rows[0].rel).toBeNull();

    const preserved = await client.query(
      "select count(*)::int as n from public.admin_draft_review_approvals where question_id = 'scholarship-y6-vr-001'",
    );
    expect(preserved.rows[0].n).toBe(1);
  });
});
