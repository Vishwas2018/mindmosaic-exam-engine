# Runbook: legacy exam write lockdown (P1 assessment integrity)

ADR-005 Amendment E. Migrations `20261031090000` (additive) and `20261031090100` (breaking for the previous app
version). **The order matters: the application must be deployed between them.**

Nothing here is applied by the PR. Every hosted step needs the owner (a database credential, a migration apply, a
deploy, a secret).

## Why two migrations

| | Applies | Effect on the running (old) app | Effect on the new app |
|---|---|---|---|
| `...090000` | role + `*_for` functions | none | needs it |
| `...090100` | revokes the legacy functions from clients | **breaks** it (permission denied on create/submit) | needs it to close the hole |

## Sequence for DEV (`mfglzabnayacssgertat`), then the same for any other environment

Do not run these against Production without a separate owner decision.

1. **Pre-check (read-only).** In the SQL editor:
   `select proname, proacl from pg_proc where proname in ('create_exam_session','record_exam_attempt');`
   Note that `authenticated=X` appears (the hole is open). *Verify:* record the output.
2. **Apply `20261031090000` only.** (`supabase db push` pushes every pending migration; apply the files individually
   or through the dashboard so step 5 stays a separate act.)
   *Verify:* `select rolname, rolcanlogin, rolsuper, rolbypassrls, rolinherit from pg_roles where rolname =
   'mindmosaic_exam_writer';` returns login true, the rest false.
   `select has_function_privilege('authenticated', 'public.create_exam_session_for(uuid,jsonb,text,text[],timestamptz)', 'EXECUTE');`
   returns false. The running app still works.
3. **Set the role password out of band** (owner; never in the repo or a log):
   `alter role mindmosaic_exam_writer password '<secret>';` then store the connection string as the **Preview/DEV**
   variable `EXAM_WRITE_DB_URL` in the hosted secret store, using the same pooler/host style as `SCORING_DB_URL`
   (already set on Preview). *Verify:* `psql "$EXAM_WRITE_DB_URL" -c "select 1"` succeeds, and
   `-c "select * from public.exam_sessions limit 1"` fails with permission denied.
4. **Deploy the application** (this branch) to a Preview. *Verify with the real app, still on the old grants:* a
   synthetic student starts an exam, autosaves, submits, and the attempt row exists. This proves the new path works
   while the old one is still open, so a failure here belongs to the new path, not to the revoke.
5. **Apply `20261031090100`.** *Verify (the fix):* as a signed-in synthetic student over PostgREST,
   `POST /rest/v1/rpc/create_exam_session` and `.../record_exam_attempt` return `42501 permission denied for function`.
   Re-run step 4's journey: it still works. `npm run migrations:record && npm run migrations:status` against the target
   shows no drift.
6. **Regression run:** the hosted scoring script
   (`C:\tmp\mindmosaic-scoring-validation-2026-10-31\scripts\score-e2e.cjs`): its `FORGE-RPC` check must now PASS and
   the 188-question scoring comparison must be unchanged.

## Rollback

| If | Do | Restores |
|---|---|---|
| Step 4 fails (new path broken) | Roll the Preview back to the previous deployment. `...090000` is additive and may stay. | Previous behaviour; hole still open |
| Step 5 breaks real exams (for example `EXAM_WRITE_DB_URL` missing in an environment that was overlooked) | **Prefer fixing the variable.** Only if urgent: `grant execute on function public.create_exam_session(jsonb,text,text[],timestamptz), public.record_exam_attempt(uuid,jsonb,jsonb) to authenticated;` and roll the app back | Previous behaviour; **re-opens the P1 hole**. Record who decided and why |
| The writer role is compromised | `alter role mindmosaic_exam_writer nologin;` (stops all exam creation and submission, which fail closed with 503) then rotate the password | A safe stop. No data exposure: the role reads nothing |

There is no destructive step: no table, column or row is dropped or rewritten, and the legacy functions are kept.

## Operational notes

- A missing `EXAM_WRITE_DB_URL` fails closed (`503 not_configured`) on create and submit. Set the variable **before**
  deploying the app.
- Production does not have `SCORING_DB_URL` today either; it will need `EXAM_WRITE_DB_URL` before this reaches it.
- Connection cost: one short-lived connection per create or submit (`connectionTimeoutMillis` 8 s, role
  `statement_timeout` 10 s). If pooler connection limits matter at scale, a shared pool is the follow-up; it was left
  out to keep this change a drop-in.
- Local and CI: `npm run exam-writer:bootstrap` (also run by `npm run db:reset`) gives the role its local-only password.
