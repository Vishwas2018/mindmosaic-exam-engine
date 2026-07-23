import type { Client } from "pg";

// Mirrors the seed fixture in docs/RLS_TEST_PLAN.md exactly: two students,
// one parent linked to student A only. Keep these two files in sync.
export const STUDENT_A = "00000000-0000-0000-0000-00000000000a";
export const STUDENT_B = "00000000-0000-0000-0000-00000000000b";
export const PARENT_C = "00000000-0000-0000-0000-00000000000c";
// MM-AUTH-01: a non-student profile, used only to prove
// "exam_sessions: student creates own" now also gates on role, not just
// ownership — not part of the docs/RLS_TEST_PLAN.md seed above.
export const TEACHER_D = "00000000-0000-0000-0000-00000000000d";
export const SESSION_A = "11111111-0000-0000-0000-00000000000a";
export const SESSION_B = "11111111-0000-0000-0000-00000000000b";

/**
 * Inserts the shared fixture. Must run as the unrestricted `postgres` role
 * (the default connection role), before any `set local role` impersonation,
 * so RLS never blocks the seed itself.
 */
export async function seed(client: Client): Promise<void> {
  await client.query(
    `insert into auth.users (id, email) values ($1, $2), ($3, $4), ($5, $6), ($7, $8)`,
    [
      STUDENT_A,
      "student-a@test.local",
      STUDENT_B,
      "student-b@test.local",
      PARENT_C,
      "parent-c@test.local",
      TEACHER_D,
      "teacher-d@test.local",
    ],
  );

  // The on_auth_user_created trigger has created four 'student' profiles.
  await client.query(`update public.profiles set role = 'parent' where id = $1`, [PARENT_C]);
  await client.query(`update public.profiles set role = 'teacher' where id = $1`, [TEACHER_D]);

  await client.query(
    `insert into public.parent_children (parent_id, child_id) values ($1, $2)`,
    [PARENT_C, STUDENT_A],
  );

  await client.query(
    `insert into public.exam_sessions
       (id, student_id, config, seed, selected_question_ids, expires_at)
     values
       ($1, $2, '{}'::jsonb, 'seed-a', array['q1'], now() + interval '1 hour'),
       ($3, $4, '{}'::jsonb, 'seed-b', array['q1'], now() + interval '1 hour')`,
    [SESSION_A, STUDENT_A, SESSION_B, STUDENT_B],
  );

  await client.query(
    `insert into public.exam_attempts (session_id, student_id, responses, result)
     values
       ($1, $2, '{}'::jsonb, '{}'::jsonb),
       ($3, $4, '{}'::jsonb, '{}'::jsonb)`,
    [SESSION_A, STUDENT_A, SESSION_B, STUDENT_B],
  );
}

/** Impersonates a signed-in user the way PostgREST does for a request. */
export async function asAuthenticated(client: Client, sub: string): Promise<void> {
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub, role: "authenticated" }),
  ]);
}

/** Impersonates an unauthenticated request. */
export async function asAnon(client: Client): Promise<void> {
  await client.query("set local role anon");
}
