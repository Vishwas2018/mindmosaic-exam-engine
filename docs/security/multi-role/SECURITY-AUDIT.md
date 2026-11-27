# Multi-role workspaces: security audit, design, migration and rollback

Branch `feat/multi-role-workspace` (DEV only). Draft PR #165, **not merged, not deployed, nothing applied to any database.**
Production Supabase (`uermhsptduikehuyceiz`) was never accessed. The only DEV access was one read-only admin listing
(`scripts/admin/verify-admin-migration.mjs`, preflight).

This document covers the original design **and the review round** (revision 2). Revision 2 closes eight review points; see section 7.

## 1. Audit of the state before this change

| Area | Finding |
|---|---|
| Role model | One role per login: `profiles.role in (student, parent, teacher, admin)`. Admin was a *different kind of account*, so the owner could not be Parent and Admin on one login. |
| Role gate | `requireRole(role)` compared `profiles.role === role`; wrong roles were bounced to `roleHomePath(profileRole)`. A revoked admin whose profile still said `admin` would have looped `/admin` -> `/admin`. |
| RLS | Admin power lived in **four** places keyed on the profile role: `is_admin()` (aggregate views), the `admin_draft_review_*` policies, the **content-factory owner approval** (`owner_approve_content`, `owner_approve_batch`, trigger `enforce_owner_approval_actor`), and the app gate. |
| Promotion | `profiles.role` cannot be written by `authenticated` (column grant is `display_name, year_level` only); signup metadata is clamped by the `on_auth_user_created` trigger. Admin was assigned by hand in SQL with **no audit trail**. |
| Billing / children | `subscriptions`, `parent_children`, `current_parent_has_access()` all key on the parent profile. They must not change. |
| MFA | None. `auth.mfa.totp` was disabled in `supabase/config.toml`. Admin = password only. |
| Admin entry | Admins used the family `/sign-in` page. No dedicated staff entry. |
| Admin Review audit | `admin_draft_review_decisions` (append-only, MM106) and legacy approvals protected by RLS keyed on `profiles.role = 'admin'`. |
| Admin preview bypass | `isAdminPreviewEnabled()` is gated four ways (opt-in env, Supabase unconfigured, not on Vercel, loopback host). Reviewed, unchanged. |

## 2. Design (revision 2)

**`profiles.role` stays the primary role and is unchanged.** Elevated capability is a separate, auditable entitlement.

- `public.user_roles (user_id, role='admin', granted_by, granted_at, revoked_at, revoked_by)`: users can `select` only their own rows; **no insert/update/delete for `authenticated` or `anon`.**
- `public.role_audit_events`: append-only (`MM107`) record of every grant / revoke / regrant / backfill / rollback. No FK to profiles, so history survives erasure. **Kept by the rollback.**
- `public.security_settings.require_admin_mfa` (default **false**). Service-role writable only.
- `grant_admin_role` / `revoke_admin_role`: `SECURITY DEFINER`, **`EXECUTE` for `service_role` only**. Refuse unknown users and **refuse student profiles** (`MM108`).
- **`has_active_admin_role()` is now STRICT**: an unrevoked `user_roles` grant on an account that is not access-revoked. *A profile that merely says `admin` confers nothing.* There is no legacy branch in the database any more.
- **`sync_admin_entitlement_from_profile()` trigger** (after insert / update of `profiles.role`): setting a profile to `admin` writes the grant and an audit row (`trigger:profiles.role:<db role>`); a revoked row is re-granted and audited; moving a profile *away from* `admin` revokes and audits. So the documented manual promotion still works but is never unaudited, and a one-column edit cannot create invisible power.
- **Backfill + abort**: every existing `profiles.role='admin'` gets a grant row (`backfill` audit). A `DO` block then **aborts the migration (`MM109`)** if any admin profile has no entitlement row, so the strict rule cannot strand an existing admin.
- `is_admin()` = `has_active_admin_role() AND admin_mfa_satisfied()`; `admin_mfa_satisfied()` = switch off, **or** JWT `aal = aal2`.
- **Everything administrative calls `is_admin()`**: admin-review policies (decisions read/insert, legacy approvals read/insert), the aggregate views, and now the **content-factory owner approval** (`owner_approve_content`, `owner_approve_batch`, `enforce_owner_approval_actor`). Revoking the entitlement removes all of them at once; the MFA switch applies to all of them. The function bodies are otherwise byte-identical to phase 1 (generated from the real migration, not retyped).

App layer:

- `resolveEntitledRoles(primary, lookup)`: lookup is the grant rows, `"missing"` or `"error"`.
  - rows: **strict**, only an unrevoked grant confers admin (mirrors the database).
  - `"missing"` (Postgres `42P01` or PostgREST `PGRST205` only): the migration is not applied; legacy profile-role rule applies so **deploy order cannot lock admins out**.
  - `"error"` (anything else, including a thrown network error): **fail closed**: no admin even for a profile-admin or a granted parent. Parent/teacher/student workspaces are unaffected by an entitlement-lookup outage.
- `requireRole()`: allows a route only if the role is entitled; redirects the un-entitled to an **entitled** home (no loops). For `admin` on a migrated database it performs the **MFA step-up**; if the MFA switch itself cannot be read (database error) it **fails closed** (admin refused) instead of opening without MFA; an unverifiable assurance level is treated as not verified.
- **Workspace switcher**: plain links, rendered only for 2+ roles, **no authority and no cookie**; each target layout re-runs `requireRole` and the database re-checks `is_admin()`.
- **Staff entry** `/staff/sign-in` (no sign-up, no role picker, generic failure, `next` restricted to `/admin*`) and `/staff/mfa` (TOTP enrol/verify, reachable only by an entitled admin).
- Parent workspace is unaffected by the MFA switch; billing and parent-child code is untouched.

## 3. Requirement coverage (original brief)

| # | Requirement | Where |
|---|---|---|
| 2 | Multiple roles, no data loss | additive tables; `profiles` untouched; PGlite + RLS tests assert parent role, child link and history intact |
| 3 | Admin/Staff entry + switcher | `/staff/sign-in`, `WorkspaceSwitcher` |
| 4 | MFA / step-up | `require_admin_mfa` + `requireRole` + `is_admin()` (defence in depth) |
| 5 | No self-registration / self-promotion | service-role-only grant; no `authenticated` write grants; signup clamp unchanged; students refused |
| 6 | Billing, children, audit history | untouched tables; decisions stay append-only (MM106) |
| 8 | Backward compatibility | backfill + pre-migration `"missing"` fallback + trigger-based promotion |
| 9 | Isolated DEV, migration + rollback | this branch; `supabase/migrations/rollbacks/20261126090000_multi_role_workspaces.down.sql` |

## 4. Migration and rollback plan (updated)

Nothing below has been run. Each DEV step needs the owner's explicit approval.

1. **Review and approve this PR.** Merging code alone changes nothing at runtime: while `user_roles` does not exist the app uses the legacy rule.
2. **Preflight (read-only, DEV):** `node scripts/admin/verify-admin-migration.mjs --env <.env.local>` or block A of `docs/security/multi-role/verify-admin-migration.sql`. Last run: 5 admin profiles on DEV (`mm-qa-admin`, `mmfw-beta-admin`, three `mm-accept-*-rba`), all synthetic, all with two-word display names, none revoked. **There is no real-owner admin on DEV yet** (owner account gets its entitlement in step 5).
3. **Apply** `20261126090000_multi_role_workspaces.sql` on DEV in the SQL editor **as one transaction** (wrap in `begin; ... commit;`), then record it in the ledger (`multi_role_workspaces`). It aborts with `MM109` if any admin would be stranded.
4. **Postflight (read-only):** run the verify script again (blocks B-D in the SQL file): expect `RESULT: OK`, 0 admins without an active grant, backfill audit rows = admin count, 0 student entitlements, subscriptions/children/decision counts unchanged.
5. **Owner grant:** `node scripts/admin/manage-admin-role.mjs --env <.env.local> --email <owner> --reason "<why>"` (dry run), then `--apply`. The owner's display name must be the real two-word name.
6. Sign in at `/staff/sign-in`, **enrol the authenticator at `/staff/mfa` first**, confirm an aal2 session reaches `/admin/review`.
7. **Only then** `update public.security_settings set bool_value = true where key = 'require_admin_mfa';` (platform-wide: every admin, including the synthetic ones, must enrol or will be refused).
8. **Rollback** (`supabase/migrations/rollbacks/20261126090000_multi_role_workspaces.down.sql`, transactional):
   - **keeps** `role_audit_events` (and its immutability triggers); first writes one `rollback` snapshot row per entitlement (ACTIVE or REVOKED, with timestamp);
   - restores the original policies, `is_admin()` and the content-factory functions (profile-role rule);
   - demotes any **revoked** admin whose profile still says `admin` to `parent` (audited) so the old policies cannot resurrect them;
   - drops `user_roles`, `security_settings`, the sync trigger and helper functions;
   - dual-role users (parent profile + active grant) lose admin by design; decision/approval history, parent links and billing are untouched;
   - re-applying the migration afterwards is supported (it adopts the kept audit table).
9. **Production:** not part of this PR. Needs a separate owner-approved release.

## 5. Evidence (revision 2)

| Check | Result |
|---|---|
| PGlite suite 1 (`t1.mjs`): real 20261019 + 20261124 admin-review migrations, new migration and rollback | **53/53** (unchanged, still passes against the hardened migration) |
| PGlite suite 2 (`t2.mjs`): review-round regressions against the real content-factory function bodies | **51/51**: pre-migration compatibility; backfill completeness (3 admins); strict profile-only admin refused (DB + content factory + history); promotion by profile edit auto-grants **with audit** (update and insert); demotion revokes; regrant audited; 6 privilege-escalation attempts refused; content factory: dual passes, aal1 refused under MFA, aal2 passes, direct insert refused by actor trigger; **revocation removes all 7 capabilities** for an admin-only profile (history read, legacy approvals read/insert, decision insert, content approval, `is_admin`, `has_active`), account revocation too; re-saving the same role does not resurrect; rollback keeps audit rows verbatim + snapshots, audit still immutable, revoked admin not resurrected, original admins still work, content factory restored; **re-apply after rollback** works |
| Mutation check | Reverting content factory to `profiles.role` fails 4 checks; disabling the sync trigger fails 4 checks: the tests are not vacuous |
| Unit/component | `resolveEntitledRoles` (strict, `"missing"`, `"error"`), `requireRole` (fail-closed on lookup error for 5 error codes, on thrown lookup, on unreadable MFA switch, unverifiable AAL; pre-migration never stepped up; parents unaffected by an entitlement outage) |
| Real-Postgres RLS (`tests/rls/multi-role-workspaces.test.ts`, CI `rls`) | extended: audited promotion, strict, demotion/regrant, content-factory gate (parent/dual/aal1/aal2/revoked), forged audit insert refused, trigger function not callable, **rollback applied inside the test** (audit preserved, snapshot rows, revoked admin demoted) |
| Browser E2E (`e2e/auth/multi-role-workspaces.spec.ts`, CI `e2e-auth`) | unchanged 7 scenarios; the fixture admin is now promoted through the trigger, so the e2e also proves the audited path end to end |
| DEV preflight (read-only) | 5 admin profiles, all backfillable |

CI on the final head is recorded in the PR (section 6 of the PR description).

### Defects found while building (all fixed, assertions not weakened)
Original round: erasure-graph classification of `user_roles.user_id`; `/parent/setup` URL in e2e; lost deep link through the MFA redirect (now a proxy header).
Review round:
1. `String.replace` silently turned `$$` into `$` while injecting the content-factory block; caught immediately by the PGlite run (not by review).
2. Layout unit mocks modelled a migrated admin without a grant row; fixed to model reality (an admin profile now carries a grant).

## 6. Residual risks

1. **First TOTP factor can be enrolled at aal1.** Anyone holding the password could enrol their own authenticator *if the legitimate admin has not enrolled yet*. Mitigation: enrol first, then flip the switch (steps 6-7). Supabase protects *additional* factors with aal2. WebAuthn would be stronger.
2. **Profile-role promotion still works for the service role / DB owner** (documented manual path), but it is now audited and produces an entitlement; the legacy *unaudited* path is gone. Recommended follow-up: forbid it entirely and require `grant_admin_role`.
3. **MFA switch is global**, not per user. Turning it on requires every admin to enrol.
4. **Revoked JWT lifetime**: a revoked grant is enforced by the page gate on the very next request and by RLS/`is_admin()` on every query (including content-factory approval), but an already-issued access token stays cryptographically valid until expiry, and non-DB endpoints that trust the JWT alone would not see the revocation (none exist for admin today). Same residual as ADR-012 section 5.
5. **Rollback demotes revoked admin-profiles to `parent`.** Deliberate (otherwise the old policies would resurrect them); audited; the owner may prefer another role.
6. **Trigger-created grants carry the DB role as actor** (`trigger:profiles.role:postgres`), not a human name. The reason column says what happened; use `manage-admin-role.mjs` for a named actor.
7. **Browser coverage**: Chromium only; Firefox/Safari/real devices manual.
8. **Content-factory approval is now usable by dual-role admins** (intended). It is still not used by Admin Review.

## 7. Review round (revision 2) traceability

| Review point | Resolution |
|---|---|
| 1. All admin capabilities require entitlement + MFA | content-factory approvals moved to `is_admin()` (functions + actor trigger); every other capability already used it; tests at DB, RLS and PGlite level |
| 2. Revoking removes every privilege | strict `has_active_admin_role()`; 7-capability matrix before/after revoke; admin-only profile case; account revocation; no resurrection by re-saving a profile |
| 3. No unaudited legacy promotion post-backfill | database legacy branch removed; sync trigger writes grant + audit; app legacy rule only when the table does not exist |
| 4. Fail closed on unexpected errors | `AdminGrantLookup` (`missing` vs `error`); MFA-switch read failure denies; thrown errors deny; parents unaffected |
| 5. Rollback preserves audit | `role_audit_events` kept + snapshots; tested in PGlite and real Postgres; re-apply tested |
| 6. Existing admins safely migrated | backfill + `MM109` abort; preflight/postflight script and SQL; DEV preflight result recorded |
| 7. Regression tests | sections 5; escalation, revocation, MFA, legacy compatibility, rollback all covered |
| 8. CI on latest head | see PR |
