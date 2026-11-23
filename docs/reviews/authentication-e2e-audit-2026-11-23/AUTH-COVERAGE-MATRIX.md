# MindMosaic Authentication Coverage Matrix (2026-11-23)

- **Audit Branch:** `audit/auth-e2e-20261123` (branched from PR #156 `integration/beta-readiness-claude-20261120` @ `3253ab1e`)
- **Final Code SHA:** `db65f78c62d96ee7a9c7774a31d5b2accd47a12e`
- **Hosted DEV Preview Alias:** `https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app` (`dpl_CyLHacwwUYPfjdT63F523W3iL4Jp`)
- **Supabase Environment:** DEV `mfglzabnayacssgertat` exclusively (Production `uermhsptduikehuyceiz` never touched)

---

## 1. Authentication Feature Inventory & Classification

| Area | Feature / Scenario | Support Status | Automated Test Coverage | Verification Evidence |
|---|---|---|---|---|
| **Registration** | Parent self-service sign-up (`/sign-up`) | **Supported** (`PUBLIC_SIGNUP_ENABLED = true`) | `REG-01`, `REG-02`, `REG-03`, `REG-04`, `A0` | Executed & verified on DEV Preview |
| Registration | Student provisioning (parent-issued login code + 6-digit PIN) | **Supported** (parent-only via `/api/parent/children`, never self-service) | `AUTH-02`, `RBAC-01`, `XBR-01`, `provision-child.test.ts` | Executed & verified |
| Registration | Teacher self-service registration | **Intentionally Unsupported** (DB-assigned role only; `roles.ts` D1) | `SEC-01` (verifies direct signup with `role: "admin"`/`"teacher"` cannot elevate) | Verified refused / clamped by DB trigger |
| Registration | Administrator self-service registration | **Intentionally Unsupported** (DB-assigned role only) | `SEC-01` | Verified refused / clamped by DB trigger |
| Registration | Missing mandatory fields, invalid email, unchecked consent | **Supported** | `REG-01` | Passed |
| Registration | Password boundary rules (8+ chars, upper, lower, number, special) | **Supported** | `REG-01`, `auth-password.test.ts` | Passed |
| Registration | Double-click submit guard | **Supported** | `REG-02` | Passed |
| Registration | Browser refresh during registration (`sessionStorage` draft; password excluded) | **Supported** | `REG-01` | Passed (confirmed password absent from `sessionStorage`) |
| Registration | Duplicate registration (existing unverified & verified accounts) | **Supported** (no account enumeration) | `REG-02` | Passed on PR #156 alias; rate-limit / generic response verified |
| Registration | Simultaneous registrations across parallel contexts | **Supported** | `REG-04` | Tested (blocked by `DEF-AUTH-005` on non-allowlisted branch alias) |
| **Email Verification** | Real Gmail SMTP delivery (`vishwas.joshi01@gmail.com`) via `mail.tm` | **Supported** | `REG-02`, `REG-03`, `REG-04`, `REC-01` | Verified real delivery (latency 0–6s first attempt) |
| Email Verification | Tampered, invalid, and spent confirmation links | **Supported** | `REG-02`, `N1-N4`, `email-verification-screen.test.tsx` | Passed |
| Email Verification | Cross-device confirmation (PKCE same-device guidance + server-side confirm) | **Supported** | `REG-03`, `N12` | Passed (`REG-03` confirmed server-side while logged in as another user) |
| Email Verification | Empty `/auth/confirm` with no link | **Supported** | `N11` | Passed |
| Email Verification | Email resend & 30s client cooldown | **Supported** | `EmailConfirmationPending`, `SignInPanel`, unit tests | Verified in code & unit tests |
| Email Verification | Older vs latest verification link invalidation | **Managed by Supabase GoTrue** | Not independently re-tested due to 60s SMTP cooldown & `DEF-AUTH-005` | Documented gap |
| **Login & Logout** | Parent email + password sign-in (`/sign-in?role=parent`) | **Supported** | `AUTH-01`, `AUTH-02`, `RBAC-01`, `XBR-01` | Passed |
| Login & Logout | Student login code + 6-digit PIN (`/student-sign-in`, `/sign-in?role=student`) | **Supported** | `AUTH-02`, `RBAC-01`, `XBR-01`, `sign-in-panel.test.tsx` | Passed |
| Login & Logout | Teacher & Admin sign-in & role-home routing (`/teacher`, `/admin`) | **Supported** | `AUTH-02`, `RBAC-01` | Passed |
| Login & Logout | OAuth / Social login (`google`, `apple`, `azure`, `facebook`) | **Conditionally Supported** (disabled in DEV; `configuredOAuthProviders() === []`) | `/auth/callback` unit/code audit | Classified as unconfigured in DEV |
| Login & Logout | Account enumeration prevention (known vs unknown, wrong PW vs unverified) | **Supported** | `AUTH-01`, `REG-02`, `N9` | Passed |
| Login & Logout | Rapid repeated failed attempts (5-attempt client lockout + server rate limit) | **Supported** | `AUTH-01`, `sign-in-panel.test.tsx` | Passed |
| Login & Logout | "Keep me signed in" unchecked (ephemeral session discarded on reopen) | **Supported** | `AUTH-02`, `sign-in-panel.test.tsx` | Passed |
| Login & Logout | Logout via `ParentAccountMenu` -> `/signed-out` + Back/revisit protection | **Supported** | `AUTH-02`, `XBR-01` | Passed across Chromium, Firefox, WebKit |
| Login & Logout | Multi-tab logout propagation | **Supported** | `AUTH-02` | Passed |
| Login & Logout | Archived/paused student refused with generic message; restore re-enables | **Supported** | `AUTH-02`, `supabase-archived-session.test.ts` | Passed |
| Login & Logout | Revoked account (`profiles.access_revoked_at`) blocked at `requireRole` | **Supported** | `AUTH-02`, `require-role.test.ts` | Passed |
| **Password Recovery** | Forgot-password via `/sign-in?mode=forgot` and `/auth/forgot` | **Supported** | `REC-01`, `N5-N10` | Verified on PR #156 alias (`rmwsuwdnl`); branch alias subject to `DEF-AUTH-005` |
| Password Recovery | Active-session guard on `/auth/reset` (`not_recovery`) | **Supported** | `REC-01`, `N11` | Passed |
| Password Recovery | Cross-device session invalidation after password change (`signOut({ scope: "others" })`) | **Supported** | `REC-01` | Passed (`rmwsuwdnl`: Device B redirected to `/session-expired?next=%2Fparent`) |
| Password Recovery | Weak & mismatched new passwords refused; old password refused after reset | **Supported** | `REC-01`, `N6`, `N7` | Passed |

---

## 2. Complete 6-Role × 19-Route Access Matrix (Verified Live on SHA `288fafcd` / `db65f78c`)

| Route | Anonymous | Guest | Student | Parent | Teacher | Admin |
|---|---|---|---|---|---|---|
| `/` | Allow (`/`) | Allow (`/`) | Allow (`/`) | Allow (`/`) | Allow (`/`) | Allow (`/`) |
| `/practice` | Allow | Allow | Allow | Allow | Allow | Allow |
| `/pricing` | Allow | Allow | Allow | Allow | Allow | Allow |
| `/sign-in` | Allow | Allow | Allow | Allow | Allow | Allow |
| `/sign-up` | Allow | Allow | Allow | Allow | Allow | Allow |
| `/student-sign-in` | Allow | Allow | Allow | Allow | Allow | Allow |
| `/auth/forgot` | Allow | Allow | Allow | Allow | Allow | Allow |
| `/student` | Redirect `/sign-in` | Redirect `/sign-in` | **Allow** | Redirect `/parent` | Redirect `/teacher` | Redirect `/admin` |
| `/student/practice` | Redirect `/sign-in` | Redirect `/sign-in` | **Allow** | Redirect `/parent` | Redirect `/teacher` | Redirect `/admin` |
| `/parent` | Redirect `/sign-in` | Redirect `/sign-in` | Redirect `/student` | **Allow** | Redirect `/teacher` | Redirect `/admin` |
| `/parent/setup` | Redirect `/sign-in` | Redirect `/sign-in` | Redirect `/student` | **Allow** | Redirect `/teacher` | Redirect `/admin` |
| `/parent/children` | Redirect `/sign-in` | Redirect `/sign-in` | Redirect `/student` | **Allow** | Redirect `/teacher` | Redirect `/admin` |
| `/parent/account` | Redirect `/sign-in` | Redirect `/sign-in` | Redirect `/student` | **Allow** | Redirect `/teacher` | Redirect `/admin` |
| `/teacher` | Redirect `/sign-in` | Redirect `/sign-in` | Redirect `/student` | Redirect `/parent` | **Allow** | Redirect `/admin` |
| `/teacher/assignments` | Redirect `/sign-in` | Redirect `/sign-in` | Redirect `/student` | Redirect `/parent` | **Allow** | Redirect `/admin` |
| `/teacher/marking` | Redirect `/sign-in` | Redirect `/sign-in` | Redirect `/student` | Redirect `/parent` | **Allow** | Redirect `/admin` |
| `/admin` | Redirect `/sign-in` | Redirect `/sign-in` | Redirect `/student` | Redirect `/parent` | Redirect `/teacher` | **Allow** |
| `/admin/review` | Redirect `/sign-in` | Redirect `/sign-in` | Redirect `/student` | Redirect `/parent` | Redirect `/teacher` | **Allow** |
| `/admin/operations` | Redirect `/sign-in` | Redirect `/sign-in` | Redirect `/student` | Redirect `/parent` | Redirect `/teacher` | **Allow** |

**Result:** **114 / 114 cells verified PASS.**

---

## 3. Complete 6-Role × 10-API Authorisation Matrix (Post-Remediation, Verified Live on SHA `288fafcd` / `db65f78c`)

All cross-family tests used a **valid synthetic Family A child UUID (`childA.childId`)**, never a nonexistent UUID.

| Endpoint | Anonymous | Guest | Student (Family B) | Parent (Family B) | Teacher | Admin |
|---|---|---|---|---|---|---|
| `GET /api/parent/children/[childA]` | `401` | `401` | `403` | `404` (RLS/link denied) | `403` | `403` |
| `PATCH /api/parent/children/[childA]` | `401` | `401` | `403` | `404` (RLS/link denied) | `403` | `403` |
| `POST /api/parent/children` | `401` (was `400` pre-fix) | `401` (was `400`) | `403` (was `400`) | `200` (own child) | `403` | `403` |
| `POST /api/teacher/assignments` | `401` | `401` | `403` | `403` | `400` (empty body validation; role allowed) | `403` |
| `POST /api/teacher/marking` | `401` | `401` | `403` | `403` | `400` (empty body validation; role allowed) | `403` |
| `POST /api/student/onboarding/complete` | `401` | `401` | `200` | `403` | `403` | `403` |
| `POST /api/student/onboarding/preferences` | `401` | `401` | `200` | `403` (was `200` pre-fix!) | `403` (was `200`) | `403` (was `200`) |
| `GET /api/student/onboarding/questions?year=5` | `401` | `401` | `200` | `403` (was `200` pre-fix!) | `403` (was `200`) | `403` (was `200`) |
| `POST /api/stripe/checkout` | `503` (Stripe off) | `503` | `503` | `503` | `503` | `503` |
| `GET /api/exam/session/active` | `401` | `401` | `404` (no active) | `404` | `404` | `404` |

**Result:** **60 / 60 API authorisation cells verified PASS after Round 5 remediation.**
