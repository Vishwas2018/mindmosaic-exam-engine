# DEV integration readiness: PR #165 (multi-role workspaces) + PR #166 (UAT Assistant)

Date: 2026-11-27. Base: `origin/dev` `760d7191`. Status: **prepared for owner approval. Nothing merged, no migration applied, no secret changed, production untouched.**

## 1. Verdict

**GO to merge both PRs into `dev` (code only), in the order below, once the owner approves. CONDITIONAL GO for applying the DEV migration and turning on Admin MFA: the procedure is ready, but the integrated browser flow (migrated database + MFA + UAT Assistant) has not been run end to end yet. See section 6 and the approvals in section 9.**

## 2. State of the two PRs against the latest `origin/dev`

| | PR #165 `feat/multi-role-workspace` | PR #166 `feat/ai-uat-assistant` |
|---|---|---|
| Head | `941855ce` | `b8a7bde3` |
| Behind `dev` | 0 | 0 |
| Mergeable | yes, clean | yes, clean |
| CI | green (core, e2e, e2e-auth, rls, scholarship-drafts, Vercel) | green (same 7 checks) |
| Draft | yes | yes |
| Merge of the two | `git merge-tree` clean, no conflicts | |

Recommended order: **#165 first, then #166 rebased/merged on it.** #166 was written to work with or without #165 (it falls back to the legacy rule when `user_roles` does not exist), so either order is safe at runtime. Doing #165 first lets #166 adopt the shared helpers (section 4) with no duplicate logic.

## 3. PR #165 migration readiness (`20261126090000_multi_role_workspaces.sql`)

Reviewed line by line against `origin/dev`.

| Check | Result |
|---|---|
| Prerequisite objects exist on DEV (`admin_draft_review_decisions`, `admin_draft_review_approvals`, `content_owner_approvals`, `authoring_question_revisions`, `subscriptions` 163 rows, `parent_children` 63 rows) | Present (read-only probe, DEV `mfglzabnayacssgertat`, no writes) |
| New objects not already on DEV (`user_roles`, `role_audit_events`, `security_settings`) | Absent, as expected |
| Existing admins carried over | Read-only preflight: **5 admin profiles, all "will be backfilled", `RESULT: OK`** |
| Strands no admin | `MM109` abort inside the migration if any admin profile is not backfilled |
| Content-factory functions rewritten faithfully | Normalised diff of `owner_approve_content`, `owner_approve_batch`, `enforce_owner_approval_actor` against `20260825090000`: the **only** change is the role check (`profiles.role` read replaced by `public.is_admin()`) |
| Grants | `user_roles` / `role_audit_events` / `security_settings`: no write grants to `authenticated` or `anon`; `grant_admin_role` / `revoke_admin_role` executable by `service_role` only; students refused (`MM108`) |
| Audit trail | `role_audit_events` append-only (`MM107`), survives rollback |
| MFA switch default | `require_admin_mfa = false`: applying the migration changes nothing about sign-in until the owner flips it |
| Rollback | Present and tested; keeps audit; re-apply supported |
| Fresh re-verification today | PGlite harness (`C:/tmp/multirole-pglite`): **t1 53/53, t2 51/51** pass against the migration and rollback |
| Real-Postgres RLS + browser E2E for #165 | Green in #165 CI (`rls`, `e2e-auth`). Not re-run locally (Docker not running; RAM near the 4 GB stop line) |

Minor observations (non-blocking): unused `v_role` declarations in two function bodies; the migration has no explicit `begin; ... commit;` (the runbook wraps it); the SQL Editor does not make a failed partial run safe, so keep the wrapper.

**Verdict on the migration: ready to apply to DEV after owner approval, subject to the preconditions in section 5.**

## 4. Shared entitlement helper integrated into the UAT Assistant

Done in a local, unpushed integration branch `integration/multi-role-uat-local` (worktree `C:/tmp/wt-integ-165-166`, commit `2a3acc40` on top of the clean merge `5ffb3f23`).

- New shared `adminMfaOutcome()` in `src/features/auth/admin-grants.ts`. `requireRole` now uses it, so the role gate and the UAT Assistant share **one** MFA decision.
- `uat-entitlement.ts` no longer carries its own copies of the grant lookup, table-missing classifier or MFA check. `resolveUatAdminStanding` is now derived from `resolveEntitledRoles`; grants load via `loadAdminGrants`.
- New parity test: for every primary role (parent, admin, teacher, student, none) x every lookup outcome (active, revoked, empty, `missing`, `error`), UAT's "is admin" equals the shared role gate's answer.
- Existing UAT tests kept the same assertions; only the imported names changed.
- Result on the integrated tree: typecheck clean, lint 0 errors (17 warnings, not compared with the `dev` baseline), UAT + role + page tests 180/180.

This must land as a follow-up commit after #165 is on `dev` (it cannot be pushed onto #166 alone because it depends on #165's helpers).

## 5. DEV-only migration, administrator grant and MFA procedure (needs owner approval at each step)

All steps are DEV (`mfglzabnayacssgertat`) only. Production `uermhsptduikehuyceiz` is out of scope and needs its own owner-approved release.

**Preconditions**
1. Both PRs reviewed; #165 merged to `dev` (owner).
2. Hosted DEV has Auth → Multi-Factor **TOTP enabled** (dashboard; the repo's `config.toml` covers local only). Owner to confirm.
3. Owner's account exists, is a Parent (not Student), and its display name is the real two-word name (Admin Review decisions require it).
4. Decide who else must enrol before the switch is flipped (the 5 existing admin profiles: synthetic QA/acceptance accounts).

**Steps**
1. Preflight (read-only): `node scripts/admin/verify-admin-migration.mjs --env <.env.local>`; expect 5 admins, `RESULT: OK`. (Re-run immediately before applying; counts may drift.)
2. Apply `supabase/migrations/20261126090000_multi_role_workspaces.sql` in the DEV SQL Editor wrapped in `begin; ... commit;`. Record it in the migration ledger as `multi_role_workspaces`.
3. Postflight (read-only): run the verify script again, plus blocks B-D of `docs/security/multi-role/verify-admin-migration.sql`. Expect: `RESULT: OK`, 0 admins without an active grant, backfill audit rows = 5, 0 student entitlements, subscriptions 163 / parent_children 63 / decisions unchanged.
4. Owner grant: `node scripts/admin/manage-admin-role.mjs --env <.env.local> --email <owner> --reason "<why>"` (dry run), then add `--apply`. The owner keeps the Parent profile; Admin is added as an entitlement.
5. Owner signs in at `/staff/sign-in`, enrols the authenticator at `/staff/mfa` **first**, and confirms an aal2 session reaches `/admin/review`.
6. **Only then** (and only with owner approval) turn the switch on: `update public.security_settings set bool_value = true where key = 'require_admin_mfa';`

**Warning for step 6:** the switch is global. Every admin, including the 5 synthetic accounts and the fixture admins the hosted acceptance suites create, is refused until it has enrolled TOTP. The hosted acceptance specs create admin fixtures without TOTP, so they will fail once the switch is on. Keep the switch **off** on DEV until the owner decides how to handle test accounts (TOTP helper in the specs, or a per-environment decision).

**Rollback:** `supabase/migrations/rollbacks/20261126090000_multi_role_workspaces.down.sql` (transactional; keeps `role_audit_events`; dual-role users lose Admin by design; revoked admin profiles are demoted to `parent`).

## 6. Verification of Parent/Admin switching, MFA, revocation and cross-portal UAT

| Behaviour | Evidence | Level |
|---|---|---|
| Parent/Admin switching (switcher, redirects, no loops) | #165 `e2e/auth/multi-role-workspaces.spec.ts` green in #165 CI; layout/page unit tests pass on the integrated tree | Browser (#165 CI) + unit (integrated) |
| MFA enforcement for the role gate | `adminMfaOutcome` / `requireRole` unit tests; fail-closed on unreadable switch and unprovable aal2; DB `is_admin()` enforced in PGlite 53/53, 51/51 and RLS CI | Unit + DB |
| MFA enforcement for UAT | UAT uses the same `adminMfaOutcome`; parity test; `admin_mfa_required` denial clears credentials | Unit (integrated) |
| Revocation ends UAT access | `revalidateTesterSubject` re-checks on every cookie use (unit); hosted run on Preview: after revoke `enabled:false`, tester cookie cleared | Unit + hosted (pre-migration DB path) |
| Cross-portal UAT (tester cookie reaches the Parent portal) | Hosted UAT-H3 passed on the Preview: launcher visible via tester cookie | Hosted (pre-migration DB path) |
| Whole flow on a **migrated** database with MFA on, UAT included | **NOT RUN.** Needs local Supabase (Docker, not running; RAM 4-6 GB vs the 8 GB gate) or CI on a pushed integration branch | Gap |

Closing the gap: either (a) owner approves pushing `integration/multi-role-uat-local` as a draft PR so CI runs `rls` + `e2e-auth` on the merged tree, or (b) start Docker with >= 8 GB free and run `npm run test:rls` and `npm run test:e2e:auth` locally. A combined spec (Parent+Admin dual-role user, TOTP via `e2e/helpers/totp.ts`, then the UAT launcher) is recommended and was not written because it could not be run here.

## 7. NVIDIA configuration for a stable DEV deployment

Verified on the Vercel project (names and targets only; values are Sensitive and unread):

| Variable | Type | Target | Needed |
|---|---|---|---|
| `NVIDIA_API_KEY` | sensitive | Preview only | yes |
| `MM_UAT_AI_PROVIDER` (= `nvidia`) | sensitive | Preview only | yes |
| `QF_AI_NVIDIA_MODEL` (= `nvidia/nemotron-3.5-lightning-30b-a3b`) | sensitive | Preview only | yes |

- Applies to every Preview branch, including the stable `dev` Preview. No Production or Development scope.
- Proven live on `64f3b4b7`: provider `nvidia`, that exact model, 2.4-2.7 s.
- Not set and not required: `NVIDIA_API_BASE_URL` (defaults to `https://integrate.api.nvidia.com/v1`, pinned to an `nvidia.com` host), `MM_UAT_SESSION_SECRET` (falls back to an HMAC of the service key; a dedicated secret of >= 16 chars is optional hardening), `MM_UAT_GITHUB_TOKEN` / `MM_UAT_GITHUB_REPO` (GitHub issue creation is off; `githubConfigured:false`).
- Recommendations: set a spend or rate cap on the NVIDIA key; keep model ID and key together when rotating; the feature is already refused on Vercel Production by code.

## 8. Four readable integration secrets (no values read or changed)

Vercel flags `KV_REST_API_READ_ONLY_TOKEN`, `REDIS_URL`, `KV_URL`, `KV_REST_API_TOKEN` as `readable-secret`: encrypted-type variables injected by the Marketplace Redis store `store_8D4dhRbr5RvRoTEq`, Preview scope, all branches. The listing returned only encrypted ciphertext envelopes (`decrypted:false`), not plaintext, but any project member with env read permission can reveal the plaintext.

What the app actually uses (`src/lib/security/guard-store.ts`): **`KV_REST_API_URL` and `KV_REST_API_TOKEN` only** (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`). `KV_URL`, `REDIS_URL` and `KV_REST_API_READ_ONLY_TOKEN` are **not referenced by any code**.

Recommended remediation (owner action, in order):
1. Remove the three unused variables (`KV_URL`, `REDIS_URL`, `KV_REST_API_READ_ONLY_TOKEN`) from the project's Preview scope: least privilege; `REDIS_URL` carries a TCP credential.
2. Rotate the REST token in the Redis provider console, then store the new value as manually created **Sensitive** variables named `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (the code reads these first). Marketplace-injected variables cannot be converted in place.
3. Disconnect the store from the project so the integration stops re-injecting the old names; redeploy the Preview and confirm the guest guard reports a Redis-backed store.
4. Turn on the team policy to create new environment variables as Sensitive by default.
Note: hosted deployments fail closed when the Redis guard is missing or failing, so do steps 2-3 together and verify before revoking the old token.

## 9. Regression summary (integrated tree `2a3acc40`)

| Gate | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors, 17 warnings |
| `npm test` | **479 files, 7,661 tests passed**, exit 0. (A first run under heavy machine load showed slow-test failures that did not reproduce on a clean rerun; no assertion was changed.) |
| `npm run build` | pass (after installing real `node_modules`; a symlinked `node_modules` is rejected by Turbopack) |
| `npm run validate:questions` | pass |
| `npm run check:answers -- --include-published` | pass |
| `npm run questions:validate-ledger` | pass |
| PGlite migration + rollback suites | 53/53 and 51/51 |
| `npm run test:rls`, `test:e2e`, `test:e2e:auth` | **not run locally** (no Docker; memory gate). Each PR's own CI is green; the merged tree has not had CI. |
| Hosted UAT suite on Preview `64f3b4b7` | 4/4 pass, live NVIDIA |

## 10. Approvals needed (nothing below has been done)

1. Merge #165, then #166 (owner, via GitHub).
2. Push `integration/multi-role-uat-local` as a draft PR so CI covers the merged tree (or run Docker locally).
3. Apply the migration to DEV (steps 1-3 of section 5) and run the owner grant and TOTP enrolment (4-5).
4. Decide on flipping `require_admin_mfa` and how to treat synthetic/fixture admins (step 6).
5. Execute the secret remediation (section 8).
