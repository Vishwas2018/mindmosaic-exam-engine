/**
 * Gate A item A3: an assignment can be answered by a target-model sitting.
 *
 * `assignment_students.attempt_id` references `exam_attempts (id)`, so a target
 * sitting — which has no attempt — could not be linked to an assignment at all.
 * ADR-005 Amendment B4 recorded it as the second consumer step 8 could not move,
 * and §7 lists it as workflow move 5.
 *
 * Three claims, one per describe block, matching what the readiness checklist
 * says closes this item:
 *
 *   1. assign → sit on target → the score is attributed to the assignment;
 *   2. legacy assignment scoring is unchanged;
 *   3. the same sitting is never counted twice — from either side, and not
 *      against a backfill copy.
 *
 * Harness contract as elsewhere: seed as the unrestricted role, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import {
  asAnon,
  asAuthenticated,
  seed,
  SESSION_A,
  STUDENT_A,
  STUDENT_B,
  TEACHER_D,
} from "./fixtures";
import {
  createTargetSession,
  isolatePublishedBank,
  openTestCohort,
  scoreAndSubmit,
  seedPublishedItem,
  servedItems,
  teachClass,
} from "./target-sitting";

let client: Client;
let assignmentA: string;
let assignmentB: string;

const CONFIG = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 2,
  timing: "untimed",
};

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

/**
 * The assignment score lookup, as `fetch-student-assignments.ts` performs it:
 * whichever of the two linkage columns is set, resolved through the shared
 * rule. One row per assignment, or the read has double counted.
 */
async function assignmentScores(
  studentId: string,
): Promise<{ assignment_id: string; percentage: number | null; sittings: number }[]> {
  await asAuthenticated(client, studentId);
  const result = await client.query<{
    assignment_id: string;
    percentage: number | null;
    sittings: string;
  }>(
    `select ast.assignment_id,
            max(vs.objective_percentage) as percentage,
            count(vs.session_id)::text   as sittings
       from public.assignment_students ast
       left join public.visible_sittings vs
         on (ast.attempt_id is not null and vs.attempt_id = ast.attempt_id)
         or (ast.session_id is not null and vs.session_id = ast.session_id)
      where ast.student_id = $1
      group by ast.assignment_id
      order by ast.assignment_id`,
    [studentId],
  );
  return result.rows.map((row) => ({
    assignment_id: row.assignment_id,
    percentage: row.percentage,
    sittings: Number(row.sittings),
  }));
}

async function link(
  studentId: string,
  assignmentId: string,
  sessionId: string,
): Promise<Record<string, unknown>> {
  await asAuthenticated(client, studentId);
  const result = await client.query<{ body: Record<string, unknown> }>(
    `select public.link_assessment_session_to_assignment($1::uuid, $2::uuid) as body`,
    [assignmentId, sessionId],
  );
  return result.rows[0]!.body;
}

/** A submitted target sitting for the given student, correct on both items. */
async function sitOnTarget(studentId: string, key: string): Promise<string> {
  const sessionId = await createTargetSession(client, studentId, key, CONFIG);
  const items = await servedItems(client, sessionId);
  await asAuthenticated(client, studentId);
  await client.query(
    `select public.commit_assessment_responses($1::uuid, $2::jsonb, 1, null, null)`,
    [sessionId, JSON.stringify(Object.fromEntries(items.map((i) => [i.sessionItemId, "b"])))],
  );
  await scoreAndSubmit(client, sessionId);
  return sessionId;
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await isolatePublishedBank(client);
  await seedPublishedItem(client, "a1");
  await seedPublishedItem(client, "a2");

  const classId = await teachClass(client, TEACHER_D, [STUDENT_A, STUDENT_B]);

  await asOwner();
  const created = await client.query<{ id: string }>(
    `insert into public.assignments (class_id, created_by, config)
     values ($1, $2, $3::jsonb), ($1, $2, $3::jsonb)
     returning id`,
    [classId, TEACHER_D, JSON.stringify({ ...CONFIG, bankId: "curated", title: "Week 1" })],
  );
  assignmentA = created.rows[0]!.id;
  assignmentB = created.rows[1]!.id;

  /* assignmentA is STUDENT_A's; assignmentB is STUDENT_B's alone, so it is
     also the "an assignment I was not given" case without a second fixture. */
  await client.query(
    `insert into public.assignment_students (assignment_id, student_id)
     values ($1, $2), ($3, $4)`,
    [assignmentA, STUDENT_A, assignmentB, STUDENT_B],
  );

  await openTestCohort(client, STUDENT_A);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("A3 — assign, sit on target, score attributed", () => {
  it("attributes the sitting's score to the assignment, once", async () => {
    expect(await assignmentScores(STUDENT_A)).toEqual([
      { assignment_id: assignmentA, percentage: null, sittings: 0 },
    ]);

    const sessionId = await sitOnTarget(STUDENT_A, "assign-a");
    await link(STUDENT_A, assignmentA, sessionId);

    const after = await assignmentScores(STUDENT_A);
    const linked = after.find((row) => row.assignment_id === assignmentA)!;
    /* Both items answered correctly, so 100% — the number the learner's own
       history shows for the same sitting, arrived at through the same view. */
    expect(linked.percentage).toBe(100);
    expect(linked.sittings).toBe(1);

    /* And the other child's assignment gained nothing. A linkage that attached
       a sitting to every assignment in reach would also produce a score there. */
    expect(await assignmentScores(STUDENT_B)).toEqual([
      { assignment_id: assignmentB, percentage: null, sittings: 0 },
    ]);
  });

  it("is idempotent for the same pair", async () => {
    const sessionId = await sitOnTarget(STUDENT_A, "assign-idem");
    const first = await link(STUDENT_A, assignmentA, sessionId);
    const second = await link(STUDENT_A, assignmentA, sessionId);
    expect(second).toEqual(first);

    const scores = await assignmentScores(STUDENT_A);
    expect(scores.find((row) => row.assignment_id === assignmentA)!.sittings).toBe(1);
  });

  it("records the link nowhere a learner could have written it themselves", async () => {
    const sessionId = await sitOnTarget(STUDENT_A, "assign-privilege");

    /* No learner-facing UPDATE on the column at all, for anybody — including
       the teacher who owns the assignment, whose whole-table UPDATE was
       narrowed to the two columns that already had a writer. */
    for (const actor of [STUDENT_A, TEACHER_D]) {
      await asAuthenticated(client, actor);
      await inSavepoint(() =>
        expect(
          client.query(
            `update public.assignment_students set session_id = $1
              where assignment_id = $2 and student_id = $3`,
            [sessionId, assignmentA, STUDENT_A],
          ),
        ).rejects.toMatchObject({ code: "42501" }),
      );
    }

    /* And the teacher's existing power over their own rows is unchanged. */
    await asAuthenticated(client, TEACHER_D);
    await inSavepoint(async () => {
      await expect(
        client.query(
          `update public.assignment_students set status = 'in_progress'
            where assignment_id = $1 and student_id = $2`,
          [assignmentA, STUDENT_A],
        ),
      ).resolves.toBeTruthy();
    });
  });
});

describe("A3 — who may link what", () => {
  it("refuses another learner's sitting", async () => {
    await openTestCohort(client, STUDENT_B);
    const othersSitting = await sitOnTarget(STUDENT_B, "assign-other-student");

    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.link_assessment_session_to_assignment($1::uuid, $2::uuid)`,
          [assignmentA, othersSitting],
        ),
      ).rejects.toMatchObject({ code: "MM220" }),
    );
  });

  it("refuses an assignment the caller was not given", async () => {
    const sessionId = await sitOnTarget(STUDENT_A, "assign-not-mine");

    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.link_assessment_session_to_assignment($1::uuid, $2::uuid)`,
          [assignmentB, sessionId],
        ),
      ).rejects.toMatchObject({ code: "MM220" }),
    );
  });

  it("refuses an imaginary assignment and an imaginary sitting alike", async () => {
    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.link_assessment_session_to_assignment(gen_random_uuid(), gen_random_uuid())`,
        ),
      ).rejects.toMatchObject({ code: "MM220" }),
    );
  });

  it("refuses anon", async () => {
    await asAnon(client);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.link_assessment_session_to_assignment(gen_random_uuid(), gen_random_uuid())`,
        ),
      ).rejects.toMatchObject({ code: "42501" }),
    );
  });

  it("refuses to re-point an assignment at a second sitting", async () => {
    const first = await sitOnTarget(STUDENT_A, "assign-first");
    const second = await sitOnTarget(STUDENT_A, "assign-second");
    await link(STUDENT_A, assignmentA, first);

    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.link_assessment_session_to_assignment($1::uuid, $2::uuid)`,
          [assignmentA, second],
        ),
      ).rejects.toMatchObject({ code: "MM221" }),
    );
  });
});

describe("A3 — the legacy path is unchanged, and nothing is counted twice", () => {
  it("still resolves a legacy assignment through its attempt id", async () => {
    /* The shared fixture gives STUDENT_A a terminal legacy sitting. Linking it
       the way the legacy model always has must produce exactly the score it
       produced before this migration existed. */
    await asOwner();
    const attempt = await client.query<{ id: string }>(
      `select id from public.exam_attempts where session_id = $1`,
      [SESSION_A],
    );
    await client.query(
      `update public.assignment_students set attempt_id = $1
        where assignment_id = $2 and student_id = $3`,
      [attempt.rows[0]!.id, assignmentA, STUDENT_A],
    );

    const scores = await assignmentScores(STUDENT_A);
    expect(scores.find((row) => row.assignment_id === assignmentA)!.sittings).toBe(1);
  });

  it("refuses a row that names both models", async () => {
    const sessionId = await sitOnTarget(STUDENT_A, "assign-both");
    await asOwner();
    const attempt = await client.query<{ id: string }>(
      `select id from public.exam_attempts where session_id = $1`,
      [SESSION_A],
    );
    await client.query(
      `update public.assignment_students set attempt_id = $1
        where assignment_id = $2 and student_id = $3`,
      [attempt.rows[0]!.id, assignmentA, STUDENT_A],
    );

    /* Through the function... */
    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.link_assessment_session_to_assignment($1::uuid, $2::uuid)`,
          [assignmentA, sessionId],
        ),
      ).rejects.toMatchObject({ code: "MM221" }),
    );

    /* ...and through the table, for every role. The check constraint is the
       guarantee; the function's raise is only a better error message. */
    await asOwner();
    await inSavepoint(() =>
      expect(
        client.query(
          `update public.assignment_students set session_id = $1
            where assignment_id = $2 and student_id = $3`,
          [sessionId, assignmentA, STUDENT_A],
        ),
      ).rejects.toMatchObject({ code: "23514" }),
    );
  });

  it("refuses one sitting answering two assignments, for every role", async () => {
    const sessionId = await sitOnTarget(STUDENT_A, "assign-shared");
    await link(STUDENT_A, assignmentA, sessionId);

    await asOwner();
    await client.query(
      `insert into public.assignment_students (assignment_id, student_id) values ($1, $2)`,
      [assignmentB, STUDENT_A],
    );

    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.link_assessment_session_to_assignment($1::uuid, $2::uuid)`,
          [assignmentB, sessionId],
        ),
      ).rejects.toMatchObject({ code: "MM221" }),
    );

    await asOwner();
    await inSavepoint(() =>
      expect(
        client.query(
          `update public.assignment_students set session_id = $1
            where assignment_id = $2 and student_id = $3`,
          [sessionId, assignmentB, STUDENT_A],
        ),
      ).rejects.toMatchObject({ code: "23505" }),
    );
  });

  it("refuses a backfill copy, so a sitting is never scored against the wrong row", async () => {
    /* The double count this whole phase is written against: a backfilled sitting
       exists in both models, and linking the copy would attribute the score
       through a row the resolution rule excludes — while the legacy original,
       which the rule DOES read, stayed unlinked. */
    await asOwner();
    await client.query(`select public.backfill_legacy_terminal_sessions()`);
    const copy = await client.query<{ id: string }>(
      `select id from public.assessment_sessions
        where legacy_session_id is not null and student_id = $1 limit 1`,
      [STUDENT_A],
    );
    expect(copy.rows).toHaveLength(1);

    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.link_assessment_session_to_assignment($1::uuid, $2::uuid)`,
          [assignmentA, copy.rows[0]!.id],
        ),
      ).rejects.toMatchObject({ code: "MM220" }),
    );
  });

  it("counts a linked target sitting once even with the backfill run", async () => {
    const sessionId = await sitOnTarget(STUDENT_A, "assign-with-backfill");
    await link(STUDENT_A, assignmentA, sessionId);

    await asOwner();
    await client.query(`select public.backfill_legacy_terminal_sessions()`);

    const scores = await assignmentScores(STUDENT_A);
    /* One row for the assignment, whatever the backfill has copied. A presence
       probe would have found the sitting under two identities here. */
    expect(scores.find((row) => row.assignment_id === assignmentA)!.sittings).toBe(1);
  });
});
