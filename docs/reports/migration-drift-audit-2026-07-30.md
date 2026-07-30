# Migration drift audit — live Supabase project, 2026-07-30

Phase 1 of the migration-ledger reconciliation. **Read-only**: every check
below is a `SELECT` against the live project's catalogs, plus RLS probes run
inside transactions that were always rolled back. Nothing was applied,
altered or dropped to produce this report.

Project: `db.uermhsptduikehuyceiz.supabase.co` (the `SUPABASE_DB_URL` in
`.env.local`).

Method: for each migration, the objects it *declares* were checked against
`pg_class`, `pg_proc`, `pg_policy`, `pg_trigger`, `pg_constraint`,
`information_schema.columns`, `information_schema.role_table_grants` and
`information_schema.column_privileges` — not merely "does a table of that
name exist". 88 individual object checks in total. Behavioural claims were
then verified empirically by impersonating each real identity
(`set local role authenticated` + `request.jwt.claims`), never as the
service role, which bypasses precisely what is under test.

## Summary

| Migration | Applied? | Evidence checked | Gap |
|---|---|---|---|
| `20260718090000_phase0_roles_and_exam_schema` | **YES** (47/47) | 8 tables, RLS on all 8, 6 indexes, `handle_new_user` + 6 helper functions, `on_auth_user_created` trigger on `auth.users`, 32 policies across 8 tables, `anon` revoked on all 8, column-level `UPDATE (display_name, year_level)` grant on `profiles` | — |
| `20260718120000_admin_aggregate_views` | **YES** (7/7) | `is_admin()`, 6 views, `authenticated` SELECT granted and `anon` SELECT absent on each | — |
| `20260719100000_exam_responses` | **YES** (13/13) | table, all 6 columns, RLS on, 3 policies, explicit SELECT/INSERT/UPDATE grants to `authenticated`, `anon` revoked | — |
| `20260719110000_essay_marking` | **YES** (5/5) | `essay_marks`, `essay_marks_attempt_id_idx`, RLS on, 3 teacher policies, `anon` revoked | — |
| `20260720100000_subscriptions` | **YES** (10/10) | 2 tables, `create_parent_trial_subscription()` + `on_parent_profile_created` trigger, `has_active_access()`, `current_parent_has_access()`, RLS on, exactly 1 policy, no policies and no `authenticated` grant on `subscription_events` | — (applied 2026-07-30; was missing before that) |
| `20260722100000_exam_attempts_unique_session_id` | **NO** | — | `exam_attempts_session_id_key UNIQUE(session_id)` absent; old `exam_attempts_session_id_idx` still present |
| `20260723090000_stripe_webhook_transactional_apply` | **NO** | — | `subscription_events.processed_at` column absent; `apply_stripe_subscription_event(text,text,jsonb,text,text,jsonb)` absent |
| `20260724090000_exam_sessions_student_role_gate` | **NO** | — | `exam_sessions: student creates own` still has `WITH CHECK (student_id = auth.uid())` — no role predicate |
| — | — | **`supabase_migrations.schema_migrations`** | **absent** (`42P01`) — no ledger of any kind |

Five of eight applied, three missing. The three missing are contiguous and
are exactly the three that follow the one already known to have been
skipped, which is consistent with a hand-applied sequence that simply
stopped.

Migrations 6 and 7 each carry an explicit header note saying they were
deliberately *not* applied to the real database at the time they were
written. Migration 8 carries no such note.

## 20260724090000 — MM-AUTH-01 (priority)

**The RLS policy does not exist in its hardened form on the live project.**

Live definition of `exam_sessions: student creates own`:

```
WITH CHECK (student_id = auth.uid())
```

Repo definition:

```sql
with check (
  student_id = auth.uid()
  and exists (select 1 from public.profiles p
              where p.id = auth.uid() and p.role = 'student')
)
```

The `role = 'student'` predicate is absent. Confirmed by probe — a **valid**
row (every NOT NULL column supplied, so RLS is the only thing that could
reject it), inserted while impersonating each real identity:

| Probe | Result |
|---|---|
| parent "Vish" inserts a session **as themselves** | **ALLOWED** |
| parent "Vish" inserts a session for child "Child A" | blocked by RLS (42501) |
| student "Child A" inserts their own session (control) | ALLOWED — correct |
| student "Child A" inserts a session for sibling "Child B" | blocked by RLS (42501) |

An earlier run of this probe reported the parent insert as "blocked
(23502)". That was wrong and is corrected above: the probe had omitted
`seed`, `selected_question_ids` and `expires_at`, so Postgres rejected it on
a NOT NULL constraint before RLS was ever evaluated. The corrected probe
supplies every column, and the insert succeeds.

### What is actually exposed

Concretely: any signed-in non-student — the parent, and any teacher or admin
account that later exists — can create `exam_sessions` rows attributed to
themselves, and then `exam_attempts` rows against those sessions (the
attempts insert policy requires only `student_id = auth.uid()` plus
ownership of the session, both of which they now satisfy). That means
fabricated exam data under a non-student identity, which feeds the
`admin_*` aggregate views.

The application route (`src/app/api/exam/session/route.ts:75`) *does* check
`profile?.role !== "student"`, so this is not reachable through the app's
own UI. But the Supabase anon key is public by design — it ships to every
browser — so any signed-in user can call PostgREST directly with their own
JWT and bypass the route entirely. RLS is the real boundary here, and it is
the layer that is missing. Defence-in-depth is currently one deep, on the
layer that can be walked around.

### What is NOT exposed — the household question, answered directly

**No. One child cannot reach another child's exam sessions or responses.**

This migration governs `INSERT` only. Reads are governed by the Phase-0
`SELECT` policies (`student_id = auth.uid()` on `exam_sessions` and
`exam_attempts`, and the same on `exam_responses` from
`20260719100000`) — all of which **are** applied and verified present.

Probed as each of the three children in the household, counting rows each
one can actually see versus rows that are not theirs:

| Child | `exam_sessions` | `exam_responses` | `exam_attempts` | rows visible that are **not theirs** |
|---|---|---|---|---|
| Child A `215a84d7` | 0 | 0 | 0 | **0** |
| Child B `2668f328` | 1 | 0 | 0 | **0** |
| Child A `9c8f1353` | 2 | 2 | 2 | **0** |

Table totals are 3 sessions, 2 responses, 2 attempts. Each child sees only
their own rows and no sibling's; the second Child A sees 2 of the 3 sessions
because 2 are hers, not because isolation is leaking. Cross-child writes are
blocked as well (row 4 of the probe table above).

The parent sees their children's rows, which is the intended
`is_parent_of()` policy, not a gap.

So: MM-AUTH-01 is real, is open, and should be closed — but it is an
integrity and privilege problem, not a household privacy breach. No child's
data is reachable by another child.

## 20260722100000 — MM-SEC-02, duplicate exam submissions

`exam_attempts_session_id_key` does not exist, and the superseded
`exam_attempts_session_id_idx` is still in place.

The submit route already catches Postgres `23505` on insert
(`src/app/api/exam/session/[id]/submit/route.ts:139`) and converts it into
an idempotent already-submitted response. With no unique constraint, that
`23505` can never be raised, so the handler is dead code and the TOCTOU race
it was written to absorb is live: two concurrent submits for one session can
both pass the `maybeSingle()` pre-check and both insert.

The migration's own header warns that pre-existing duplicates would make the
`ALTER TABLE` fail. **Checked: zero duplicate `session_id` values in
`exam_attempts`** (2 attempt rows, 2 distinct sessions). The constraint can
therefore be added cleanly, with no data reconciliation and no destructive
step.

## 20260723090000 — Stripe webhook

Both objects absent: the `processed_at` column and the
`apply_stripe_subscription_event` function.

This is not latent. `src/lib/stripe/apply-subscription-event.ts:162` calls
`admin.rpc("apply_stripe_subscription_event", …)` unconditionally, so **every
Stripe webhook delivery currently fails against this project** — the RPC
does not exist, the route returns non-2xx by design, and Stripe retries on
its own schedule until it gives up. No subscription state written by Stripe
has ever landed. Nothing has surfaced yet only because no live Stripe
subscription exists.

Its `revoke ... from public, anon, authenticated` / `grant execute ... to
service_role` clauses matter: without them a freshly created
`security definer` function that writes tables no other role may write to
would be callable by `authenticated`. That will be verified after apply.

## The ledger

`supabase_migrations.schema_migrations` does not exist (`42P01`). There is
no record anywhere in the database of which migrations have run. This is the
root cause of the whole class of problem: the four migrations that *are*
applied were applied by hand, and there was no artefact that could have
disagreed with an assumption. The drift was not merely unnoticed — it was
unnoticeable.

## Required destructive steps

**None.** Reported rather than taken, per instruction, and there is nothing
to report:

- The three missing migrations are all additive — one `ALTER TABLE ... ADD
  CONSTRAINT`, one `ADD COLUMN`, one `CREATE FUNCTION`, and one
  `DROP POLICY`/`CREATE POLICY` pair that replaces a policy with a strictly
  narrower one.
- `20260722100000` drops `exam_attempts_session_id_idx`. That is an index,
  not data, and it is made redundant by the unique constraint created in the
  same migration.
- `20260724090000` drops and recreates a policy. The drop is unavoidable —
  Postgres has no `ALTER POLICY ... WITH CHECK` that can be applied
  idempotently here — but it is momentary, inside the same transaction as
  its replacement, and the replacement is more restrictive than what it
  replaces. No window is opened.
- No table is dropped, no column removed, no row touched.

## Recommendation

Apply `20260724090000` first (security), then `20260722100000`, then
`20260723090000`. Each transactionally, each behind a pre-check that refuses
to run if its objects already exist, and each verified afterwards by
impersonating the affected role rather than the service role.
