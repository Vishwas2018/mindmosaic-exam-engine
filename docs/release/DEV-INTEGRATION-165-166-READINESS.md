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

## 11. Phase 5: integrated DEV release acceptance (PR #168, head `61685534`)

DEV only. Global MFA stayed off (`require_admin_mfa=false`, re-read at the end). No production, credential or account-deletion action. The owner grant was not repeated. Fixtures are retired by revoking their Admin entitlement; no account was deleted.

### Deployment identity
| Target | Identity |
|---|---|
| Stable DEV alias | `mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app`, dev `9b936502` (`dpl_BcqkBDeNytU7Bo8SAi87E1Vta2Ji`) |
| PR #168 Preview | `mindmosaic-exam-engine-git-test-ph-5d57a1-vishwas2018s-projects.vercel.app`, contains the UAT context fix |

The fix is only on the PR Preview until #168 is merged (merge is not authorised).

### What changed
1. **Phase 4 spec preserved**: `e2e/hosted/multi-role-uat-hosted.spec.ts` (P4-0..P4-5 unchanged, assertions tightened for the new session fields).
2. **Legacy fixtures migrated**: `admin-review-scholarship`, `uat-assistant-hosted`, `auth-audit/02`, `auth-audit/03` grant Admin through the audited `grant_admin_role` RPC (`grantFixtureAdmin`). Every hosted spec that deleted accounts (`admin-review`, `auth-audit/01-04`, `billing-helpers`) now calls `retireFixtureUser`, which revokes Admin and never deletes unless `HOSTED_ALLOW_DELETE=1`. Original objectives and negative-access assertions are unchanged.
3. **UAT workspace context**: `activeRole` was the profile role, so a dual-role login in Admin was labelled `parent`. `/api/uat/session` now returns `primaryRole` and server-resolved `entitledRoles`; the shell derives the workspace from the route (`resolveWorkspaceContext`) and stores `activeWorkspace`, `workspaceEntitled`, `primaryRole`, `entitledRoles` on each defect (and in the Markdown export). The route value is advisory metadata only; authorisation still comes from the session on every call. New P4-6 hosted test and 15 unit tests (all portals, not-entitled flag, forged query/headers refused, revoked grant refused, access-revoked refused).

### Results
| Suite | Result |
|---|---|
| CI on `61685534` | core 480 files / **7,679 tests** pass; e2e **395** pass; e2e-auth **109** pass; rls pass; scholarship-drafts pass; Vercel pass |
| Hosted Phase 4 (P4-0..P4-6) | **7/7** on the PR Preview (first run 6/7: P4-6 asserted `/parent`, but an empty parent account redirects to `/parent/setup`; test corrected, product behaved correctly) |
| Hosted UAT-H1..H4 | **4/4** (live NVIDIA `nvidia/nemotron-3.5-lightning-30b-a3b`, screenshot redaction burned into pixels, IndexedDB persistence, Markdown/JSON export, GitHub confirmation gate, End session, revocation) |
| Hosted Admin Review AR-01..AR-06 | **6/6** desktop; AR-05 also **tablet-834 and mobile-390** pass; no Approve submitted |
| Hosted auth-audit 02 + 03 | 4/5 on the PR Preview; **REC-01** fails there only because DEV Supabase allow-lists the `git-dev` alias for mail redirects (`redirect stays on this Preview`); it **passes 1/1** on the dev alias. RBAC-01 and SEC-01 pass |
| Unit | 63/63 UAT tests; the 7 failures in the full local run were 5 s timeouts under load and pass in isolation; CI is clean |

### Security validation
- Anonymous black-box probe of DEV PostgREST (service role used only to list the schema): **0 of 99 relations readable by anon** (all 401). Of 49 RPCs, anon-executable with empty arguments: `caller_is_teacher` and `current_parent_has_access` (boolean predicates). Functions with required arguments return 404 on an empty call, so this proves read isolation but is **not** a full privilege audit.
- The Supabase advisor findings (nine security-definer views, anon-executable functions) are **not reviewed**: they need the read-only Supabase DEV MCP, whose OAuth is awaiting the owner. No policy was changed.
- Cross-account isolation and negative access: AR-01, AR-04, RBAC-01, SEC-01, P4-2 (including forged `workspace`/`role` query and headers: refused, 403) all pass.
- Revoked fixtures: P4-5 proves a revoked Admin loses `/admin`, the switcher and UAT on the next request. End state: **6 active Admin entitlements** (unchanged from before Phase 4), **0 student Admin entitlements**, no Phase 4/5 fixture holds Admin.
- **Finding for the owner**: 3 of the 6 active entitlements are leftover `RBAC admin rba` fixtures from audit runs on 23-24 Nov, backfilled by the migration (`granted_by: migration:20261126090000`). With `QA Admin`, `E2E Beta Administrator` and `Release Tester` that makes six. They are not from this phase and were not touched. Recommend revoking the three through `revoke_admin_role` after approval.

### Not done / gaps (nothing excluded silently)
- Local `test:rls`, `test:e2e`, `test:e2e:auth`: Docker Desktop is not running and free RAM was 3.9 GB. CI ran all three green on the PR head instead.
- Hosted suites not rerun: `auth-audit/01` and `04` (mail and cross-browser; only the retire helper changed), billing `s1-s4` (Stripe), `a-parent-onboarding`, `b-c-student-assessment`, `d-security`, `m-manual-test-family`. They typecheck; CI covers Student, Parent, Teacher and Admin journeys locally.
- **GitHub issue creation is not ready**: `MM_UAT_GITHUB_TOKEN` is unset (`githubConfigured:false`). The confirmation gate and copy-Markdown fallback are verified; no issue was created.
- Real-mailbox Admin check: the owner login was not used (no credential). Owner state was verified read-only: profile `parent`, one active Admin entitlement, no MFA factors.

### Recommendation
- **GO** to merge PR #168 into `dev` (owner approval needed) and to continue manual UAT on DEV.
- **Not yet GO for beta**: advisor review, the three leftover admin fixtures, GitHub token, and the remaining hosted suites are open. **Production remains NO-GO.**

---

## Final DEV acceptance — post-merge (2026-11-28)

DEV only. Global MFA off. No production change, no account deleted, no credential changed.

### 1. Merge and deployment
- PR #168 merged into `dev` at head `a3f5614b` (merge `7a6cf07a`) after CI was green and mergeable.
- CI on `dev` `7a6cf07a`: both runs **success**. Vercel `dpl_FeL51ZvQBa5kdC1Zj7xuToR3SL3g` READY; the stable alias `mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app` serves `7a6cf07a` (the hosted runner records `dev 7a6cf07a` in every run).

### 2. Fixture remediation
- Confirmed three `RBAC admin rba` Admin entitlements (created 23–24 Nov, backfilled by the migration).
- Revoked through the audited `revoke_admin_role` RPC (actor `owner-approved:phase5-fixture-remediation`); accounts untouched.
- Retained: QA Admin, E2E Beta Administrator, Release Tester. **Exactly three active Admin entitlements verified.**
- Defect found while verifying: `RBAC-01` leaves a fresh Admin fixture entitlement when its worker crashes mid-test (host fault `0xC0000409`). Revoked again with the same RPC; end state three. Register as a test-hygiene defect (D-FIX-1): the crash path must still retire.

### 3. Hosted regression on the stable alias (`7a6cf07a`)
| Suite | Result |
|---|---|
| Auth-audit 01 (registration/verification, real mail.tm inbox) | **pass** REG-01..04 |
| Auth-audit 04 cross-browser resilience | **pass** on chromium, Firefox and WebKit |
| Auth-audit 02 (login, logout, session, **password recovery REC-01**) | **pass** AUTH-01, AUTH-02, REC-01 on the stable alias (REC-01 failed only on the PR preview alias, which Supabase does not allow-list) |
| Auth-audit 03 (RBAC-01 six-role matrix, SEC-01) | **pass** (RBAC-01 passed twice; one run lost to a worker crash, see D-FIX-1) |
| Onboarding A1–A11 (real email) | **pass** |
| Student journeys B1–B8 + C (timed paper, autosave, resume, submit, marks = stored attempt) | **pass** |
| Security D (two-family isolation, anon/parent/student refusals) | **pass** |
| Negative auth N1–N12 | **pass** (4/4) |
| Responsive/a11y E (desktop 1440, tablet 834, mobile 390) | **pass** (9/9) |
| Multi-role + UAT P4-0..P4-6, UAT-H1..H4 (live NVIDIA) | **pass** 11/11 |
| Billing S1–S6, L1, L1b, L2, L3, L4, P1, F1, U1–U4 (Stripe sandbox, real Checkout and real webhooks) | **pass** |
| **Billing W1–W4 (signed-webhook acceptance)** | **BLOCKED, not a pass.** W1's rejection checks (no signature, malformed, wrong secret, tampered body, replayed timestamp) all returned 400 as required; the final "correctly signed event is accepted" assertion got 400, and W2/W3/W4 depend on it. Neither local `whsec` copy (`C:/tmp/stripe-readiness`, `.env.local`) matches the secret deployed to DEV, while real Stripe deliveries (L1 renew/cancel) are accepted, so the deployment is healthy and the test credential is stale. Owner must supply the DEV endpoint signing secret to the test runner, then rerun W1–W4. |
| Manual family seed (`m-manual-test-family`) | **NOT RUN.** Needs the owner's `MANUAL_PARENT_PASSWORD`; I will not invent or reset credentials for the owner's accounts. |

Gaps by design: local `test:rls` / `test:e2e` / `test:e2e:auth` did not run (Docker daemon off); CI ran them green on the PR head.

### 4. Security hardening (separate PR #169, **migration not applied**)
- **Confirmed on DEV with controlled fixtures:** `has_active_access`, `is_student_profile` and `session_has_attempt` return `true` for another family's id to **anon** and to an unrelated parent. Medium severity: one bit per call, random-UUID ids, no row data, no authentication needed.
- PR #169: caller-relationship checks, EXECUTE revoked from PUBLIC and anon, rollback, new RLS isolation tests, registry post-check, review doc `docs/security/DEFINER-HARDENING-2026-11-28.md`.
- Views (9) and definer functions: statically reviewed; the six `admin_*` views are gated by `is_admin()`, the three `visible_*` views carry full ownership predicates; no authenticated-executable function with an id argument lacks a relationship check. Remaining anon-executable helpers read `auth.uid()` and are low (phase 2).
- RLS CI (real Postgres) on PR #169: **41 files, 641 tests pass, including the 12 new isolation tests**. **Not done:** live catalog/advisor read (Supabase DEV MCP needs owner read-only OAuth) and the DEV migration.

### 5. GitHub integration
- Runbook `docs/release/GITHUB-ISSUE-INTEGRATION-RUNBOOK.md`: fine-grained token, one repo, Issues read/write only, 30-day expiry, Vercel Preview + `dev` branch Sensitive variable, kill switch. Nothing configured; `githubConfigured:false`; the Markdown fallback was re-verified by UAT-H3.

### 6. Outstanding defects
| ID | Severity | Item |
|---|---|---|
| SEC-DEF-1 | Medium | anon/cross-account oracle on three definer helpers; fix in PR #169, awaiting approval to apply to DEV |
| TEST-W | Medium (coverage) | W1–W4 webhook-acceptance tests blocked by stale local signing secret |
| D-FIX-1 | Low | RBAC-01 leaves an Admin fixture entitlement after a crash |
| MAN-SEED | Info | manual family seed needs owner password |
| MAIL | Known | Supabase hourly mail cap on the built-in sender; custom SMTP was proven earlier but not re-verified here |
| SEC-ADV | Open | live advisor/catalog review pending owner OAuth |

### 7. Recommendation
- **DEV owner manual testing: GO.** Dev is green, deployed and verified; all journeys, isolation, billing lifecycle and security routes pass.
- **Private beta: NO-GO until three things close** (all small): (1) owner approves and DEV verifies the PR #169 hardening migration (apply, rerun the probe, rerun hosted D + billing S1–S6); (2) W1–W4 rerun green with the correct DEV webhook secret; (3) owner-run read-only catalog/advisor confirmation. Then beta is **GO** from the engineering side; GitHub issue creation stays optional and Markdown fallback is sufficient.
- **Production: NO-GO.** Not assessed here and no change made.
