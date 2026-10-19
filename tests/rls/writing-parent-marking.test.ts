/**
 * RLS coverage for supabase/migrations/20261013090000_timed_writing_parent_marking.sql.
 *
 * Same shape as essay-marks.test.ts: seed the shared student/parent fixture as
 * `postgres`, impersonate a signed-in user, always ROLLBACK.
 *
 * What this file exists to prove:
 *   - a parent can mark ONLY their linked children's responses;
 *   - a child can read their marks and cannot write, edit or delete them;
 *   - the deadline is the server's: a submission at/after it is `timer_expired`
 *     whatever the caller claimed, and autosave stops at the deadline.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, PARENT_C, seed, STUDENT_A, STUDENT_B } from "./fixtures";

const PARENT_E = "00000000-0000-0000-0000-00000000000e"; // a parent linked to nobody
const TASK = "dev-fixture-task";
const SCORES = { punctuation: 3, creativity: 4, construction: 3, grammar: 5, spelling: 2, relevance: 4 };

let client: Client;

/** Runs `sql` inside a savepoint so an expected failure does not abort the test transaction. */
async function failsWith(sql: string, params: unknown[], pattern: RegExp): Promise<void> {
  await client.query("savepoint expected");
  let message = "";
  try {
    await client.query(sql, params);
  } catch (error) {
    message = String((error as { message?: string; code?: string }).message) + " " + String((error as { code?: string }).code);
  }
  await client.query("rollback to savepoint expected");
  expect(message, `expected ${sql} to fail`).toMatch(pattern);
}

async function startAs(student: string, mode = "timed", seconds: number | null = 900): Promise<string> {
  await asAuthenticated(client, student);
  const { rows } = await client.query(`select id from public.start_writing_attempt($1, $2, $3)`, [TASK, mode, seconds]);
  return rows[0].id as string;
}

async function submittedAttemptFor(student: string): Promise<string> {
  const id = await startAs(student, "untimed", null);
  await client.query(`select public.submit_writing_attempt($1, 'Once upon a time.', 'user_submitted')`, [id]);
  return id;
}

async function backToPostgres(): Promise<void> {
  await client.query("reset role");
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await client.query(`insert into auth.users (id, email) values ($1, 'parent-e@test.local')`, [PARENT_E]);
  await client.query(`update public.profiles set role = 'parent' where id = $1`, [PARENT_E]);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("writing attempts: server-authoritative deadline", () => {
  it("sets the deadline on the server and resumes the open attempt instead of starting a second clock", async () => {
    const first = await startAs(STUDENT_A);
    const again = await startAs(STUDENT_A);
    expect(again).toBe(first);

    await backToPostgres();
    const { rows } = await client.query(
      `select extract(epoch from deadline_at - started_at)::int as secs, mode from public.writing_attempts where id = $1`,
      [first],
    );
    expect(rows[0]).toEqual({ secs: 900, mode: "timed" });
  });

  it("autosaves before the deadline and refuses after it", async () => {
    const id = await startAs(STUDENT_A);
    await client.query(`select public.save_writing_draft($1, 'Draft one')`, [id]);

    await backToPostgres();
    await client.query(`update public.writing_attempts set deadline_at = now() - interval '1 second' where id = $1`, [id]);
    await asAuthenticated(client, STUDENT_A);
    await failsWith(`select public.save_writing_draft($1, 'Too late')`, [id], /MM313/);
  });

  it("treats a submission after the deadline as timer_expired whatever reason was sent, clamped to the deadline", async () => {
    const id = await startAs(STUDENT_A);
    await client.query(`select public.save_writing_draft($1, 'Saved draft')`, [id]);

    await backToPostgres();
    await client.query(`update public.writing_attempts set deadline_at = now() - interval '30 seconds' where id = $1`, [id]);
    await asAuthenticated(client, STUDENT_A);
    const { rows } = await client.query(
      `select submission_reason, response_text, submitted_at = deadline_at as clamped
         from public.submit_writing_attempt($1, 'Final text', 'user_submitted')`,
      [id],
    );
    expect(rows[0]).toEqual({ submission_reason: "timer_expired", response_text: "Final text", clamped: true });
  });

  it("keeps the last autosaved text when the final submit carries none", async () => {
    const id = await startAs(STUDENT_A);
    await client.query(`select public.save_writing_draft($1, 'Autosaved words')`, [id]);
    const { rows } = await client.query(`select response_text from public.submit_writing_attempt($1, null, 'timer_expired')`, [id]);
    expect(rows[0].response_text).toBe("Autosaved words");
  });

  it("submitting twice changes nothing the second time", async () => {
    const id = await startAs(STUDENT_A);
    const first = await client.query(`select submitted_at from public.submit_writing_attempt($1, 'One', 'user_submitted')`, [id]);
    const second = await client.query(`select submitted_at, response_text from public.submit_writing_attempt($1, 'Two', 'user_submitted')`, [id]);
    expect(second.rows[0].submitted_at).toEqual(first.rows[0].submitted_at);
    expect(second.rows[0].response_text).toBe("One");
  });

  it("an untimed attempt has no deadline and can never be timer_expired by the server", async () => {
    const id = await startAs(STUDENT_A, "untimed", null);
    const { rows } = await client.query(`select submission_reason, deadline_at from public.submit_writing_attempt($1, 'Text', 'user_submitted')`, [id]);
    expect(rows[0]).toEqual({ submission_reason: "user_submitted", deadline_at: null });
  });
});

describe("writing attempts: who can touch what", () => {
  it("another child cannot save to, submit or read someone else's attempt", async () => {
    const id = await startAs(STUDENT_A);
    await asAuthenticated(client, STUDENT_B);
    await failsWith(`select public.save_writing_draft($1, 'x')`, [id], /MM310/);
    await failsWith(`select public.submit_writing_attempt($1, 'x', 'user_submitted')`, [id], /MM310/);
    const { rows } = await client.query(`select id from public.writing_attempts where id = $1`, [id]);
    expect(rows).toEqual([]);
  });

  it("a child cannot write the tables directly", async () => {
    const id = await startAs(STUDENT_A);
    await failsWith(`update public.writing_attempts set response_text = 'x', deadline_at = now() + interval '1 day' where id = $1`, [id], /permission denied/);
    await failsWith(
      `insert into public.writing_attempts (student_id, task_id, mode, created_by, submitted_at, submission_reason)
       values ($1, 't', 'untimed', $1, now(), 'user_submitted')`,
      [STUDENT_A],
      /permission denied/,
    );
  });

  it("anonymous callers can execute nothing", async () => {
    await asAnon(client);
    await failsWith(`select public.start_writing_attempt('t', 'untimed', null)`, [], /permission denied/);
    await failsWith(`select * from public.writing_attempts`, [], /permission denied/);
  });

  it("a linked parent can read the child's attempt; an unlinked parent and another child cannot", async () => {
    const id = await submittedAttemptFor(STUDENT_A);

    await asAuthenticated(client, PARENT_C);
    expect((await client.query(`select id from public.writing_attempts where id = $1`, [id])).rows).toHaveLength(1);

    await asAuthenticated(client, PARENT_E);
    expect((await client.query(`select id from public.writing_attempts where id = $1`, [id])).rows).toEqual([]);

    await asAuthenticated(client, STUDENT_B);
    expect((await client.query(`select id from public.writing_attempts where id = $1`, [id])).rows).toEqual([]);
  });
});

describe("parent marking", () => {
  it("a linked parent marks a submitted response; the total and ceiling are derived server-side", async () => {
    const id = await submittedAttemptFor(STUDENT_A);
    await asAuthenticated(client, PARENT_C);

    const { rows } = await client.query(
      `select awarded_marks::int as awarded, max_marks::int as max, marked_by
         from public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, $3::jsonb, 'Lovely ending.')`,
      [id, JSON.stringify(SCORES), JSON.stringify({ spelling: "Check the double letters." })],
    );
    expect(rows[0]).toEqual({ awarded: 21, max: 30, marked_by: PARENT_C });

    const criteria = await client.query(
      `select criterion_id, score, comment from public.writing_mark_criteria order by criterion_id`,
    );
    expect(criteria.rows).toHaveLength(6);
    expect(criteria.rows.find((row) => row.criterion_id === "spelling")).toEqual({
      criterion_id: "spelling",
      score: 2,
      comment: "Check the double letters.",
    });
  });

  it("re-marking updates the one mark rather than adding another", async () => {
    const id = await submittedAttemptFor(STUDENT_A);
    await asAuthenticated(client, PARENT_C);
    await client.query(`select public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, null)`, [id, JSON.stringify(SCORES)]);
    await client.query(
      `select public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, null)`,
      [id, JSON.stringify({ ...SCORES, spelling: 4 })],
    );
    const { rows } = await client.query(`select awarded_marks::int as awarded from public.writing_marks where attempt_id = $1`, [id]);
    expect(rows).toEqual([{ awarded: 23 }]);
    expect((await client.query(`select 1 from public.writing_mark_criteria`)).rows).toHaveLength(6);
  });

  it("an unlinked parent cannot mark another family's child", async () => {
    const id = await submittedAttemptFor(STUDENT_A);
    await asAuthenticated(client, PARENT_E);
    await failsWith(
      `select public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, null)`,
      [id, JSON.stringify(SCORES)],
      /MM310/,
    );
  });

  it("a parent cannot mark a child they are not linked to even though they are linked to another", async () => {
    const id = await submittedAttemptFor(STUDENT_B);
    await asAuthenticated(client, PARENT_C); // linked to A only
    await failsWith(
      `select public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, null)`,
      [id, JSON.stringify(SCORES)],
      /MM310/,
    );
  });

  it("a child cannot mark their own response", async () => {
    const id = await submittedAttemptFor(STUDENT_A);
    await failsWith(
      `select public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, null)`,
      [id, JSON.stringify(SCORES)],
      /MM310/,
    );
  });

  it("refuses an unsubmitted attempt, a missing or unknown criterion, and out-of-scale or fractional scores", async () => {
    const open = await startAs(STUDENT_A);
    await asAuthenticated(client, PARENT_C);
    await failsWith(
      `select public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, null)`,
      [open, JSON.stringify(SCORES)],
      /MM311/,
    );

    await backToPostgres();
    await client.query(`update public.writing_attempts set submitted_at = now(), submission_reason = 'user_submitted' where id = $1`, [open]);
    await asAuthenticated(client, PARENT_C);
    const mark = (scores: unknown) =>
      failsWith(
        `select public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, null)`,
        [open, JSON.stringify(scores)],
        /MM312/,
      );
    const missing: Record<string, number> = { ...SCORES };
    delete missing.grammar;
    await mark(missing);
    await mark({ ...SCORES, handwriting: 3 });
    await mark({ ...SCORES, spelling: 6 });
    await mark({ ...SCORES, spelling: 0 });
    await mark({ ...SCORES, spelling: 2.5 });
    await failsWith(
      `select public.mark_writing_attempt($1, 'no-such-rubric', 1, $2::jsonb, '{}'::jsonb, null)`,
      [open, JSON.stringify(SCORES)],
      /MM312/,
    );
  });

  it("the caller cannot choose the ceiling or the marker: there is no such parameter and the table is not writable", async () => {
    const id = await submittedAttemptFor(STUDENT_A);
    await asAuthenticated(client, PARENT_C);
    await failsWith(
      `insert into public.writing_marks (attempt_id, rubric_id, rubric_version, marked_by, awarded_marks, max_marks)
       values ($1, 'scholarship-written-expression', 1, $2, 30, 30)`,
      [id, PARENT_C],
      /permission denied/,
    );
  });
});

describe("a child's view of their marks", () => {
  async function markedAttempt(): Promise<string> {
    const id = await submittedAttemptFor(STUDENT_A);
    await asAuthenticated(client, PARENT_C);
    await client.query(`select public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, 'Nice work')`, [id, JSON.stringify(SCORES)]);
    return id;
  }

  it("the child reads their own mark, criteria and feedback", async () => {
    const id = await markedAttempt();
    await asAuthenticated(client, STUDENT_A);
    const mark = await client.query(`select awarded_marks::int as awarded, feedback from public.writing_marks where attempt_id = $1`, [id]);
    expect(mark.rows).toEqual([{ awarded: 21, feedback: "Nice work" }]);
    expect((await client.query(`select 1 from public.writing_mark_criteria`)).rows).toHaveLength(6);
  });

  it("the child cannot edit, insert or delete a mark or a criterion score", async () => {
    const id = await markedAttempt();
    await asAuthenticated(client, STUDENT_A);
    await failsWith(`update public.writing_marks set awarded_marks = 30 where attempt_id = $1`, [id], /permission denied/);
    await failsWith(`delete from public.writing_marks where attempt_id = $1`, [id], /permission denied/);
    await failsWith(`update public.writing_mark_criteria set score = 5`, [], /permission denied/);
    await failsWith(`delete from public.writing_mark_criteria`, [], /permission denied/);
  });

  it("another child and an unlinked parent see no marks", async () => {
    await markedAttempt();
    for (const who of [STUDENT_B, PARENT_E]) {
      await asAuthenticated(client, who);
      expect((await client.query(`select 1 from public.writing_marks`)).rows).toEqual([]);
      expect((await client.query(`select 1 from public.writing_mark_criteria`)).rows).toEqual([]);
    }
  });
});

describe("paper attempts typed in by a parent", () => {
  it("a linked parent records a paper response for their child; it arrives submitted and markable", async () => {
    await asAuthenticated(client, PARENT_C);
    const { rows } = await client.query(
      `select id, mode, response_source, submission_reason from public.record_paper_writing_attempt($1, $2, 'The door creaked open.', 900)`,
      [STUDENT_A, TASK],
    );
    expect(rows[0]).toMatchObject({ mode: "paper", response_source: "parent_typed", submission_reason: "user_submitted" });
    await client.query(
      `select public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, null)`,
      [rows[0].id, JSON.stringify(SCORES)],
    );
  });

  it("an unlinked parent cannot record a response for someone else's child", async () => {
    await asAuthenticated(client, PARENT_E);
    await failsWith(`select public.record_paper_writing_attempt($1, $2, 'text', 900)`, [STUDENT_A, TASK], /MM310/);
    await failsWith(`select public.record_paper_writing_attempt($1, $2, null, 900)`, [STUDENT_A, TASK], /MM310/);
  });

  it("typing the response in is optional: no text, or only whitespace, is a paper-only attempt with an empty response", async () => {
    await asAuthenticated(client, PARENT_C);
    for (const text of [null, "", "   \n "]) {
      const { rows } = await client.query(
        `select mode, response_source, response_text, submission_reason from public.record_paper_writing_attempt($1, $2, $3, null)`,
        [STUDENT_A, TASK, text],
      );
      expect(rows[0]).toEqual({ mode: "paper", response_source: "paper_only", response_text: "", submission_reason: "user_submitted" });
    }
  });

  it("a paper-only attempt can then be marked like any other", async () => {
    await asAuthenticated(client, PARENT_C);
    const { rows } = await client.query(`select id from public.record_paper_writing_attempt($1, $2, null, null)`, [STUDENT_A, TASK]);
    const mark = await client.query(
      `select awarded_marks::int as awarded, max_marks::int as max from public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, null)`,
      [rows[0].id, JSON.stringify(SCORES)],
    );
    expect(mark.rows[0]).toEqual({ awarded: 21, max: 30 });
  });

  it("the table refuses a paper-only row that carries text, or one that is not a paper attempt", async () => {
    await backToPostgres();
    await failsWith(
      `insert into public.writing_attempts (student_id, task_id, mode, created_by, submitted_at, submission_reason, response_source, response_text)
       values ($1, 't', 'paper', $1, now(), 'user_submitted', 'paper_only', 'some text')`,
      [STUDENT_A],
      /writing_attempts_paper_only_is_empty/,
    );
    await failsWith(
      `insert into public.writing_attempts (student_id, task_id, mode, created_by, response_source)
       values ($1, 't', 'untimed', $1, 'paper_only')`,
      [STUDENT_A],
      /writing_attempts_paper_only_is_empty/,
    );
  });
});

describe("marked on paper in one step (record_marked_paper_attempt)", () => {
  /* Two statements, not a join: rows a function inserts are not visible to the same statement's snapshot. */
  const record = `select public.record_marked_paper_attempt($1, $2, $3, null, 'scholarship-written-expression', 1, $4::jsonb, $5::jsonb, $6)`;
  const call = record;
  async function recorded(args: unknown[]) {
    await client.query(record, args);
    const { rows } = await client.query(
      `select a.id, a.response_source, a.response_text, m.awarded_marks::int as awarded, m.max_marks::int as max
         from public.writing_attempts a join public.writing_marks m on m.attempt_id = a.id`,
    );
    return rows;
  }

  it("records the attempt and all six scores and comments with no response text", async () => {
    await asAuthenticated(client, PARENT_C);
    const rows = await recorded([
      STUDENT_A,
      TASK,
      null,
      JSON.stringify(SCORES),
      JSON.stringify({ spelling: "Double letters.", creativity: "Lovely image of the lighthouse." }),
      "Well done.",
    ]);
    expect(rows[0]).toMatchObject({ response_source: "paper_only", response_text: "", awarded: 21, max: 30 });

    const criteria = await client.query(`select criterion_id, score, comment from public.writing_mark_criteria order by criterion_id`);
    expect(criteria.rows).toHaveLength(6);
    expect(criteria.rows.find((row) => row.criterion_id === "creativity")?.comment).toBe("Lovely image of the lighthouse.");
    expect(criteria.rows.find((row) => row.criterion_id === "punctuation")?.comment).toBeNull();
  });

  it("keeps an optional typed response when one is given", async () => {
    await asAuthenticated(client, PARENT_C);
    const rows = await recorded([STUDENT_A, TASK, "The door creaked open.", JSON.stringify(SCORES), "{}", null]);
    expect(rows[0]).toMatchObject({ response_source: "parent_typed", response_text: "The door creaked open." });
  });

  it("the child sees the marks it produced", async () => {
    await asAuthenticated(client, PARENT_C);
    await client.query(call, [STUDENT_A, TASK, null, JSON.stringify(SCORES), "{}", null]);
    await asAuthenticated(client, STUDENT_A);
    const { rows } = await client.query(`select awarded_marks::int as awarded from public.writing_marks`);
    expect(rows).toEqual([{ awarded: 21 }]);
  });

  it("a bad score rolls the whole thing back: no attempt is left behind", async () => {
    await asAuthenticated(client, PARENT_C);
    await failsWith(call, [STUDENT_A, TASK, null, JSON.stringify({ ...SCORES, spelling: 9 }), "{}", null], /MM312/);
    const missing: Record<string, number> = { ...SCORES };
    delete missing.grammar;
    await failsWith(call, [STUDENT_A, TASK, null, JSON.stringify(missing), "{}", null], /MM312/);
    expect((await client.query(`select 1 from public.writing_attempts`)).rows).toEqual([]);
    expect((await client.query(`select 1 from public.writing_marks`)).rows).toEqual([]);
  });

  it("only a linked parent can use it: not another family's parent, not a child, not anonymous", async () => {
    const args = [STUDENT_A, TASK, null, JSON.stringify(SCORES), "{}", null];
    await asAuthenticated(client, PARENT_E);
    await failsWith(call, args, /MM310/);
    await asAuthenticated(client, STUDENT_A);
    await failsWith(call, args, /MM310/);
    await asAuthenticated(client, STUDENT_B);
    await failsWith(call, args, /MM310/);
    await asAnon(client);
    await failsWith(call, args, /permission denied/);
    await backToPostgres();
    expect((await client.query(`select 1 from public.writing_attempts`)).rows).toEqual([]);
  });

  it("erasing the child removes a paper-only attempt and its marks", async () => {
    await asAuthenticated(client, PARENT_C);
    await client.query(call, [STUDENT_A, TASK, null, JSON.stringify(SCORES), "{}", null]);
    await backToPostgres();
    await client.query(`select public.erase_student($1, null)`, [STUDENT_A]);
    expect((await client.query(`select 1 from public.writing_attempts`)).rows).toEqual([]);
    expect((await client.query(`select 1 from public.writing_mark_criteria`)).rows).toEqual([]);
  });
});

describe("rubric data", () => {
  it("ships the one rubric with six criteria on a 1-5 scale", async () => {
    await asAuthenticated(client, STUDENT_A);
    const { rows } = await client.query(
      `select scale_min, scale_max, jsonb_array_length(criteria) as n from public.writing_rubrics where id = 'scholarship-written-expression'`,
    );
    expect(rows).toEqual([{ scale_min: 1, scale_max: 5, n: 6 }]);
    await failsWith(`update public.writing_rubrics set scale_max = 10`, [], /permission denied/);
  });
});

describe("erasure (spec section 17.5)", () => {
  it("erase_student removes the child's writing, marks and criterion scores, and counts the marks", async () => {
    const id = await submittedAttemptFor(STUDENT_A);
    await asAuthenticated(client, PARENT_C);
    await client.query(`select public.mark_writing_attempt($1, 'scholarship-written-expression', 1, $2::jsonb, '{}'::jsonb, null)`, [id, JSON.stringify(SCORES)]);
    await backToPostgres();

    const { rows } = await client.query(`select (public.erase_student($1, 'ticket-1') ->> 'marksDeleted')::int as marks`, [STUDENT_A]);
    expect(rows[0].marks).toBeGreaterThanOrEqual(1);

    for (const table of ["writing_attempts", "writing_marks"]) {
      expect((await client.query(`select 1 from public.${table}`)).rows, table).toEqual([]);
    }
    expect((await client.query(`select 1 from public.writing_mark_criteria`)).rows).toEqual([]);
  });

  it("erasing one child leaves a sibling's writing alone", async () => {
    await submittedAttemptFor(STUDENT_A);
    await submittedAttemptFor(STUDENT_B);
    await backToPostgres();
    await client.query(`select public.erase_student($1, null)`, [STUDENT_A]);
    const { rows } = await client.query(`select student_id from public.writing_attempts`);
    expect(rows).toEqual([{ student_id: STUDENT_B }]);
  });

  it("a parent's account going away does not take the child's paper response with it", async () => {
    await asAuthenticated(client, PARENT_C);
    const { rows } = await client.query(`select id from public.record_paper_writing_attempt($1, $2, 'Typed from paper.', 900)`, [STUDENT_A, TASK]);
    await backToPostgres();
    await client.query(`delete from public.profiles where id = $1`, [PARENT_C]);
    const kept = await client.query(`select created_by, student_id from public.writing_attempts where id = $1`, [rows[0].id]);
    expect(kept.rows).toEqual([{ created_by: null, student_id: STUDENT_A }]);
  });
});
