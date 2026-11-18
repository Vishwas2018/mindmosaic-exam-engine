# Database readiness (hosted DEV `mfglzabnayacssgertat`)

Only `select` statements were run against hosted DEV. No migration, grant, role or password was changed.
Production (`uermhsptduikehuyceiz`) is out of scope and was not contacted. The current state is the section
"Authoritative read of hosted DEV, 2026-11-13" below; the table that follows is the dependency list.

## What the integration branch needs from DEV

| Need | Why | State on hosted DEV |
|------|-----|---------------------|
| Migration `20261031090000_exam_writer_role_and_server_write_functions` | Creates `mindmosaic_exam_writer` and the `*_for` functions | **Applied** (ledger row and catalog, 2026-11-13) |
| `EXAM_WRITE_DB_URL` in the Vercel **Preview / DEV** environment | The app's only route to create a session or record an attempt | **Absent** (Vercel env list, 2026-11-13). The role also has no password |
| Deploy of this branch | Uses the new path | Vercel builds a Preview on every push; the one for `b859a41c` is READY but has no `EXAM_WRITE_DB_URL` |
| Migration `20261031090100_revoke_legacy_exam_write_rpcs_from_clients` | Closes the hole (students could call the legacy RPCs directly) | Not applied. **Must follow the deploy, never precede it** |

## Which paths depend on it (from reading the callers of `legacy-exam-writes.ts`, not from a hosted run)

| Path | Route | Without `EXAM_WRITE_DB_URL` |
|------|-------|------------------------------|
| Start an authenticated exam | `POST /api/exam/session` | `503 not_configured` |
| Submit an authenticated exam | `POST /api/exam/session/[id]/submit` | Attempt not recorded |
| Onboarding diagnostic | `POST /api/student/onboarding/complete` | Session and attempt not recorded |
| Guest practice | `/api/exam/guest-bank`, client state | Unaffected |
| Singapore Maths sample | `/api/practice/singapore-maths/sample/*` | Unaffected (own storage, #88) |
| Autosave of responses | `/api/exam/session/[id]/responses` | Unaffected once a session exists |

So Scenario B of the beta test (child sits and submits an assessment) cannot pass on hosted DEV until the four
rows above are done in order.

## Runbook

`docs/runbooks/legacy-exam-write-lockdown.md` is the reviewed sequence, with a verification query after every step
and a rollback table. It has no destructive step.

## Approval request (owner action)

1. Apply `20261031090000` to DEV only.
2. Set the role password out of band and store `EXAM_WRITE_DB_URL` as a Preview/DEV variable.
3. Allow a Preview deploy of `integration/beta-consolidation` (or of `dev` after #123 merges).
4. After the journey passes on that deploy, apply `20261031090100`.

Impact if not done: authenticated assessments fail closed with a 503. No data is at risk.
Rollback: step 1 is additive and may stay; step 4 is reversed by one `grant execute` (in the runbook).

## Verified in CI on a local Supabase stack (not hosted)

`rls` job on `d7914c21`: pass. It applies every migration in the repository, including both of the above, and runs
`tests/rls/exam-write-lockdown.test.ts`.

## Read-only probe of hosted DEV, 2026-11-13

The owner authorised applying DEV migrations. No migration was applied, because no credential on this machine can:

| Credential tried | Result |
|------------------|--------|
| `SUPABASE_ACCESS_TOKEN` in `.env.e2e.local` | Management API returns 401 |
| Supabase CLI session | Logged in to a different account; it lists three unrelated projects and neither MindMosaic project |
| `SCORING_DB_URL` (role `mindmosaic_scoring`) | Connects to DEV. Cannot create roles, grant, or run DDL |
| Service-role key in `.env.local` | REST only; cannot run DDL |
| Vercel connector / CLI | Connector lacks access to the `vishwas2018s-projects` scope; CLI not linked |

What the probe did establish (project ref checked as `mfglzabnayacssgertat` before every call):

- `POST /rest/v1/rpc/create_exam_session_for` returns `42501 permission denied for function`, not "function not
  found". So **`20261031090000` is already applied on DEV**: the function exists and clients cannot execute it.
- `npm run migrations:status` with the scoring role reports `20261031090100` as **not applied**: an overload of the
  legacy `create_exam_session` / `record_exam_attempt` is still executable by a client role. That is the correct
  state before the app is deployed.
- The same run lists 24 migrations as "not applied". Most of those checks read tables the scoring role cannot
  select, so that figure is not evidence of anything. Re-run with an owner connection before believing it.

Still unknown: whether `EXAM_WRITE_DB_URL` exists in the Vercel Preview environment, and whether the writer role
has a password.

To let the agent finish the sequence, any one of: `supabase login` with the MindMosaic account in this shell; a DEV
owner connection string exported as `SUPABASE_DB_URL` for the session; or do steps 3–5 of the runbook by hand.

## Authoritative read of hosted DEV, 2026-11-13

Method: `supabase db query --linked` from a scratch directory linked to `mfglzabnayacssgertat` only (the repository
worktree is not linked, so no `db push` can reach DEV from it). The CLI was signed in to the MindMosaic account for a
few minutes; `select current_database(), current_user` returned `postgres` / `postgres` on PostgreSQL 17.11. Side
effect: the CLI creates its own short-lived login role to run a query ("Initialising login role..."). Nothing else
was written.

| Fact | Evidence |
|------|----------|
| Ledger has 52 rows; the repository has 53 migrations | `supabase_migrations.schema_migrations` |
| The only repository migration missing from DEV is `20261031090100_revoke_legacy_exam_write_rpcs_from_clients` | set difference, both directions; nothing on DEV is missing from the repository |
| `20261031090000 exam_writer_role_and_server_write_functions` is the newest ledger row | same query |
| Role `mindmosaic_exam_writer`: login true; superuser, bypassrls, createrole, createdb, inherit all false; `statement_timeout=10s`; member of no role; no table privileges; cannot select `public.exam_sessions` | `pg_roles`, `pg_auth_members`, `role_table_grants`, `has_table_privilege` |
| **The writer role has no password** (`rolpassword is null`); `mindmosaic_scoring` has a SCRAM-SHA-256 one | `pg_authid` (boolean and scheme prefix only; no hash was read out) |
| `create_exam_session_for(uuid,jsonb,text,text[],timestamptz)` and `record_exam_attempt_for(uuid,uuid,jsonb,jsonb)`: security definer, `search_path=public, pg_temp`, ACL `{postgres=X, mindmosaic_exam_writer=X}` | `pg_proc` |
| Legacy `create_exam_session(jsonb,text,text[],timestamptz)` and `record_exam_attempt(uuid,jsonb,jsonb)`: ACL still `{postgres=X, authenticated=X, service_role=X}` | `pg_proc`. This is runbook step 1: the hole is open, as expected before the deploy |

So runbook steps 1 and 2 are complete on DEV. Step 3 (password and variable) is the next act.

The CLI session then changed to a different account (it lists three unrelated projects again) and every further
query returns 403. Not read because of that: whether the synthetic `mm-dev-*@example.com` accounts still exist.

## Vercel, 2026-11-13 (names and targets only; no value was decrypted)

Project `mindmosaic-exam-engine` (`prj_E3cvtuTiV0XMVdcfoDarUs2XFS1A`), production branch `main`.

- Preview variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SCORING_DB_URL` (all sensitive), plus plain guards `PRODUCTION_SUPABASE_PROJECT_REF=uermhsptduikehuyceiz`,
  `SCHOLARSHIP_SAMPLE_SUPABASE_REF=mfglzabnayacssgertat`, `SINGAPORE_MATHS_SAMPLE_SUPABASE_REF=mfglzabnayacssgertat`.
- **`EXAM_WRITE_DB_URL` does not exist in any environment.**
- The Preview for `b859a41c` (`mindmosaic-exam-engine-c1kfnffkr-...`) was opened in the owner's signed-in browser.
  All 13 script bundles of `/sign-in` were searched for `*.supabase.co`: the only project ref present is
  `mfglzabnayacssgertat`. The production ref does not appear. The CSP is report-only, no enforcing header.
- Not verifiable without decrypting: that the server-only `SUPABASE_SERVICE_ROLE_KEY` and `SCORING_DB_URL` on
  Preview belong to DEV. `SCORING_DB_URL` in the local `.env.local` has user `mindmosaic_scoring.mfglzabnayacssgertat`.
- Previews are behind Vercel Authentication (`all_except_custom_domains`) and the project has no automation bypass.
  A script cannot reach a Preview until the owner creates one.
- Gap: `legacy-exam-writes.ts` does not check which project `EXAM_WRITE_DB_URL` points at. The pooler user name
  carries the project ref, so a wrong value is visible to whoever sets it, but nothing in code refuses it.

## Remaining owner actions for `EXAM_WRITE_DB_URL` (runbook step 3)

Value shape, matching `SCORING_DB_URL`:
`postgresql://mindmosaic_exam_writer.mfglzabnayacssgertat:<secret>@aws-1-eu-west-3.pooler.supabase.com:6543/postgres`

1. Generate a 40-character letters-and-digits secret in a password manager (no symbols, so no percent-encoding).
2. Supabase dashboard, project **mindmosaic-dev**, SQL editor:
   `alter role mindmosaic_exam_writer password '<secret>';`
3. Vercel, project settings, Environment Variables: add `EXAM_WRITE_DB_URL`, environment **Preview only**, marked
   Sensitive, with the value above. Do not add it to Production.
4. Redeploy the Preview of `integration/beta-consolidation` (a variable only reaches new builds).
5. For scripted acceptance: Settings, Deployment Protection, "Protection Bypass for Automation", create a secret and
   put it in the shell as `VERCEL_AUTOMATION_BYPASS_SECRET` for the test run. Not needed for a manual browser check.

Acceptance run for runbook step 4 once the redeploy is READY:
`APP_URL=https://<preview-host> node C:/tmp/mindmosaic-scoring-validation-2026-10-31/scripts/score-e2e-preview.cjs`
It covers start, autosave and resume, submit, scoring against an independent oracle (188 questions), attempt
history, cross-student isolation and RLS. Its `FORGE-RPC` check is expected to **fail** until `20261031090100` is
applied, and to pass after.

## Not verified

- Whether the synthetic DEV accounts used by the acceptance script still exist.
- That the server-only Preview secrets point at DEV (see above).
- RLS behaviour on hosted DEV (only the local stack was exercised).
- Any exam start, autosave, submit or scoring on a deployed Preview.

## Lockdown approval request: `20261031090100` (DEV only)

Prepared 2026-11-13 after the new write path passed on Preview `rg3yjc7he` (`ff775d2d`), 65/66, the only failure
being `FORGE-RPC`.

- **What runs:** `supabase/migrations/20261031090100_revoke_legacy_exam_write_rpcs_from_clients.sql`, alone,
  against `mfglzabnayacssgertat` through the linked dir `C:/tmp/mm-dev-link` (`supabase db query --linked -f`),
  then its ledger row. Never `db push`. Production untouched.
- **What it does:** revokes EXECUTE on `create_exam_session` and `record_exam_attempt` from `public`, `anon` and
  `authenticated`, refuses to run if the `_for` replacements are missing, and asserts the result. No table, row or
  function is dropped. `service_role` keeps its grant.
- **Who breaks:** any deployment that still calls the legacy RPCs with a user JWT. That is every Preview built
  from a branch without this branch's write path, **including `dev`**. Exam start and submit there fail with 42501
  until #123 reaches `dev`.
- **Verification after:** as the synthetic student over PostgREST both legacy RPCs return 42501; rerun
  `run-preview-acceptance.cjs`: `FORGE-RPC` passes and the other 65 stay green; ledger shows no drift.
- **Rollback:** see the runbook (re-grant to `authenticated`, which re-opens the hole; record who decided).
