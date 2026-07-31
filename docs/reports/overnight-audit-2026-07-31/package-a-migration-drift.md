# Package A — migration drift reconfirm + remediation plan

Read-only against the live project (`db.uermhsptduikehuyceiz.supabase.co`,
the `SUPABASE_DB_URL` in `.env.local`). Every query below is a `SELECT`
against `pg_catalog`/`information_schema`, or `count(*)`. Nothing applied,
altered, or dropped.

## Headline: the premise has changed since 2026-07-30. All 8 migrations are applied.

The task brief (and `migration-drift-audit-2026-07-30.md`) describe three
unapplied migrations. That was true when written. It is no longer true.
Commit `49760cf` ("feat(migrations): verified ledger and a drift check that
fails loudly", 2026-07-31 09:41:37+10:00, already on `main` and already
pushed to `origin/main` — confirmed via `git merge-base --is-ancestor 49760cf
HEAD`) applied all three, in a separate session before this one, hours
before this audit was requested.

I did not take the commit message's word for it. Every object it claims to
have created was independently re-queried against the live database just
now:

| Check | Live result |
|---|---|
| `exam_attempts_session_id_key UNIQUE(session_id)` | **present** — `pg_constraint` |
| old `exam_attempts_session_id_idx` | **absent** (correctly dropped) |
| duplicate `session_id` in `exam_attempts` right now | **0 rows** (2 attempts, 2 distinct sessions) |
| `subscription_events.processed_at` column | **present**, `timestamptz`, nullable |
| `apply_stripe_subscription_event(text,text,jsonb,text,text,jsonb)` | **present**, `security definer` |
| its grants | `EXECUTE` → `service_role`, `postgres` only. **No** `anon`/`authenticated` grant |
| `exam_sessions: student creates own` WITH CHECK | `(student_id = auth.uid()) AND EXISTS(...profiles p... p.role = 'student')` — **role predicate present** |
| `supabase_migrations.schema_migrations` | **exists**, 8/8 rows, versions match the 8 files on disk exactly |
| migration files on disk vs registry (`scripts/migrations/registry.ts`) | **8 vs 8**, no unregistered file, no missing file |

`npm run migrations:status` independently reports the same: **8 of 8, `ok`,
no drift, exit 0.** I ran the underlying catalog queries myself rather than
relying on that script alone, since the brief's instruction is not to accept
a documentation-only claim — the table above is first-hand.

## What this means for the requested remediation plan

The brief asks for pre-checks, transaction boundaries, rollback and backup
steps for three migrations that turn out to already be live. Writing a
hypothetical apply plan for objects that already exist would be exactly the
kind of documentation-only claim this audit is supposed to avoid producing.
Nothing to plan; there is nothing left to apply.

Worth recording for the historical trail, since it's exactly the kind of
verification this audit exists to demand: the applying session's own account
of its pre-checks (duplicate-`session_id` count queried immediately before
the `ALTER TABLE`, not from an earlier read; the role-gate `DROP`/`CREATE`
run inside one transaction so the table was never briefly without an insert
policy) is consistent with what a correct apply would need to do, and the
live state today is consistent with that account having been followed. I
cannot verify the *process* retroactively — only the *end state*, which the
table above does directly.

## Residual, forward-looking findings (in scope: "plan only")

**1. `subscription_events` has 0 rows.** The transactional-apply function
exists and its grants are correct, but it has never been exercised against a
real event — no Stripe webhook has ever landed successfully against this
project (see Package D). This is not drift; it's an untested path. Flagging
here because Package A's remit is the migration and this is the first fact
that would change if a real subscription event arrived.

**2. No backup step exists for *future* migrations, and one should.** The
three migrations applied in `49760cf` were all additive (one constraint, one
column + function, one policy replace) and low-risk by their own design —
correctly so, per that commit's reasoning. That does not generalize. There is
currently no documented backup/point-in-time-recovery step in
`docs/MIGRATIONS.md` for a migration that is *not* purely additive. Plan,
not applied: before any future migration that drops a column, drops a table,
or rewrites existing rows, take a project-level backup first — Supabase's
dashboard "Database → Backups" for a manual snapshot, or confirm PITR is
enabled on the project's plan (this project's plan tier was not checked here
and is a dashboard-only fact I cannot query from Postgres). Record the
backup timestamp in the migration's own commit message, the same way
`49760cf` recorded its verification evidence.

**3. `scripts/migrations/registry.ts` is the single source of truth for "what
should exist," and it is hermetically tested** (per `49760cf`'s own
description: "a hermetic test guards the registry's completeness without a
database"). I did not re-run that specific test file in isolation here — it
is covered by Package E's full `npm test` pass.

## Verdict

**No drift. No remediation required. Nothing to plan or apply.** The task's
premise (3 unapplied migrations) was accurate as of 2026-07-30 and is stale
as of this run. Recommend closing this line item in any tracking system that
still lists it as open, and retiring `migration-drift-audit-2026-07-30.md`'s
findings in favor of this reconfirmation for anyone reading the reports
directory going forward (that file is left in place, unmodified, as the
historical record of Phase 1 — not rewritten).
