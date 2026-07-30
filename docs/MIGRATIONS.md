# Migrations — applying, recording and detecting drift

## The problem this exists to prevent

For a long stretch this project had **no migration ledger at all**. Four
migrations had been applied to the live Supabase project by hand and four had
not, and nothing in the database could contradict an assumption about which
was which. The drift was not merely unnoticed — it was *unnoticeable*.

It surfaced three times before it was found:

- a parent dashboard showed "Billing info unavailable" because the
  `subscriptions` table did not exist;
- every Stripe webhook delivery failed, because the route called an RPC that
  had never been created;
- an RLS policy hardening a security hole (MM-AUTH-01) was in the repo,
  believed shipped, and absent from the database.

A ledger alone would not have prevented this, because a ledger can be
baselined dishonestly. Writing eight rows into a table proves only that
someone wrote eight rows. So the mechanism here pairs the ledger with
verification: **a ledger row means "these objects were confirmed present",
not "someone said so".**

## Commands

| Command | What it does | Writes? |
|---|---|---|
| `npm run migrations:status` | Reports repo-vs-live drift. Exits **non-zero** on any drift. | No |
| `npm run migrations:record` | Creates the ledger if absent, records every migration whose objects are verified present. | Ledger rows only |

Both read `SUPABASE_DB_URL` from the environment, falling back to
`.env.local`.

`migrations:status` is the one to wire into CI or a pre-deploy step. It is
read-only and fails loudly, which is the whole point — nobody has to read the
output and notice.

### What counts as drift

`migrations:status` fails on any of:

- a migration file whose objects are **not present** in the database — the
  original failure;
- a migration whose objects **are** present but that is **missing from the
  ledger** — applied out-of-band;
- a migration **recorded in the ledger whose objects are absent** — a
  dishonest or stale row, the failure mode a ledger itself introduces;
- a migration file with **no registry entry**, or a registry entry with no
  file;
- a **ledger row for a version this repo does not have**.

## The ledger

`supabase_migrations.schema_migrations`, using the Supabase CLI's own table
shape (`version text primary key, statements text[], name text`).

**Why the CLI's table rather than a bespoke one:** it is what
`supabase migration list` and `supabase db push` read. A bespoke table would
have been equally honest and left the CLI blind — it would still think
nothing had ever been applied and try to replay all eight migrations against
a database that already has them. Reusing the CLI's table means any future
CLI use inherits correct state.

`statements` is deliberately left `NULL` for rows written by
`migrations:record`. The CLI populates it with the SQL it actually executed;
these migrations were applied out-of-band, and filling it in would be another
small untruth in a ledger whose only value is that it contains none.

## The registry

`scripts/migrations/registry.ts` pairs each migration with SQL asserting the
objects it *declares*. `migrations:record` writes a ledger row **only after
those checks pass**; `migrations:status` re-runs them against the live
database on demand.

Checks assert what distinguishes "applied" from "not applied" — not a full
schema diff. Two are deliberately subtler than "does an object exist", because
an earlier audit that checked table names only would have missed both:

- `exam_sessions_student_role_gate` — the policy it touches **existed
  before** the migration. What changed is the `role = 'student'` predicate
  inside its `WITH CHECK`, so the check inspects the predicate text.
- `exam_attempts_unique_session_id` — the migration both adds a constraint
  **and drops** a now-redundant index, so the index's *absence* is part of
  what applied means.

### Adding a migration

1. Add the `.sql` file to `supabase/migrations/`.
2. Add its entry to `scripts/migrations/registry.ts`, with at least one check
   that would fail if the migration had not run.
3. Apply it, then run `npm run migrations:record`.

Step 2 is not optional and is enforced without a database:
`src/tests/unit/migration-registry.test.ts` fails if any migration file lacks
a registry entry. Skipping it would leave that migration unverifiable while
`migrations:status` cheerfully reported "no drift" — blind to it, which is
worse than having no checker.

## What `migrations:record` will not do

It **refuses** to record a migration whose objects it cannot find, exits
non-zero, and names what was missing. There is no flag to override this. A
migration that has not been applied stays absent from the ledger and
`migrations:status` keeps failing until someone applies it.

That is the deliberate difference between this and `supabase migration repair
--status applied`, which will mark anything you tell it to.
