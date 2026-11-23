# MindMosaic Authentication Security Assessment (2026-11-23)

- **Scope:** Hosted DEV Preview (`https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app`, SHA `db65f78c`) and DEV Supabase (`mfglzabnayacssgertat`).
- **Safety Boundary:** All security tests were bounded, non-disruptive, synthetic-data-only checks against DEV. Production (`uermhsptduikehuyceiz`) was never touched.

---

## 1. Control-by-Control Security Verification

| Control Area | Test Case(s) | Status | Verified Evidence |
|---|---|---|---|
| **Session Cookie Attributes** | `SEC-01` | **PASS (Post-fix `DEF-AUTH-004`)** | `sb-mfglzabnayacssgertat-auth-token` now carries `secure: true`, `sameSite: "Lax"`, `path: "/"`. `httpOnly: false` is an architectural requirement of `@supabase/ssr` browser clients and is documented as a known trade-off mitigated by strict CSP & XSS controls. |
| **Content Security Policy (CSP)** | `SEC-01`, `src/proxy.ts` | **PASS (Observed)** | Nonce-based CSP headers are emitted on `/sign-in`, `/auth/confirm`, `/auth/forgot`, `/auth/reset`. Enforced (`Content-Security-Policy`) when `MM_DEV_AUTH_CSP_ENFORCE=1` (as on PR #156 preview); `Content-Security-Policy-Report-Only` when unset (as on default preview `audit/auth-e2e-20261123`). |
| **CSRF / Same-Origin Enforcement** | `SEC-01`, `singapore-maths-sample-routes.test.ts` | **PASS (Post-fix `DEF-AUTH-002`)** | All active state-changing routes (`/api/parent/children`, `/api/student/onboarding/preferences`, `/api/teacher/assignments`, `/api/exam/session`, `/api/practice/singapore-maths/sample/{submit,reveal,session}`) reject both `Origin: https://evil.example` and missing `Origin` with HTTP `403`. |
| **Open Redirect Prevention** | `SEC-01`, `auth-safe-next.test.ts` | **PASS** | `https://evil.example`, `//evil.example`, `/\evil.example`, and `javascript:alert(1)` passed via `/sign-in?next=` were all rejected by `safeNextPath()` and redirected safely to `/parent` on the same origin. |
| **JWT Integrity & Tampering** | `SEC-01` | **PASS** | Mutating the signature segment of a valid session JWT produced HTTP `401` on DEV PostgREST (`/rest/v1/profiles`). |
| **Privilege Escalation (DB & Signup)** | `SEC-01`, `tests/rls/privilege-hardening.test.ts` | **PASS** | 1) Direct PostgREST `PATCH /rest/v1/profiles?id=eq.<self>` with `{ "role": "admin" }` returned HTTP `403` and left `role = "parent"`. 2) Direct `POST /auth/v1/signup` with `data: { role: "admin" }` was clamped by the `on_auth_user_created` DB trigger to `student` (never `admin` or `teacher`). |
| **Role-Based Access Control (UI & API)** | `RBAC-01`, `auth-audit-hardening.test.ts` | **PASS (Post-fix `DEF-AUTH-001`, `003`)** | 114/114 UI route cells and 60/60 API authorisation cells passed across all 6 roles (Anonymous, Guest, Student, Parent, Teacher, Admin). |
| **Cross-Family Data Isolation (RLS + API)** | `RBAC-01`, `d-security-isolation.spec.ts`, CI `rls` | **PASS** | Parent B and Student B cannot read, rename, archive, or submit valid synthetic Family A child/session/attempt records via UI, Next.js API routes, or direct PostgREST queries. CI `rls` job passed in 1m55s. |
| **Account Enumeration Prevention** | `AUTH-01`, `REG-02`, `N9`, `N10` | **PASS** | Sign-in returns identical generic copy for unknown emails vs wrong passwords. Sign-up returns "Check your email" (or generic rate-limit) for duplicate accounts. Student sign-in returns identical generic copy for unknown codes, wrong PINs, and paused/archived children. |
| **Brute-Force & Lockout Controls** | `AUTH-01` | **PASS** | 5 consecutive failed sign-in attempts trigger a 30s client lockout (`Try again in Xs`) backed by Supabase GoTrue server-side rate limiting. |
| **Session Invalidation on Password Reset** | `REC-01` | **PASS** | Changing password via `/auth/reset` calls `signOut({ scope: "others" })`; verified live (`rmwsuwdnl`) that a second active browser session was immediately redirected to `/session-expired?next=%2Fparent`. |
| **Archived / Revoked Account Enforcement** | `AUTH-02`, `supabase-archived-session.test.ts` | **PASS** | Archiving a child immediately invalidates their existing session via `denyArchivedSessions()` (`app_metadata.archived === true`). Setting `profiles.access_revoked_at` blocks access at `requireRole()` and signs out the session. |
| **Sensitive Data & Key Leakage** | `SEC-01`, `REG-01` | **PASS** | Zero password persistence in `sessionStorage` draft (`mm-signup-draft`) or `localStorage`; zero `SUPABASE_SERVICE_ROLE_KEY` exposure in rendered HTML or client bundles. |

---

## 2. Residual Risks & Architectural Notes

1. **`httpOnly: false` on `sb-*-auth-token` (Known `@supabase/ssr` Constraint):** Required because client components (`AuthProvider`) read session tokens via `@supabase/ssr`. Mitigated by `Secure` (now enforced via `DEF-AUTH-004`), `SameSite=Lax`, and nonce-based CSP. Recommendation: enable `MM_DEV_AUTH_CSP_ENFORCE=1` on all Preview and Production environments once CSP telemetry confirms zero false positives.
2. **Access-Token Remaining Lifetime on `access_revoked_at` (Documented in ADR-012 §5):** `requireRole()` checks `profiles.access_revoked_at` on every `/{role}` page render, while `request_student_erasure` bans the GoTrue user and deletes `auth.sessions`. Individual API routes rely on `auth.getUser()` + `denyArchivedSessions()` and do not separately re-query `access_revoked_at`.
3. **Preview Branch Redirect URLs (`DEF-AUTH-005`):** Until the wildcard `https://mindmosaic-exam-engine-*-vishwas2018s-projects.vercel.app/**` is added to DEV Supabase Auth Redirect URLs, email links generated from non-allowlisted feature branches fall back to `site_url` (`git-dev`).
