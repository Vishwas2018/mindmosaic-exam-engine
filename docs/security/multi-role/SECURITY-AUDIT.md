# Multi-role workspaces: security audit, design, migration and rollback

Branch `feat/multi-role-workspace` (DEV only). Draft PR, **not merged, not deployed, nothing applied to any database.**
Production Supabase (`uermhsptduikehuyceiz`) was never accessed.

## 1. Audit of the current state (before this change)

| Area | Finding |
|---|---|
| Role model | One role per login: `profiles.role in (student, parent, teacher, admin)`. Admin was a *different kind of account*, so the owner could not be Parent and Admin on one login. |
| Role gate | `requireRole(role)` (`src/features/auth/require-role.ts`) compared `profiles.role === role`; wrong roles were bounced to `roleHomePath(profileRole)`. A revoked admin whose profile still said `admin` would have looped `/admin` -> `/admin`. |
| RLS | Admin power lived in 3 places: `is_admin()` (aggregate views), `admin_draft_review_*` policies (`p.role = 'admin'`), and the content-factory owner-approval functions (`profiles.role`). All keyed on the single profile role. |
| Promotion | `profiles.role` cannot be written by `authenticated` (column grant is `display_name, year_level` only); signup metadata is clamped by the `on_auth_user_created` trigger. Admin is assigned by hand in SQL. No audit trail of who became admin. |
| Billing / children | `subscriptions`, `parent_children`, `current_parent_has_access()` all key on the parent profile. They must not change. |
| MFA | None. `auth.mfa.totp` was disabled in `supabase/config.toml`. Admin = password only. |
| Admin entry | Admins used the family `/sign-in` page. No dedicated staff entry. |
| Admin Review audit | `admin_draft_review_decisions` (append-only, MM106) and legacy `admin_draft_review_approvals` are protected by RLS keyed on `profiles.role = 'admin'`. |
| Admin preview bypass | `isAdminPreviewEnabled()` is gated four ways (opt-in env, Supabase unconfigured, not on Vercel, loopback host). Reviewed, unchanged. |

## 2. Design

**`profiles.role` stays the primary role and is unchanged.** Elevated capability is a separate, auditable entitlement.

- `public.user_roles (user_id, role='admin', granted_by, granted_at, revoked_at, revoked_by)`: users can `select` only their own rows; **no insert/update/delete for `authenticated` or `anon`.**
- `public.role_audit_events`: append-only (`MM107`) record of every grant / revoke / regrant / backfill. No FK to profiles, so history survives erasure.
- `public.security_settings.require_admin_mfa` (default **false**). Service-role writable only.
- `grant_admin_role` / `revoke_admin_role`: `SECURITY DEFINER`, **`EXECUTE` for `service_role` only**. Refuse unknown users and **refuse student profiles** (`MM108`).
- `has_active_admin_role()` = unrevoked grant, **or** legacy path (`profiles.role = 'admin'` and no grant row has ever existed for that user). A revoked row always wins. Account revocation (`profiles.access_revoked_at`) disables it as before.
- `is_admin()` = `has_active_admin_role() AND admin_mfa_satisfied()`; `admin_mfa_satisfied()` = switch off, **or** JWT `aal = aal2`.
- Admin review RLS (decisions read/insert, legacy approvals read/insert) now call `is_admin()`. The display-name / email identity checks on decision inserts are unchanged.
- Backfill: every existing `profiles.role = 'admin'` gets a grant row (audited as `backfill`).

App layer:

- `requireRole()` resolves *entitled roles* (`resolveEntitledRoles`), allows a route only if the role is entitled, redirects the un-entitled to an **entitled** home (no loops), and for `admin` performs the **MFA step-up** (`/staff/mfa`) when the switch is on. If `user_roles` is missing (database not yet migrated) it falls back to the legacy behaviour, so deploy order cannot lock admins out.
- **Workspace switcher** (`WorkspaceSwitcher`): plain links, rendered only for logins with 2+ roles. It carries **no authority**: each target layout re-runs `requireRole`, and the database re-checks `is_admin()`. There is deliberately **no workspace cookie**; the URL is the active workspace, so there is no client state to tamper with.
- **Staff entry** `/staff/sign-in`: same Supabase login, no sign-up, no role picker, no "request access", generic failure text, `next` restricted to `/admin*`.
- **MFA** `/staff/mfa`: Supabase TOTP enrol/verify; reachable only by an entitled admin; `next` restricted to `/admin*`.
- Parent workspace is unaffected by the switch (no step-up), billing/subscription checks run exactly as before.

### Deliberately not changed (fail-closed)
The content-factory `owner_approve_content` / `owner_approve_batch` functions and `enforce_owner_approval_actor` still read `profiles.role = 'admin'`. A *dual-role* user (profile `parent`) therefore **cannot** use them. Not used by the Admin Review portal. Follow-up PR if needed.

## 3. Requirement coverage

| # | Requirement | Where |
|---|---|---|
| 2 | Multiple roles, no data loss | additive tables; `profiles` untouched; backfill; PGlite + RLS tests assert parent role, child link and history intact |
| 3 | Admin/Staff entry + switcher | `/staff/sign-in`, `WorkspaceSwitcher` |
| 4 | MFA / step-up | `require_admin_mfa` + `requireRole` + `is_admin()` (defence in depth) |
| 5 | No self-registration / self-promotion | service-role-only grant; no `authenticated` write grants; signup clamp unchanged; students refused |
| 6 | Billing, children, audit history | untouched tables; decisions stay append-only (MM106) |
| 7 | Tests | section 5 |
| 8 | Backward compatibility | backfill + legacy path + pre-migration fallback |
| 9 | Isolated DEV, migration + rollback | this branch; `supabase/migrations/rollbacks/20261126090000_multi_role_workspaces.down.sql` |

## 4. Migration and rollback plan

1. Review this PR. Nothing is applied by merging code alone: the app falls back to legacy behaviour until the migration exists.
2. **DEV only, with owner approval:** apply `20261126090000_multi_role_workspaces.sql` (SQL editor, as for PR #162), then record it in the ledger (`scripts/migrations`, entry `multi_role_workspaces`).
3. Grant the owner's admin entitlement: service role only, `select public.grant_admin_role('<owner uuid>', 'owner', 'dual role for owner');`
4. Sign in via `/staff/sign-in`, complete `/staff/mfa` **enrolment first**, verify an aal2 session reaches `/admin/review`.
5. Only then turn the platform switch on: `update public.security_settings set bool_value = true where key = 'require_admin_mfa';`
6. **Rollback:** `supabase/migrations/rollbacks/20261126090000_multi_role_workspaces.down.sql` (transactional). Restores the original policies and `is_admin()`; dual-role users lose admin (existing admins unaffected); decision/approval history untouched; the role audit table is dropped, so export it first if it must be kept. The app keeps working after rollback because it falls back to legacy when `user_roles` is absent.
7. **Production:** not part of this PR. Needs a separate owner-approved release.

## 5. Evidence

| Check | Result |
|---|---|
| Migration + rollback against a stubbed Postgres (PGlite, applying the real 20261019 + 20261124 admin-review migrations first) | **53/53 pass** (backfill, history preserved, legacy manual admin, parent-only no power, 7 self-promotion/escalation attempts refused, student refused, dual-role grant, impersonation refused, MFA aal1/aal2, revocation, account revocation, regrant, audit append-only, decisions immutable, rollback keeps history). Script: `C:\tmp\multirole-pglite\t1.mjs`. |
| `tsc --noEmit`, eslint | clean |
| Unit/component (`multi-role-entitlements.test.tsx`, proxy CSP tests) | pass |
| Real-Postgres RLS test (`tests/rls/multi-role-workspaces.test.ts`) and browser E2E (`e2e/auth/multi-role-workspaces.spec.ts`: switcher, single-role, direct URL, staff sign-in, escalation, MFA step-up with real TOTP, revocation) | **run in CI only** (needs the local Supabase stack; Docker is not available on the authoring machine). See the PR for the CI result. |

## 6. Findings and residual risks

1. **First TOTP factor can be enrolled at aal1.** An attacker who already holds the password could enrol their own authenticator *if the legitimate admin has not enrolled yet*. Mitigation: enrol first, then flip the switch (step 4-5). Supabase protects *additional* factors with aal2. A hardware key (WebAuthn) would be stronger.
2. **Legacy path remains.** Manual `update profiles set role = 'admin'` still grants admin without an audit row (service role/DB owner only; authenticated users cannot write that column). Recommended follow-up: remove the legacy path once all admins have grant rows.
3. **MFA switch is global**, not per user. Turning it on requires every admin (including legacy ones) to enrol.
4. **Content-factory owner approvals** not multi-role aware (fail-closed, see above).
5. **Access-token lifetime**: a revoked grant is enforced by the page gate on the very next request and by RLS on every query, but an already-issued JWT remains cryptographically valid until expiry (same residual risk as ADR-012 section 5).
6. **Browser coverage**: Chromium only; Firefox/Safari/real devices manual.
7. The `admin_draft_review_decisions` legacy fallback means DEV accounts promoted before this migration keep working without action.
