/**
 * RLS coverage for supabase/migrations/20260719110000_essay_marking.sql,
 * following the pattern in exam-attempts.test.ts: each test seeds the
 * shared student/parent fixture as the unrestricted `postgres` role, adds
 * its own local teacher/class fixture (kept local rather than in
 * ./fixtures.ts since only this file needs it), impersonates a signed-in
 * user, and always ROLLBACKs.
 *
 * Core assertion this file exists for: a teacher cannot mark an essay
 * belonging to a student outside their own classes (docs/DATA_MODEL_AND_ROLES.md
 * — "teacher ... cannot see students outside their classes"), enforced by
 * the essay_marks RLS policies reusing is_teacher_of_student.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, seed, STUDENT_A, STUDENT_B } from "./fixtures";

const TEACHER_OF_A = "00000000-0000-0000-0000-00000000001a";
const OTHER_TEACHER = "00000000-0000-0000-0000-00000000001b";
const CLASS_ID = "22222222-0000-0000-0000-00000000000a";

let client: Client;
let attemptA: string;
let attemptB: string;

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);

  await client.query(
    `insert into auth.users (id, email) values ($1, $2), ($3, $4)`,
    [TEACHER_OF_A, "teacher-of-a@test.local", OTHER_TEACHER, "other-teacher@test.local"],
  );
  await client.query(
    `update public.profiles set role = 'teacher' where id in ($1, $2)`,
    [TEACHER_OF_A, OTHER_TEACHER],
  );
  await client.query(
    `insert into public.classes (id, teacher_id, name) values ($1, $2, 'Class A')`,
    [CLASS_ID, TEACHER_OF_A],
  );
  await client.query(
    `insert into public.class_students (class_id, student_id) values ($1, $2)`,
    [CLASS_ID, STUDENT_A],
  );

  const attempts = await client.query(
    `select id, student_id from public.exam_attempts where student_id in ($1, $2)`,
    [STUDENT_A, STUDENT_B],
  );
  attemptA = attempts.rows.find((row) => row.student_id === STUDENT_A).id;
  attemptB = attempts.rows.find((row) => row.student_id === STUDENT_B).id;
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("RLS: essay_marks (supabase/migrations/20260719110000_essay_marking.sql)", () => {
  it("the class teacher can mark their own student's essay", async () => {
    await asAuthenticated(client, TEACHER_OF_A);

    await client.query(
      `insert into public.essay_marks (attempt_id, question_id, marked_by, awarded_marks, max_marks)
       values ($1, 'essay-1', $2, 4, 5)`,
      [attemptA, TEACHER_OF_A],
    );

    const rows = await client.query(
      `select awarded_marks from public.essay_marks where attempt_id = $1`,
      [attemptA],
    );
    expect(rows.rows).toEqual([{ awarded_marks: "4" }]);
  });

  it("a teacher cannot mark an out-of-class student's essay", async () => {
    await asAuthenticated(client, OTHER_TEACHER);

    await expect(
      client.query(
        `insert into public.essay_marks (attempt_id, question_id, marked_by, awarded_marks, max_marks)
         values ($1, 'essay-1', $2, 4, 5)`,
        [attemptA, OTHER_TEACHER],
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("a teacher cannot mark a student who isn't in any of their classes", async () => {
    await asAuthenticated(client, TEACHER_OF_A);

    await expect(
      client.query(
        `insert into public.essay_marks (attempt_id, question_id, marked_by, awarded_marks, max_marks)
         values ($1, 'essay-1', $2, 4, 5)`,
        [attemptB, TEACHER_OF_A],
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("a teacher cannot read another teacher's out-of-class marks", async () => {
    await asAuthenticated(client, TEACHER_OF_A);
    await client.query(
      `insert into public.essay_marks (attempt_id, question_id, marked_by, awarded_marks, max_marks)
       values ($1, 'essay-1', $2, 4, 5)`,
      [attemptA, TEACHER_OF_A],
    );

    await asAuthenticated(client, OTHER_TEACHER);

    const rows = await client.query(`select * from public.essay_marks where attempt_id = $1`, [
      attemptA,
    ]);
    expect(rows.rows).toHaveLength(0);
  });
});
