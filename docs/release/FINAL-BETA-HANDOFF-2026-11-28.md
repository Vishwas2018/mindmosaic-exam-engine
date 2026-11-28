# Final DEV beta remediation: handoff (2026-11-28)

DEV only (`mfglzabnayacssgertat`). No secret value appears in this file or may be pasted into chat, issues or PRs.
Production is out of scope. No account deletions. Global MFA stays off.

State at hand-off: PR #169 merged to `dev` (`8ca82820`), PR #170 merged (`2104c0c7`), integrated `dev` CI green on both
runs of `8ca82820`. **The #169 migration is now APPLIED to DEV and independently verified** (see section 0). Do not reapply.

## 0. Migration evidence (applied and verified, 2026-11-28)

Applied by the owner; independently verified by ChatGPT on DEV `mfglzabnayacssgertat`. **DO NOT REAPPLY.**
- Ledger row `20261128090000_harden_definer_helpers` matches the repository version.
- Anonymous EXECUTE denied for `has_active_access`, `is_student_profile`, `session_has_attempt`.
- `is_student_profile` restricted to the service role; enrolment trigger `class_students_require_student` enabled.
- `exam_responses` INSERT and UPDATE ownership policies verified.
- Existing data counts unchanged; exactly three active Admin entitlements; global MFA still disabled.
- Anonymous SECURITY DEFINER advisor findings: 13 to 10.

Independent anon probe by this agent (PostgREST RPC with the public anon key, DEV only, ids are a nil-style UUID, no data
returned): `has_active_access` 401 `42501`, `is_student_profile` 401 `42501`, `session_has_attempt` 401 `42501`
(permission denied for all three). The authenticated-role and service-role probes, hosted regression, manual-family
seed and W1-W4 are **not yet run**: free RAM was 4.2 GB against the 8 GB gate.

## 1. DEV migration handoff (historical: already applied, see section 0): `20261128090000_harden_definer_helpers.sql`

Applied by ChatGPT / the owner (not by this agent). File: `supabase/migrations/20261128090000_harden_definer_helpers.sql`.
Rollback: `supabase/migrations/rollbacks/20261128090000_harden_definer_helpers.down.sql`.

**It is not idempotent.** It uses `drop policy` without `if exists`, so it fails (and, being one transaction, changes
nothing) if run twice. Do not reapply. If the pre-check shows it is already applied, stop.

### 1a. Pre-flight (read-only; run in the DEV SQL editor, confirm the project ref in the URL first)
```sql
-- Expect: 0 rows in trigger list, helper still callable by anon/public (the finding), policies in their old form.
select 'trigger present' as check, count(*) from pg_trigger
 where tgname = 'class_students_require_student' and not tgisinternal;                     -- expect 0
select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname in ('has_active_access','is_student_profile','session_has_attempt');
                                                                                           -- expect anon_exec = true (pre)
select version from supabase_migrations.schema_migrations where version = '20261128090000'; -- expect 0 rows
```

### 1b. Apply
Paste the file's full contents into the DEV SQL editor (single transaction; it ends with `commit`). Record the success
output. Then (owner or ChatGPT) record the ledger row only after 1c passes.

### 1c. Post-apply verification (read-only; every line must match)
```sql
select p.proname,
       has_function_privilege('anon', p.oid, 'execute')          as anon_exec,       -- expect false x3
       has_function_privilege('public', p.oid, 'execute')        as public_exec,     -- expect false x3 (PUBLIC pseudo-role)
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,       -- expect true, false, true  (has_active_access, is_student_profile, session_has_attempt)
       has_function_privilege('service_role', p.oid, 'execute')  as service_exec     -- expect true x3
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname in ('has_active_access','is_student_profile','session_has_attempt')
 order by p.proname;
select count(*) from pg_trigger where tgname = 'class_students_require_student' and not tgisinternal;  -- expect 1
select policyname, cmd from pg_policies
 where tablename = 'exam_responses' and policyname in ('exam_responses: student inserts own','exam_responses: student updates own'); -- expect 2 rows
select pg_get_expr(polwithcheck, polrelid) like '%caller_is_teacher%' as enrol_policy_ok
  from pg_policy where polname = 'class_students: teacher adds to own class';            -- expect true
```
`has_function_privilege('public', …)` is the check that PUBLIC no longer holds EXECUTE; if the editor rejects the
`public` role name, use `select proacl from pg_proc …` and confirm no `=X/…` entry (an entry with an empty grantee is PUBLIC).

### 1d. After 1c passes: rerun (the regression order, section 6)
Security isolation probes, hosted regression, W1–W4, then the Admin count. The expected behavioural deltas are in the
PR #169 description: anonymous calls of the three helpers now fail; a student still reads their own parent's access;
a teacher can no longer probe arbitrary ids; enrolling a non-student still fails with `42501`.

### 1e. Rollback
Run the `.down.sql` in the DEV SQL editor. It restores the previous bodies and grants; the trigger is dropped and the
old enrolment policy returns. Do this only if a legitimate flow breaks (parent billing gate for a student, class enrolment,
answer autosave), and record why.

## 2. Synthetic manual-family seed and Parent–Student journey

Runbook: `docs/release/DEV-OPERATIONS-RUNBOOK.md` section 3. Credentials are already generated outside the repo
(`C:/tmp/manual-family/manual-family.env`). **Gate: at least 8 GB free RAM** (the hosted runner has been reaped under
memory pressure; see `rc-testing` notes). Sequence:

1. `node --env-file=C:/tmp/manual-family/manual-family.env scripts/hosted-acceptance/run.mjs <stable alias> -- e2e/hosted/m-manual-test-family.spec.ts` with `HOSTED_SEED_MANUAL=1` (creates the confirmed Parent via service role, two children via the app form; idempotent).
2. Journey, on the stable alias, with that Parent and then a child login code: Parent sign-in → children list shows two → child login → start a practice exam → submit → result visible to the child → Parent sees the attempt and archive/restore of a child works → sign out. Child credentials come from `test-results/hosted/<run>/manual-family.json` (gitignored).
3. Run after the section 1 migration so the student-reads-parent-access path (`has_active_access`) is exercised against the hardened helper.
4. Admin count afterwards (section 7).

## 3. Vercel protection-bypass secret rotation plan (do not execute without separate authorisation)

**Why.** The bypass secret is embedded as a query parameter in Stripe-registered webhook URLs, so anyone with Stripe
Dashboard access can read it, and it was printed once in an earlier session's terminal. It bypasses Deployment Protection
for the whole project.

**Inventory (no values).**
| Where it is used | Effect of rotation |
|---|---|
| Stripe sandbox webhook endpoints (query parameter on the URL) | deliveries get 401 from Vercel until the URL is updated. The sandbox lists four endpoints (three branch-alias ones and DEV `we_1UfGSWDtPH5dvWkmfOn2qOh8`); step 1 decides which actually carry the parameter |
| Hosted runner `scripts/hosted-acceptance/run.mjs` (`--env`, bypass header) | hosted suites cannot reach the alias until the local env var is updated |
| `C:/tmp/stripe-readiness` billing runner | same |
| Vercel env var `VERCEL_AUTOMATION_BYPASS_SECRET` (system-managed on regenerate) | auto-updates on redeploy |
| GitHub Actions secrets, if any CI job hits a protected deployment | check `gh secret list` names only |

**Steps (owner, in order, ~15 minutes, off-hours).**
1. Pre-check: Stripe sandbox → Webhooks → note which endpoint URLs carry `x-vercel-protection-bypass=`. Record endpoint ids only.
2. Vercel → Project → Settings → Deployment Protection → Protection Bypass for Automation → **Regenerate**. Copy the new value to a password manager; do not paste into chat.
3. For each Stripe endpoint from step 1: *Update details* → replace the query parameter with the new value. Keep the same endpoint, so its signing secret (`STRIPE_WEBHOOK_SECRET`) does **not** change.
4. Update the local runner env (the file the hosted runner reads) with the new value in an editor.
5. Redeploy `dev` (the system variable refreshes only on a new deployment).
6. Verify: (a) Stripe → endpoint → *Send test event* `invoice.paid` returns 200; (b) `node scripts/billing-readiness/run.mjs <alias> <env> -- e2e/hosted/s2-billing-security.spec.ts` W1 final assertion passes; (c) one hosted spec starts; (d) the old value now returns 401 (a single `curl -s -o /dev/null -w "%{http_code}"` with the old header against the alias).
7. Record the date and endpoint ids (not values) in this file.

**Rollback.** Vercel does not restore an old value. If a step fails, the recovery is forward: generate a fresh value again
and repeat steps 3–5. Webhook deliveries missed during the window are retried by Stripe for up to 3 days; failed ones can
be replayed from the Dashboard (*Resend*), and billing is reconciled by `docs/beta-readiness/BILLING-RECONCILIATION.md`.
Never disable Deployment Protection as a shortcut.

**Longer term.** Put the beta on a custom domain with its own protection policy, then drop the query parameter from every endpoint.

## 4. Configuring `BILLING_WEBHOOK_SECRET` (never print it)

`BILLING_WEBHOOK_SECRET` is only the **local** test copy of the endpoint's signing secret. `scripts/billing-readiness/run.mjs`
reads it from the `STRIPE_WEBHOOK_SECRET=` line of `C:/tmp/stripe-readiness/webhook-secret.env`. The deployed copy is the
Sensitive Vercel variable `STRIPE_WEBHOOK_SECRET` (Preview, branch `dev`) and cannot be read back.

1. Stripe Dashboard → sandbox (test mode) → Developers → Webhooks → endpoint `we_1UfGSWDtPH5dvWkmfOn2qOh8` → *Signing secret → Reveal*.
2. In an editor (not a terminal), open `C:/tmp/stripe-readiness/webhook-secret.env` and set exactly one line: `STRIPE_WEBHOOK_SECRET=whsec_…`. Save and close. Do not paste it into chat, a PR, an issue or a shell history.
3. Restrict the file: `icacls C:\tmp\stripe-readiness\webhook-secret.env /inheritance:r /grant:r "%USERNAME%:R"`.
4. Prove it matches the deployment without printing it: run only the signature specs (command in `DEV-OPERATIONS-RUNBOOK.md` section 2, step 3). W1's final assertion (a correctly signed event returns 200) is the proof.
5. If the Dashboard value was ever lost or exposed: *Roll secret*, set the Vercel variable `STRIPE_WEBHOOK_SECRET` (Preview, branch `dev`, Sensitive) to the new value, redeploy `dev`, update the local file. **Rolling the endpoint secret is independent of the bypass rotation in section 3.**
6. Check only that it is set, never its value: `node -e "const f=require('fs').readFileSync('C:/tmp/stripe-readiness/webhook-secret.env','utf8');console.log(/^STRIPE_WEBHOOK_SECRET=whsec_\S{8,}$/m.test(f))"` prints `true`/`false`.

## 5. Custom SMTP and password recovery

Procedure: `docs/beta-readiness/SMTP-RUNBOOK.md` ("Verification after it is applied"). Real delivery must be proven with
`HOSTED_MAIL_BASE=<inbox you can read>`; `HOSTED_CONFIRM=admin` proves nothing about delivery. Required evidence, none
of which this agent can produce unaided:
- Sender shown on the received message is the configured domain, not `noreply@mail.app.supabase.io`.
- Two registrations within five minutes are both accepted (no hourly-cap refusal).
- Confirmation link lands signed in; recovery email arrives; the link sets a new password; the old password is refused.
- Reading the live SMTP settings needs a Supabase personal access token for the owner's account; the dry run is `node scripts/dev-auth/configure-smtp.mjs` (reads only, never prints credentials).

## 6. Regression order after the migration is applied

1. Admin count baseline (below).
2. Security isolation probes: `e2e/hosted/d-security-isolation.spec.ts`, `v-vihaan-restriction.spec.ts`, `n-negative-auth.spec.ts`, plus anonymous RPC calls to the three helpers (expect permission denied).
3. Hosted regression: `run.mjs` over the `e2e/hosted/` suite on the stable alias (one worker).
4. W1–W4: `scripts/billing-readiness/run.mjs` with `s1`–`s4` (needs section 4 done).
5. Mail: `a0-real-email.spec.ts` with `HOSTED_MAIL_BASE`.
6. Admin count again.

## 7. Admin entitlement check after every run

`npx tsx scripts/hosted-acceptance/reconcile-fixtures.mts --env <DEV .env.local> --older-than 0` must end with
`active Admin entitlements now: 3` and `0 synthetic Admin fixture entitlement(s)`. If it finds orphans, rerun with
`--apply` (audited revoke, never delete) and record the run id.

Measured 2026-11-28 after both merges, before any further test: **0 orphans, 3 active Admin entitlements.**
