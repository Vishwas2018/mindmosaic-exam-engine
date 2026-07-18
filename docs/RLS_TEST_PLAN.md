# RLS Test Plan — Phase 0

## Status and scope

Verifies the Row Level Security policies in
`supabase/migrations/20260718090000_phase0_roles_and_exam_schema.sql` against
the rules in [Data model and roles](DATA_MODEL_AND_ROLES.md). Docker (and so
`supabase start`) is not available on the current dev machine, so this is the
documented manual checklist the migration ships with; run it in the Supabase
Studio SQL editor of a local or staging project (never production with real
family data). The two REQUIRED cases are the ones Phase 0 must prove:

- **R1 (required):** a student cannot read another student's `exam_attempts` row.
- **R2 (required):** a parent cannot read an unlinked child's `exam_attempts` row.

## How impersonation works in these tests

The SQL editor runs as `postgres` (bypasses RLS), so each check switches to
the `authenticated` role and injects a JWT claim before querying — exactly
what PostgREST does for a signed-in user. Everything runs inside a
transaction that is rolled back, so the checks leave no data behind.

## Seed fixture

```sql
begin;

-- Two students, one parent linked to student A only.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'student-a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'student-b@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'parent-c@test.local');

-- The on_auth_user_created trigger has created three 'student' profiles.
update public.profiles set role = 'parent'
  where id = '00000000-0000-0000-0000-00000000000c';

insert into public.parent_children (parent_id, child_id) values
  ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000a');

insert into public.exam_sessions (id, student_id, config, seed, selected_question_ids, expires_at) values
  ('11111111-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a',
   '{}'::jsonb, 'seed-a', array['q1'], now() + interval '1 hour'),
  ('11111111-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b',
   '{}'::jsonb, 'seed-b', array['q1'], now() + interval '1 hour');

insert into public.exam_attempts (session_id, student_id, responses, result) values
  ('11111111-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', '{}'::jsonb, '{}'::jsonb),
  ('11111111-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', '{}'::jsonb, '{}'::jsonb);
```

## Checks

Run each block after the seed, still inside the transaction. `set local
role` / `request.jwt.claims` reset at each `savepoint` boundary is not
needed — just re-issue the two `set local` lines before each check.

### R1 (required): student cannot read another student's attempt

```sql
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

-- EXPECT: exactly 1 row, student_id = ...000a (their own attempt only).
select student_id from public.exam_attempts;

-- EXPECT: 0 rows — B's attempt is invisible, not merely filtered client-side.
select * from public.exam_attempts
  where student_id = '00000000-0000-0000-0000-00000000000b';
```

### R2 (required): parent cannot read an unlinked child's attempt

```sql
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

-- EXPECT: exactly 1 row, student_id = ...000a (the linked child only).
select student_id from public.exam_attempts;

-- EXPECT: 0 rows — student B is not this parent's child.
select * from public.exam_attempts
  where student_id = '00000000-0000-0000-0000-00000000000b';
```

### R3: anon reads nothing

```sql
set local role anon;

-- EXPECT: every query errors with "permission denied" (privileges revoked)
-- or returns 0 rows (RLS default-deny). Either outcome is a pass; any row
-- returned is a FAIL.
select * from public.profiles;
select * from public.exam_attempts;
select * from public.exam_sessions;
```

### R4: student cannot forge an attempt against another student's session

```sql
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

-- EXPECT: error "new row violates row-level security policy" — the insert
-- policy requires the session to belong to the inserting student.
insert into public.exam_attempts (session_id, student_id, responses, result)
values ('11111111-0000-0000-0000-00000000000b',
        '00000000-0000-0000-0000-00000000000a', '{}'::jsonb, '{}'::jsonb);
```

### R5: student cannot escalate their own role

```sql
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

-- EXPECT: error "permission denied for table profiles" — update is granted
-- only on (display_name, year_level) at the column level.
update public.profiles set role = 'admin'
  where id = '00000000-0000-0000-0000-00000000000a';
```

### Cleanup

```sql
rollback;
```

## Results log

| Check | Date | Runner | Result |
| --- | --- | --- | --- |
| R1 | _pending — run on first local/staging Supabase with this migration applied_ | | |
| R2 | _pending_ | | |
| R3 | _pending_ | | |
| R4 | _pending_ | | |
| R5 | _pending_ | | |

Record a run here (or link the CI job) before any deployment that stores a
real child's data.
