# Package C — RLS empirical audit

Live project (`db.uermhsptduikehuyceiz.supabase.co`). Every probe below ran
inside its own `BEGIN...ROLLBACK`; nothing was committed. Impersonation is
`set local role authenticated/anon` + `set local request.jwt.claims`,
matching what PostgREST actually sets per request — **never** `service_role`.
Real identities used where they exist on this live project:

| Identity | Real account | Note |
|---|---|---|
| anon | n/a | no session at all |
| student (G5) | `2668f328` | year 5, real, 1 session, 0 attempts |
| student (G3) | `9c8f1353` | year 3, real, 2 sessions, 2 attempts |
| parent | `583dab64` (jvishu21@gmail.com) | real, linked to both students above |
| teacher | *no real account exists* | synthetic identity, inserted and rolled back within the same transaction — see methodology note |
| admin | *no real account exists* | real parent identity, `profiles.role` temporarily flipped inside a rolled-back transaction |

## Boundary → expected → observed → pass/fail

| Boundary | Expected | Observed | Pass/Fail |
|---|---|---|---|
| anon reads `exam_sessions` | denied | `permission denied for table exam_sessions` | **PASS** |
| anon reads `profiles` | denied | `permission denied for table profiles` | **PASS** |
| anon reads `parent_children` | denied | `permission denied for table parent_children` | **PASS** |
| anon inserts `exam_sessions` | denied | `permission denied for table exam_sessions` | **PASS** |
| student reads own `exam_sessions`/`exam_attempts`/`exam_responses` (unfiltered query) | only own rows | G5: 1/1 own row. G3: 2/2, 2/2 own rows, every row's `student_id` matched the caller | **PASS** |
| student reads sibling's `exam_sessions` (unfiltered query) | 0 rows, not an error | G5 querying with no filter saw 0 rows belonging to G3 | **PASS** |
| student inserts an `exam_sessions` row for a sibling | RLS-denied | `new row violates row-level security policy for table "exam_sessions"` | **PASS** |
| parent reads own children's `exam_sessions`/`exam_attempts` | union of both children's rows, nothing else | 3 sessions (1×G5 + 2×G3), 2 attempts (2×G3) — matches known real counts exactly | **PASS** |
| parent inserts `exam_sessions` as **themselves** (MM-AUTH-01) | denied | `new row violates row-level security policy` | **PASS — re-confirmed by live behavioral probe, not by re-reading the policy's WITH CHECK text** |
| parent inserts `exam_sessions` attributed to their own child | denied (parent is not the student acting on their own behalf) | `new row violates row-level security policy` | **PASS** |
| teacher, no class linkage, reads `exam_sessions`/`exam_attempts` | 0 rows | 0 rows, 0 rows | **PASS** (see methodology note below) |
| teacher, linked to one student only, reads `exam_sessions`/`exam_attempts` | only the linked student's rows | exactly the linked student's 2 sessions + 2 attempts; the unlinked sibling's row never appeared | **PASS** |
| admin reads `admin_platform_totals` | full aggregate, real numbers | `total_attempts:2, active_students:1, total_sessions:3, avg_score_pct:85.0` — matches real data | **PASS** |
| non-admin (real student) reads the same admin view | denied, or a value that reveals nothing real | returned one row with **every aggregate zeroed/null** (`total_attempts:0, avg_score_pct:null`), not a permission error and not the real numbers | **PASS on data**, minor observation below |
| the specifically-named "known-weak" `exam_sessions: student creates own` policy | should now include the role predicate | live `pg_policy` definition (confirmed independently in Package A) plus the parent-insert-as-self probe above **both** confirm the role gate is active | **PASS** — was the one real weakness identified 2026-07-30; closed by commit `49760cf`, now verified twice: once by reading the catalog, once by behavior |

## Methodology note: the teacher probe was run twice, because the first attempt was confounded

My first pass reused the real parent's account, temporarily flipping
`profiles.role` to `'teacher'` inside a rolled-back transaction, with no
class linkage. It returned all 3 `exam_sessions` rows — which looked like a
teacher-isolation failure. It was not: that account **is also** the real
parent, and `is_parent_of()` checks the `parent_children` table, not
`profiles.role` — flipping the role column does nothing to the parent
linkage that's still sitting there. The 3 rows were visible via the
`"exam_sessions: parent reads linked children"` policy the whole time, not
via any teacher policy. Reusing one real identity to stand in for two
different roles was the wrong test.

Re-run with a fully synthetic identity (`aaaaaaaa-...-000000000001`) that
has no parent-linkage at all, inserted and promoted to `'teacher'` inside
the same rolled-back transaction — the same technique the existing
`tests/rls/fixtures.ts` local suite already uses for synthetic test
identities. That version is unconfounded and is what's reported in the
table above: 0 rows with no linkage, exactly the linked student's rows with
linkage, confirmed clean by re-querying `auth.users` for the synthetic id
after rollback (`count = 0`).

## Honest limit: "cross-family denial" could not be tested with real data

This project has exactly one family — three real accounts total, one parent
and two children (confirmed by `npm run audit:auth-users`, and consistent
with Package A/D findings). There is no second real family to probe against,
so "does household X ever reach household Y's data" cannot be empirically
verified here; it was not fabricated to force a positive result. The closest
available real-data proxy is sibling isolation within the one household,
which is what the student-to-student rows above test, and which passed in
both directions (read and write). The underlying policy predicate
(`student_id = auth.uid()` / `is_parent_of(child)` / `is_teacher_of_student`)
is family-agnostic — it has no special case for "same household" versus
"different household" — so passing sibling isolation is reasonable evidence
that cross-family isolation holds by the same mechanism, but it is inference
from the policy shape, not a direct observation, and is reported as such
rather than rounded up to a tested PASS.

## Minor observation: `admin_platform_totals` reveals its own shape to non-admins

Querying the view as a non-admin returns a row of zeroed/null aggregates
rather than a permission error or truly empty result set. The view is
defined `with (security_barrier) as select ... from exam_attempts a where
public.is_admin()` (`20260718120000_admin_aggregate_views.sql:42-52`) — for
a non-admin, the `where public.is_admin()` filters the underlying scan to
zero rows, but the surrounding aggregate (`count(*)`, `avg(...)`) still
executes over that empty set and returns one row of `0`/`null` rather than
the query itself being refused. No real number, name, or row is disclosed —
only that the view exists and its column shape. Not a data leak; noted
because it is a discoverable fact about the schema that a stricter view
(e.g. `where false` short-circuited before the aggregate, or wrapped in an
explicit admin-only function) would not reveal. Low severity, not blocking.

## Verdict

Every boundary that could be tested against real data passed, including a
direct, fresh, behavioral re-confirmation of the one previously-known
weakness (MM-AUTH-01), independent of trusting the commit that claims to
have fixed it. The one gap in coverage is structural (no second family
exists to test against), not a finding of a hole — and is reported as an
inference, not overstated as a tested pass.
