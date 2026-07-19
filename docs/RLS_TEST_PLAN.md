# RLS Test Plan — Phase 0

## Status and scope

Verifies the Row Level Security policies in
`supabase/migrations/20260718090000_phase0_roles_and_exam_schema.sql` against
the rules in [Data model and roles](DATA_MODEL_AND_ROLES.md). Docker and the
Supabase CLI are now available on the dev machine, so R1-R5 below are
automated as `tests/rls/exam-attempts.test.ts` and run against a real local
Postgres instead of the manual SQL-editor checklist this doc originally
shipped as. The checklist below is kept as the readable spec the test file
implements 1:1; see [How to run](#how-to-run) to execute it and
[Results log](#results-log) for the last real run. The two REQUIRED cases are
the ones Phase 0 must prove:

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

## How to run

The checks above are automated in `tests/rls/exam-attempts.test.ts`, using
the `pg` driver instead of the Studio SQL editor — same impersonation
technique (`set local role` / `request.jwt.claims`), same seed fixture, each
test in its own transaction that always rolls back.

```sh
supabase start     # local Postgres on the port in supabase/config.toml (db.port)
npm run test:rls   # applies no schema changes; migrations run automatically on `start`
supabase stop       # when done
```

`supabase/config.toml` sets `db.port = 56322` (shifted off Supabase's 543xx
defaults — other local Supabase stacks may already be running on 5432x, and
55271-55370 sits inside a Windows-reserved TCP port range on at least one dev
box) and disables every service except Postgres (`api`, `studio`, `storage`,
`realtime`, `analytics`, `edge_runtime`) since the tests talk to Postgres
directly and don't need PostgREST or the rest of the stack running.

`supabase/config.toml` also sets `api.auto_expose_new_tables = true`. Without
it, a fresh Supabase Postgres instance grants `authenticated` only
`REFERENCES`/`TRIGGER`/`TRUNCATE` on newly created tables — no `SELECT` or
`INSERT` — so every authenticated query in this suite failed with
"permission denied" before RLS was ever evaluated (confirmed by inspecting
`information_schema.role_table_grants` against a fresh `db reset`). That is
not a security hole (it fails closed, blocking legitimate access rather than
leaking cross-tenant data) — it's this Supabase CLI version's new default
posture for Data API role privileges, and this migration was written
assuming the old auto-grant behavior (it already does one explicit grant,
`grant update (display_name, year_level) on public.profiles to
authenticated`, for exactly the same reason). The migrations' own `revoke
all ... from anon` statements still run after table creation regardless of
this flag, so anon ends up with nothing either way — R3 passes with the flag
on. The flag is deprecated and slated for removal 2026-10-30; if it disappears,
the two migrations will need explicit `grant select, insert on ... to
authenticated` statements added to reproduce this locally.

Override the connection with `RLS_TEST_DB_URL` if you're pointing at a
different local/staging instance.

## Results log

| Check | Date | Runner | Result |
| --- | --- | --- | --- |
| R1 (required) | 2026-07-19 | `npm run test:rls` (local Supabase, Postgres 17.6.1) | PASS |
| R2 (required) | 2026-07-19 | `npm run test:rls` (local Supabase, Postgres 17.6.1) | PASS |
| R3 | 2026-07-19 | `npm run test:rls` (local Supabase, Postgres 17.6.1) | PASS |
| R4 | 2026-07-19 | `npm run test:rls` (local Supabase, Postgres 17.6.1) | PASS |
| R5 | 2026-07-19 | `npm run test:rls` (local Supabase, Postgres 17.6.1) | PASS |

All five checks passed against a fresh `supabase db reset` applying both
migrations from a clean state — no cross-tenant read succeeded. Re-run (or
wire into CI via `npm run test:rls` against a Supabase service container)
before any deployment that stores a real child's data.
