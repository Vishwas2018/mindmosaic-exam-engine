/**
 * Gate A item A2: a teacher can clear a target sitting's manual-review item.
 *
 * ADR-005 Amendment B4 recorded why the marking queue was filtered to
 * legacy-origin sittings — "the marking WRITE path records against
 * `essay_marks.attempt_id` and a target sitting has no attempt. Listing one
 * would put a row in a teacher's queue that no button can clear." This suite is
 * the closing evidence for both halves: the write exists, and the queue clears.
 *
 * The refusal cases are the point as much as the success one. A marking RPC is a
 * function that writes a number onto a child's academic record on the say-so of
 * a caller, so what it refuses — a teacher who does not teach the child, an item
 * the scorer never flagged, a mark above what the item was worth — is the whole
 * of its value.
 *
 * Harness contract as elsewhere: seed as the unrestricted role, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, seed, PARENT_C, STUDENT_A, STUDENT_B, TEACHER_D } from "./fixtures";
import {
  createTargetSession,
  isolatePublishedBank,
  openTestCohort,
  scoreAndSubmit,
  seedPublishedItem,
  servedItems,
  teachClass,
  type ServedItem,
} from "./target-sitting";

let client: Client;
let sessionId: string;
let items: ServedItem[];
let essay: ServedItem;
let objective: ServedItem;

/** A second teacher, who teaches a different child. */
const TEACHER_E = "00000000-0000-0000-0000-00000000000e";

const ESSAY_MARKS = 5;

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

/** The teacher's queue, exactly as `deriveMarkingQueue` computes it: flagged, unmarked. */
async function pendingForTeacher(teacherId: string): Promise<string[]> {
  await asAuthenticated(client, teacherId);
  const result = await client.query<{ question_key: string }>(
    `select q.question_key
       from public.visible_sitting_questions q
       left join public.visible_manual_marks m
         on m.session_id = q.session_id and m.question_key = q.question_key
      where q.pending_manual and m.question_key is null
      order by q.question_key`,
  );
  return result.rows.map((row) => row.question_key);
}

async function recordMark(
  teacherId: string,
  sessionItemId: string,
  marks: number,
  feedback: string | null = null,
): Promise<Record<string, unknown>> {
  await asAuthenticated(client, teacherId);
  const result = await client.query<{ body: Record<string, unknown> }>(
    `select public.record_manual_mark($1::uuid, $2::uuid, $3::numeric, $4::text) as body`,
    [sessionId, sessionItemId, marks, feedback],
  );
  return result.rows[0]!.body;
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await isolatePublishedBank(client);
  await seedPublishedItem(client, "m1", "single_option", 1);
  await seedPublishedItem(client, "m2", "manual", ESSAY_MARKS);

  await asOwner();
  await client.query(`insert into auth.users (id, email) values ($1, 'teacher-e@test.local')`, [
    TEACHER_E,
  ]);
  await client.query(`update public.profiles set role = 'teacher' where id = $1`, [TEACHER_E]);
  await teachClass(client, TEACHER_D, [STUDENT_A]);
  await teachClass(client, TEACHER_E, [STUDENT_B]);

  await openTestCohort(client, STUDENT_A);
  sessionId = await createTargetSession(client, STUDENT_A, "marking-a", {
    yearLevel: 5,
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: 2,
    timing: "untimed",
  });
  items = await servedItems(client, sessionId);

  /* Both answered, so the essay is `manual_review` rather than `unanswered`.
     §14.3: a BLANK manual item is not pending review — there is nothing for a
     person to read — and the marking path must not offer one. */
  await asAuthenticated(client, STUDENT_A);
  await client.query(
    `select public.commit_assessment_responses($1::uuid, $2::jsonb, 1, null, null)`,
    [
      sessionId,
      JSON.stringify(
        Object.fromEntries(
          items.map((item) => [item.sessionItemId, item.marksAvailable === ESSAY_MARKS ? "My working." : "b"]),
        ),
      ),
    ],
  );
  await scoreAndSubmit(client, sessionId);

  essay = items.find((item) => item.marksAvailable === ESSAY_MARKS)!;
  objective = items.find((item) => item.marksAvailable !== ESSAY_MARKS)!;
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("A2 — a target essay can be marked, and the mark clears the queue", () => {
  it("lists the essay as pending before the mark and not after it", async () => {
    /* The listing itself is half the item: step 8 filtered target sittings OUT
       of this view's consumers, so a target essay never reached a queue at all. */
    expect(await pendingForTeacher(TEACHER_D)).toEqual([essay.itemCode]);

    await recordMark(TEACHER_D, essay.sessionItemId, 4, "Clear method.");

    expect(await pendingForTeacher(TEACHER_D)).toEqual([]);
  });

  it("shows the teacher the mark it recorded, through the shared view", async () => {
    await recordMark(TEACHER_D, essay.sessionItemId, 4, "Clear method.");

    await asAuthenticated(client, TEACHER_D);
    const marks = await client.query<{
      question_key: string;
      awarded_marks: string;
      max_marks: string;
      marked_by: string;
      feedback: string;
      origin: string;
    }>(`select * from public.visible_manual_marks`);

    expect(marks.rows).toHaveLength(1);
    expect(marks.rows[0]).toMatchObject({
      origin: "version_pinned",
      question_key: essay.itemCode,
      marked_by: TEACHER_D,
      feedback: "Clear method.",
    });
    expect(Number(marks.rows[0]!.awarded_marks)).toBe(4);
  });

  it("takes the ceiling from the pinned item version, not from the request", async () => {
    /* The request carries a mark and a comment and nothing else. `max_marks`
       being right is therefore a property of where the function read it, which
       is the single thing an INSERT policy could not have guaranteed. */
    const body = await recordMark(TEACHER_D, essay.sessionItemId, 3);
    expect(Number(body.maxMarks)).toBe(ESSAY_MARKS);

    await asOwner();
    const stored = await client.query<{ max_marks: string; marked_by: string }>(
      `select max_marks, marked_by from public.manual_marks where session_item_id = $1`,
      [essay.sessionItemId],
    );
    expect(Number(stored.rows[0]!.max_marks)).toBe(ESSAY_MARKS);
    expect(stored.rows[0]!.marked_by).toBe(TEACHER_D);
  });

  it("re-marks in place rather than accumulating rows", async () => {
    await recordMark(TEACHER_D, essay.sessionItemId, 2, "Needs more detail.");
    await recordMark(TEACHER_D, essay.sessionItemId, 4, "Revised up on appeal.");

    await asOwner();
    const rows = await client.query<{ awarded_marks: string; feedback: string }>(
      `select awarded_marks, feedback from public.manual_marks where session_id = $1`,
      [sessionId],
    );
    /* One row, not two: there is no delete path on this table, so a re-mark that
       inserted would leave a child with two different marks for one answer and
       no rule for which is theirs. */
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]!.feedback).toBe("Revised up on appeal.");
  });

  it("leaves the sitting's own result untouched", async () => {
    /* `assessment_results` is immutable, exactly as `exam_attempts.result` is: a
       mark is a new row beside the score the learner was shown, never an edit to
       it. Asserted here because this is the first path that could have tried. */
    await asOwner();
    const before = await client.query(`select * from public.assessment_results where session_id = $1`, [
      sessionId,
    ]);
    await recordMark(TEACHER_D, essay.sessionItemId, 5);
    await asOwner();
    const after = await client.query(`select * from public.assessment_results where session_id = $1`, [
      sessionId,
    ]);
    expect(after.rows).toEqual(before.rows);
  });
});

describe("A2 — who may not mark, and what they are told", () => {
  it("refuses a teacher who does not teach this child, without confirming the sitting exists", async () => {
    await asAuthenticated(client, TEACHER_E);
    await inSavepoint(() =>
      expect(
        client.query(`select public.record_manual_mark($1::uuid, $2::uuid, 4::numeric, null)`, [
          sessionId,
          essay.sessionItemId,
        ]),
      ).rejects.toMatchObject({ code: "MM217" }),
    );

    /* The same code a wholly imaginary session gets. If these differed, a
       signed-in stranger could confirm that a given session id is a real
       child's sitting by watching which error came back. */
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.record_manual_mark(gen_random_uuid(), gen_random_uuid(), 4::numeric, null)`,
        ),
      ).rejects.toMatchObject({ code: "MM217" }),
    );
  });

  it("refuses anon outright", async () => {
    await asAnon(client);
    await inSavepoint(() =>
      expect(
        client.query(`select public.record_manual_mark($1::uuid, $2::uuid, 4::numeric, null)`, [
          sessionId,
          essay.sessionItemId,
        ]),
      ).rejects.toMatchObject({ code: "42501" }),
    );
    await inSavepoint(() =>
      expect(
        client.query(`select public.get_manual_review_response($1::uuid, $2::uuid)`, [
          sessionId,
          essay.sessionItemId,
        ]),
      ).rejects.toMatchObject({ code: "42501" }),
    );
  });

  it("refuses the learner and their parent", async () => {
    for (const actor of [STUDENT_A, PARENT_C]) {
      await asAuthenticated(client, actor);
      await inSavepoint(() =>
        expect(
          client.query(`select public.record_manual_mark($1::uuid, $2::uuid, 5::numeric, null)`, [
            sessionId,
            essay.sessionItemId,
          ]),
        ).rejects.toMatchObject({ code: "MM217" }),
      );
    }
  });

  it("still grants no direct write on manual_marks to anybody signed in", async () => {
    for (const actor of [TEACHER_D, STUDENT_A, PARENT_C]) {
      await asAuthenticated(client, actor);
      await inSavepoint(() =>
        expect(
          client.query(
            `insert into public.manual_marks (session_id, session_item_id, marked_by, awarded_marks, max_marks)
             values ($1, $2, $3, 5, 5)`,
            [sessionId, essay.sessionItemId, actor],
          ),
        ).rejects.toMatchObject({ code: "42501" }),
      );
    }
  });

  it("keeps per-question marks invisible to the learner and the parent", async () => {
    await recordMark(TEACHER_D, essay.sessionItemId, 4);
    for (const actor of [STUDENT_A, PARENT_C]) {
      await asAuthenticated(client, actor);
      const rows = await client.query<{ n: string }>(
        `select count(*)::text as n from public.visible_manual_marks`,
      );
      expect(rows.rows[0]!.n, actor).toBe("0");
    }
  });
});

describe("A2 — what may not be marked", () => {
  it("refuses an item the scorer did not flag for review", async () => {
    await asAuthenticated(client, TEACHER_D);
    await inSavepoint(() =>
      expect(
        client.query(`select public.record_manual_mark($1::uuid, $2::uuid, 1::numeric, null)`, [
          sessionId,
          objective.sessionItemId,
        ]),
      ).rejects.toMatchObject({ code: "MM218" }),
    );
  });

  it("refuses a mark above what the pinned item version was worth", async () => {
    await asAuthenticated(client, TEACHER_D);
    for (const marks of [ESSAY_MARKS + 1, 99]) {
      await inSavepoint(() =>
        expect(
          client.query(`select public.record_manual_mark($1::uuid, $2::uuid, $3::numeric, null)`, [
            sessionId,
            essay.sessionItemId,
            marks,
          ]),
        ).rejects.toMatchObject({ code: "MM219" }),
      );
    }
    /* And a negative one, which the table's own constraint would also refuse —
       raised here so the caller gets a code rather than a constraint name. */
    await inSavepoint(() =>
      expect(
        client.query(`select public.record_manual_mark($1::uuid, $2::uuid, -1::numeric, null)`, [
          sessionId,
          essay.sessionItemId,
        ]),
      ).rejects.toMatchObject({ code: "MM219" }),
    );
  });

  it("refuses a sitting that has not been submitted", async () => {
    const other = await createTargetSession(client, STUDENT_A, "marking-unsubmitted", {
      yearLevel: 5,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: 2,
      timing: "untimed",
    });
    const otherItems = await servedItems(client, other);

    await asAuthenticated(client, TEACHER_D);
    await inSavepoint(() =>
      expect(
        client.query(`select public.record_manual_mark($1::uuid, $2::uuid, 1::numeric, null)`, [
          other,
          otherItems[0]!.sessionItemId,
        ]),
      ).rejects.toMatchObject({ code: "MM217" }),
    );
  });

  it("refuses a served item belonging to a different sitting", async () => {
    const other = await createTargetSession(client, STUDENT_A, "marking-other", {
      yearLevel: 5,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: 2,
      timing: "untimed",
    });
    const otherItems = await servedItems(client, other);

    await asAuthenticated(client, TEACHER_D);
    await inSavepoint(() =>
      expect(
        client.query(`select public.record_manual_mark($1::uuid, $2::uuid, 1::numeric, null)`, [
          sessionId,
          otherItems[0]!.sessionItemId,
        ]),
      ).rejects.toMatchObject({ code: "MM217" }),
    );
  });

  it("refuses a backfill copy, so a legacy sitting is never marked on the wrong row", async () => {
    /* A backfilled `assessment_sessions` row is a copy of a legacy sitting
       (ADR-005 Amendment A4) and is read by nothing. Marking it would record a
       mark the teacher's queue could never see, while the legacy original went
       on showing as pending. */
    /* The shared fixture already gives STUDENT_A a terminal legacy sitting — an
       exam_sessions row with an exam_attempts row — which is exactly what the
       backfill selects. */
    await asOwner();
    await client.query(`select public.backfill_legacy_terminal_sessions()`);

    const copy = await client.query<{ id: string }>(
      `select id from public.assessment_sessions
        where legacy_session_id is not null and student_id = $1 limit 1`,
      [STUDENT_A],
    );
    expect(copy.rows).toHaveLength(1);

    await asAuthenticated(client, TEACHER_D);
    await inSavepoint(() =>
      expect(
        client.query(`select public.record_manual_mark($1::uuid, gen_random_uuid(), 1::numeric, null)`, [
          copy.rows[0]!.id,
        ]),
      ).rejects.toMatchObject({ code: "MM217" }),
    );
  });
});

describe("A2 — the marker sees the work, and nothing from the answer table", () => {
  it("returns the prompt, the child's answer and the marks available", async () => {
    await asAuthenticated(client, TEACHER_D);
    const result = await client.query<{ body: Record<string, unknown> }>(
      `select public.get_manual_review_response($1::uuid, $2::uuid) as body`,
      [sessionId, essay.sessionItemId],
    );
    const body = result.rows[0]!.body;

    expect(body.responseValue).toBe("My working.");
    expect(body.marksAvailable).toBe(ESSAY_MARKS);
    expect(body.itemCode).toBe(essay.itemCode);
    expect(body.studentId).toBe(STUDENT_A);
  });

  it("returns no rubric, sample response, answer key or explanation", async () => {
    await asAuthenticated(client, TEACHER_D);
    const result = await client.query<{ body: Record<string, unknown> }>(
      `select public.get_manual_review_response($1::uuid, $2::uuid) as body`,
      [sessionId, essay.sessionItemId],
    );

    /* The seeded rubric text, asserted absent by content rather than by field
       name — a leak through a differently-named key would be the same leak.
       The rubric IS unavailable on this path by design (ADR-006 Amendment D2),
       and that gap is recorded in the readiness checklist rather than closed by
       widening this function. */
    const serialised = JSON.stringify(result.rows[0]!.body);
    expect(serialised).not.toMatch(/Award marks for a clear explanation/);
    expect(serialised).not.toMatch(/rubric|answerKey|sampleResponse|privateExplanation/i);
  });

  it("refuses a teacher who does not teach the child, and an objective item", async () => {
    await asAuthenticated(client, TEACHER_E);
    await inSavepoint(() =>
      expect(
        client.query(`select public.get_manual_review_response($1::uuid, $2::uuid)`, [
          sessionId,
          essay.sessionItemId,
        ]),
      ).rejects.toMatchObject({ code: "MM217" }),
    );

    await asAuthenticated(client, TEACHER_D);
    await inSavepoint(() =>
      expect(
        client.query(`select public.get_manual_review_response($1::uuid, $2::uuid)`, [
          sessionId,
          objective.sessionItemId,
        ]),
      ).rejects.toMatchObject({ code: "MM217" }),
    );
  });

  it("does not become a way to read session_responses generally", async () => {
    await asAuthenticated(client, TEACHER_D);
    await inSavepoint(() =>
      expect(client.query(`select * from public.session_responses`)).rejects.toMatchObject({
        code: "42501",
      }),
    );
  });
});
