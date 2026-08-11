/**
 * MM-AUD-SEC-002 — adversarial coverage for
 * supabase/migrations/20260811094000_classes_require_teacher_role.sql.
 *
 * The escalation these exist to keep closed: the Phase 0 class policies
 * checked ownership but never role, so any authenticated identity could
 * create a class naming itself the teacher, add an arbitrary student UUID
 * to its roster, and thereby make is_teacher_of_student() return true for
 * that learner. That helper gates read access to the learner's profile,
 * sessions and attempts, and — via 20260719110000 — the INSERT and UPDATE
 * policies on essay_marks, so the chain ended in writing marks on another
 * child's academic record.
 *
 * These tests are written against that whole chain rather than only the
 * insert that starts it: each attacker case asserts the write is refused
 * AND that is_teacher_of_student() stays false, because the write being
 * refused is only interesting insofar as no authority was conferred.
 *
 * Same harness contract as the other files here: seed as the unrestricted
 * role, impersonate the way PostgREST does, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, PARENT_C, seed, STUDENT_A, STUDENT_B, TEACHER_D } from "./fixtures";

let client: Client;

/** A class the attacker already owns, seeded past RLS — see its uses below. */
const FORGED_CLASS = "22222222-0000-0000-0000-0000000000f0";
/** A genuine teacher's class, for the positive controls. */
const REAL_CLASS = "22222222-0000-0000-0000-0000000000e0";

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
 * Asserts a write is refused by RLS, inside a savepoint.
 *
 * The savepoint is load-bearing, not tidiness: a rejected statement aborts
 * the surrounding transaction, so without it the is_teacher_of_student()
 * assertion that follows every attack below would fail with "current
 * transaction is aborted" instead of reporting what the helper returns —
 * and the refusal is only half of what each of these tests claims.
 */
async function expectRefused(sql: string, params: unknown[] = []): Promise<void> {
  await client.query("savepoint attack");
  await expect(client.query(sql, params)).rejects.toThrow(/row-level security/i);
  await client.query("rollback to savepoint attack");
}

/**
 * The question the whole finding turns on: does this caller hold teacher
 * authority over this learner? Evaluated as the currently impersonated
 * user, which is what every downstream policy does.
 */
async function isTeacherOfStudent(student: string): Promise<boolean> {
  const result = await client.query(`select public.is_teacher_of_student($1) as ok`, [student]);
  return result.rows[0].ok === true;
}

/** Seeds a class owned by a non-teacher, past RLS — the pre-migration state. */
async function seedForgedClass(owner: string): Promise<void> {
  await client.query(
    `insert into public.classes (id, teacher_id, name) values ($1, $2, 'Legacy forged')`,
    [FORGED_CLASS, owner],
  );
}

describe("RLS: classes privilege escalation (MM-AUD-SEC-002)", () => {
  it("a student cannot create a class naming themselves teacher", async () => {
    await asAuthenticated(client, STUDENT_A);

    await expectRefused(`insert into public.classes (teacher_id, name) values ($1, 'Forged')`, [
      STUDENT_A,
    ]);

    expect(await isTeacherOfStudent(STUDENT_B)).toBe(false);
  });

  it("a parent cannot create a class naming themselves teacher", async () => {
    await asAuthenticated(client, PARENT_C);

    await expectRefused(`insert into public.classes (teacher_id, name) values ($1, 'Forged')`, [
      PARENT_C,
    ]);

    expect(await isTeacherOfStudent(STUDENT_B)).toBe(false);
  });

  /**
   * The policy alone would not cover this: teaches_class() returns true for
   * whoever owns the class row, so a row that predates the migration (or is
   * seeded here past RLS, as the only way to reach that state now) would
   * still have satisfied the old roster gate. This is the case the hardened
   * helpers exist for — the class row is real and owned by the attacker,
   * and it still confers nothing.
   */
  it("a non-teacher who somehow holds a class row cannot attach another learner", async () => {
    await seedForgedClass(STUDENT_A);
    await asAuthenticated(client, STUDENT_A);

    await expectRefused(
      `insert into public.class_students (class_id, student_id) values ($1, $2)`,
      [FORGED_CLASS, STUDENT_B],
    );

    expect(await isTeacherOfStudent(STUDENT_B)).toBe(false);
  });

  /**
   * The same legacy row with its roster entry ALSO already in place — the
   * fully-exploited state, reachable only before the migration. Nothing is
   * deleted by the migration, so the guarantee has to be that such a row
   * stops conferring authority rather than that it cannot exist.
   */
  it("a pre-existing forged class with a roster confers no teacher authority", async () => {
    await seedForgedClass(STUDENT_A);
    await client.query(`insert into public.class_students (class_id, student_id) values ($1, $2)`, [
      FORGED_CLASS,
      STUDENT_B,
    ]);
    await asAuthenticated(client, STUDENT_A);

    expect(await isTeacherOfStudent(STUDENT_B)).toBe(false);

    /* ...and therefore none of the reads it used to unlock. */
    const profiles = await client.query(`select id from public.profiles where id = $1`, [STUDENT_B]);
    expect(profiles.rows).toHaveLength(0);

    const attempts = await client.query(
      `select id from public.exam_attempts where student_id = $1`,
      [STUDENT_B],
    );
    expect(attempts.rows).toHaveLength(0);
  });

  /**
   * The end of the chain, asserted directly: essay_marks INSERT is gated on
   * is_teacher_of_student(), so this is the write the escalation was worth
   * doing. Kept as its own case so a regression that somehow restored the
   * helper's old behaviour fails here too, not only upstream.
   */
  it("a forged teacher cannot write marks on another learner's attempt", async () => {
    await seedForgedClass(STUDENT_A);
    await client.query(`insert into public.class_students (class_id, student_id) values ($1, $2)`, [
      FORGED_CLASS,
      STUDENT_B,
    ]);
    const attempt = await client.query(
      `select id from public.exam_attempts where student_id = $1`,
      [STUDENT_B],
    );
    const attemptB = attempt.rows[0].id as string;

    await asAuthenticated(client, STUDENT_A);

    await expectRefused(
      `insert into public.essay_marks (attempt_id, question_id, marked_by, awarded_marks, max_marks)
       values ($1, 'q1', $2, 5, 5)`,
      [attemptB, STUDENT_A],
    );
  });

  it("a non-teacher cannot rename a class they somehow hold", async () => {
    await seedForgedClass(STUDENT_A);
    await asAuthenticated(client, STUDENT_A);

    const updated = await client.query(
      `update public.classes set name = 'Captured' where id = $1 returning id`,
      [FORGED_CLASS],
    );
    /* The USING clause hides the row from the update entirely, so this is a
       silent no-op rather than an error — hence asserting on the row count
       and then on the stored value, since "changed nothing" and "quietly
       succeeded" are the two outcomes worth telling apart. */
    expect(updated.rows).toHaveLength(0);

    await client.query("reset role");
    const stored = await client.query(`select name from public.classes where id = $1`, [
      FORGED_CLASS,
    ]);
    expect(stored.rows).toEqual([{ name: "Legacy forged" }]);
  });

  /* --------------------------------------------------------------------
   * Positive controls. Without these, every assertion above would still
   * pass if class creation were simply broken for everyone.
   * ------------------------------------------------------------------ */

  it("a genuine teacher can still create a class and enrol a student", async () => {
    await asAuthenticated(client, TEACHER_D);

    const created = await client.query(
      `insert into public.classes (id, teacher_id, name) values ($1, $2, 'Real class')
       returning id`,
      [REAL_CLASS, TEACHER_D],
    );
    expect(created.rows).toEqual([{ id: REAL_CLASS }]);

    const enrolled = await client.query(
      `insert into public.class_students (class_id, student_id) values ($1, $2)
       returning student_id`,
      [REAL_CLASS, STUDENT_A],
    );
    expect(enrolled.rows).toEqual([{ student_id: STUDENT_A }]);

    expect(await isTeacherOfStudent(STUDENT_A)).toBe(true);
    /* ...but only for the learner actually on the roster. */
    expect(await isTeacherOfStudent(STUDENT_B)).toBe(false);
  });

  it("a genuine teacher can still rename their own class", async () => {
    await asAuthenticated(client, TEACHER_D);
    await client.query(
      `insert into public.classes (id, teacher_id, name) values ($1, $2, 'Real class')`,
      [REAL_CLASS, TEACHER_D],
    );

    const updated = await client.query(
      `update public.classes set name = 'Renamed' where id = $1 returning name`,
      [REAL_CLASS],
    );
    expect(updated.rows).toEqual([{ name: "Renamed" }]);
  });

  /**
   * The roster target check, which is a separate condition from the caller
   * check: a real teacher must not be able to point a roster row at a
   * parent, teacher or admin profile and pick up authority over them.
   */
  it("a genuine teacher cannot enrol a non-student profile", async () => {
    await asAuthenticated(client, TEACHER_D);
    await client.query(
      `insert into public.classes (id, teacher_id, name) values ($1, $2, 'Real class')`,
      [REAL_CLASS, TEACHER_D],
    );

    await expectRefused(
      `insert into public.class_students (class_id, student_id) values ($1, $2)`,
      [REAL_CLASS, PARENT_C],
    );

    expect(await isTeacherOfStudent(PARENT_C)).toBe(false);
  });

  it("a genuine teacher cannot enrol a student into someone else's class", async () => {
    await client.query(
      `insert into public.classes (id, teacher_id, name) values ($1, $2, 'Real class')`,
      [REAL_CLASS, TEACHER_D],
    );
    /* A second teacher, with no relationship to REAL_CLASS. */
    const intruder = "00000000-0000-0000-0000-0000000000d2";
    await client.query(`insert into auth.users (id, email) values ($1, 'd2@test.local')`, [intruder]);
    await client.query(`update public.profiles set role = 'teacher' where id = $1`, [intruder]);

    await asAuthenticated(client, intruder);

    await expectRefused(
      `insert into public.class_students (class_id, student_id) values ($1, $2)`,
      [REAL_CLASS, STUDENT_B],
    );

    expect(await isTeacherOfStudent(STUDENT_B)).toBe(false);
  });
});
