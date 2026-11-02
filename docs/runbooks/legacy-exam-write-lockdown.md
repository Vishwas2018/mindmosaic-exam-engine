# Runbook: legacy exam write lockdown (P1 assessment integrity)

ADR-005 Amendment E. Migrations `20261031090000` (additive) and `20261031090100` (breaking for the previous app
version). **The order matters: the application must be deployed between them.**

Nothing here is applied by the pull request. Every hosted step needs the owner (a database credential, a migration
apply, a deploy, a secret). This document describes steps; it does not perform them.

## Rules that do not change

1. **Legacy `EXECUTE` stays revoked after lockdown.** Once `20261031090100` is applied, `create_exam_session` and
   `record_exam_attempt` are never granted back to `anon`, `authenticated` or `PUBLIC`, for any reason, including an
   outage. Re-granting re-opens score and attempt forgery by any signed-in student. If the new path is broken, the
   remedy is to fix the new path (variable, deployment, role), never to reopen the old one. An exam outage that fails
   closed (`503`) is an accepted cost; a forged result is not.
2. **A hosted write target must prove it is the intended project.** See [Writer configuration](#writer-configuration).
3. **No promise that answers are saved.** Do not tell a family that answers entered during an outage, a suspension or a
   failed submit are stored or recoverable. Say what was demonstrated: persistence is claimed only after a hosted
   journey has shown create, autosave, resume and submit for a synthetic student against the deployed build. Until then
   the supported statement is "if the exam cannot be submitted, start it again".

## Writer configuration

The exam write module (`src/server/exam-write/legacy-exam-writes.ts`, target rules in `target.ts`) refuses to connect
unless the target proves its identity. All of the following are server-only environment variables; none may be prefixed
`NEXT_PUBLIC_`.

| Variable | Hosted (DEV/Preview/Production) | Local / CI |
|---|---|---|
| `EXAM_WRITE_DB_URL` | the writer role's URL, direct or pooler (below) | `postgresql://mindmosaic_exam_writer:…@127.0.0.1:56322/postgres` |
| `EXAM_WRITE_EXPECTED_PROJECT_REF` | **required**: the 20-character ref of the project this deployment must write to | unset |
| `EXAM_WRITE_ALLOW_LOOPBACK` | **must be unset** | `1` (required for a loopback URL) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` (already set; it is the second witness) | `http://127.0.0.1:56321` |

Accepted URL forms (anything else is refused):

- direct: `postgresql://mindmosaic_exam_writer:<pw>@db.<ref>.supabase.co:5432/postgres`
- pooler: `postgresql://mindmosaic_exam_writer.<ref>:<pw>@<region>.pooler.supabase.com:{5432|6543}/postgres`
- loopback: `127.0.0.1`, `localhost` or `[::1]`, only with `EXAM_WRITE_ALLOW_LOOPBACK=1` and never on a hosted runtime
  (`VERCEL` set).

A write is refused (`503 not_configured`, nothing connects) when: the URL is missing, unparseable or not
`postgres(ql)://`; it carries any query parameter other than `sslmode`, `application_name`, `connect_timeout`,
`pgbouncer` (so `host=`/`hostaddr=`/`user=` cannot redirect it); `sslmode` allows plaintext; the host is neither a
documented direct nor pooler host; the role is anything but `mindmosaic_exam_writer` (the pooler username must carry
exactly one `.<ref>` suffix); `EXAM_WRITE_EXPECTED_PROJECT_REF` is missing or not a ref; the ref in the URL differs
from it; `NEXT_PUBLIC_SUPABASE_URL` is missing or names a different project; or a loopback URL is used without the
opt-in or on a hosted runtime. After connecting, the role's attributes are read back from `pg_roles`; any of
superuser, `BYPASSRLS`, `CREATEROLE`, `CREATEDB` or `REPLICATION` refuses the write. The refusal reason is an enumerated
code in the server's response; the URL, password and connection string are never logged or returned.

Hosted TLS: connections are encrypted, but certificate-chain verification of Supabase's pooler needs its CA bundle and
is **not** configured. Treat verified TLS as an open hosted item. Today the code sets `rejectUnauthorized: false` for hosted targets, so an
on-path attacker could present any certificate; the password is still protected only by the network path. Before DEV
carries real traffic, obtain Supabase's CA certificate from the project's database settings, supply it to the module
(for example as a server-only `EXAM_WRITE_DB_CA` value) and switch to `rejectUnauthorized: true` with that CA. This is a
code change plus an owner-supplied certificate, and has not been done.

## Why two migrations

| | Applies | Effect on the running (old) app | Effect on the new app |
|---|---|---|---|
| `...090000` | role + `*_for` functions | none | needs it |
| `...090100` | revokes the legacy functions from clients | **breaks** it (permission denied on create/submit) | needs it to close the hole |

## Sequence for DEV (`mfglzabnayacssgertat`), then the same for any other environment

Do not run these against Production without a separate owner decision. DEV is the only environment this runbook
authorises by itself.

1. **Pre-check (read-only).** In the SQL editor:
   `select proname, proacl from pg_proc where proname in ('create_exam_session','record_exam_attempt');`
   Note that `authenticated=X` appears (the hole is open). *Verify:* record the output.
2. **Apply `20261031090000` only.** (`supabase db push` pushes every pending migration; apply the files individually
   or through the dashboard so step 6 stays a separate act.)
   *Verify:* `select rolname, rolcanlogin, rolsuper, rolbypassrls, rolinherit, rolcreatedb, rolcreaterole, rolreplication
   from pg_roles where rolname = 'mindmosaic_exam_writer';` returns login true, the rest false.
   `select has_function_privilege('authenticated', 'public.create_exam_session_for(uuid,jsonb,text,text[],timestamptz)', 'EXECUTE');`
   returns false. The running app still works.
3. **Set the role password out of band** (owner; never in the repo, a chat or a log):
   `alter role mindmosaic_exam_writer password '<secret>';` Then store the connection string as the **DEV/Preview**
   variable `EXAM_WRITE_DB_URL` in the hosted secret store, in the same pooler or direct style as `SCORING_DB_URL`, and set
   `EXAM_WRITE_EXPECTED_PROJECT_REF` to the DEV ref. Leave `EXAM_WRITE_ALLOW_LOOPBACK` unset.
   *Verify:* a connection with the URL succeeds and `select * from public.exam_sessions limit 1` fails with permission
   denied. (No `psql` is assumed on the operator machine; any client works.)
4. **Deploy the application** (the candidate) to a Preview *after* the variables above exist, because an environment
   variable change does not reach an already-built deployment. *Verify with the real app, still on the old grants:* a
   synthetic student starts an exam, answers, submits, and the attempt row exists. This proves the new path works while
   the old one is still open, so a failure here belongs to the new path, not to the revoke. A `503 not_configured` here
   means one of the refusal rules above fired: fix the variable, do not proceed.
5. **Prove the target guard on the deployment** (negative checks, on a Preview only): with
   `EXAM_WRITE_EXPECTED_PROJECT_REF` temporarily unset, creating an exam returns `503` and nothing is written; restore it.
6. **Apply `20261031090100`.** *Verify (the fix):* as a signed-in synthetic student over PostgREST,
   `POST /rest/v1/rpc/create_exam_session` and `.../record_exam_attempt` return `42501 permission denied for function`.
   Re-run step 4's journey: it still works. `npm run migrations:record && npm run migrations:status` against the target
   shows no drift.
7. **Regression run:** the hosted scoring script
   (`C:\tmp\mindmosaic-scoring-validation-2026-10-31\scripts\score-e2e.cjs`): its `FORGE-RPC` check must now PASS and
   the 188-question scoring comparison must be unchanged.

## Failure handling (no step reopens the hole)

| If | Do | Do **not** |
|---|---|---|
| Step 4 fails (new path broken) | Fix the variable or the deployment. Roll the Preview back to the previous deployment if needed. `...090000` is additive and may stay. | Do not apply `...090100` until step 4 passes. |
| Step 6 breaks real exams (for example a variable missing in an environment that was overlooked) | **Fix the variable** and redeploy. Exams fail closed (`503`) meanwhile; that is the correct failure. | **Never** `grant execute … to authenticated` on the legacy functions, and never roll the app back to a build that calls them while `...090100` is applied. |
| The writer role or its URL may be compromised | Follow [Suspending the writer](#suspending-the-writer). | Do not rely on `NOLOGIN` alone. |

There is no destructive step: no table, column or row is dropped or rewritten, and the legacy functions are kept (only
their client access is revoked). The header comment in `20261031090100` that mentions re-granting `EXECUTE` is
superseded by rule 1 above; the migration file is not edited because it is recorded in the migration registry.

## Suspending the writer

Nothing here has been executed. These are owner actions, in order, for the case where exam creation and submission
must stop *now*.

`ALTER ROLE … NOLOGIN` is **not** a suspension. It only blocks *new* logins. Sessions that already exist keep running,
and so do connections held open by a pooler (Supavisor/PgBouncer) and by serverless instances that already connected.
A suspension that stops at `NOLOGIN` leaves the role writing.

1. **Rotate the password:** `alter role mindmosaic_exam_writer password '<new secret>';` This invalidates the URL held by
   every deployment, including **older Preview deployments**, which keep the value that was current when they were
   built and are not changed by editing the variable afterwards. Rotation is what neutralises them.
2. **Block new logins:** `alter role mindmosaic_exam_writer nologin;`
3. **End the sessions that already exist:**
   `select pg_terminate_backend(pid) from pg_stat_activity where usename = 'mindmosaic_exam_writer';`
   *Verify:* the same query without `pg_terminate_backend` returns no rows (repeat; the pooler may reconnect until step 1
   has taken effect). If the operator role lacks the privilege to terminate them, say so and escalate; do not assume it worked.
4. **Remove the credential from the hosted secret store** (or set it to the rotated value only when resuming) and redeploy
   the current deployment so it stops holding the old one. List the Preview deployments that still exist and retire the
   ones built from older commits.
5. **Confirm the effect:** a synthetic student's attempt to start an exam now returns `503`. The legacy RPCs still
   return `42501`.

While suspended: new exams cannot be created and submits fail. **Do not tell families that anything entered during the
suspension is saved.** Autosave of an already-open session goes through a different path and may or may not succeed;
that is unverified, so no statement about it is made. Resume by reversing steps 4, 2 and 1 in that order (new password,
`login`, store, redeploy), then repeating the step 4 journey above.

## Operational notes

- A missing or rejected writer target fails closed (`503 not_configured`) on create and submit. Set the variables
  **before** deploying the app.
- Production does not have `SCORING_DB_URL` today either; it will need `EXAM_WRITE_DB_URL` and
  `EXAM_WRITE_EXPECTED_PROJECT_REF` before this reaches it.
- Connection cost: one short-lived connection per create or submit (`connectionTimeoutMillis` 8 s, role
  `statement_timeout` 10 s), plus one catalogue query to read the role back. If pooler connection limits matter at scale, a shared pool is the follow-up.
- Local and CI: `npm run exam-writer:bootstrap` (also run by `npm run db:reset`) gives the role its local-only password,
  and the environment needs `EXAM_WRITE_ALLOW_LOOPBACK=1`.
- Tests: `src/tests/unit/exam-write-target.test.ts` (the rule matrix), `tests/rls/exam-write-target.test.ts` (live,
  including a role given an elevated attribute) and `tests/rls/exam-write-lockdown.test.ts` (the lockdown itself).
