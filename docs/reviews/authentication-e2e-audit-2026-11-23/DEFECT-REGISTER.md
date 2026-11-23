# MindMosaic Authentication Defect Register (2026-11-23)

All defects below were discovered via static security review and live hosted DEV Preview E2E testing against `mfglzabnayacssgertat`.

---

## Summary Table

| Defect ID | Category | Severity | Affected Role / Feature | Status | Fix Commit |
|---|---|---|---|---|---|
| `DEF-AUTH-004` | Application (Security) | **High** | All authenticated roles — Session cookie (`sb-*-auth-token`) missing `Secure` flag on HTTPS | **Fixed & Verified** | `288fafcd` |
| `DEF-AUTH-001` | Application (AuthZ) | **Medium** | Parent / Teacher / Admin — Missing `student` role gate on `/api/student/onboarding/preferences` & `/questions` | **Fixed & Verified** | `288fafcd` |
| `DEF-AUTH-002` | Application (CSRF) | **Medium** | Allowlisted preview users — Missing `checkOrigin` CSRF guard on Singapore Maths sample state-changing routes | **Fixed & Verified** | `288fafcd` |
| `DEF-AUTH-003` | Application (API Auth) | **Low** | Anonymous / Guest / Student / Teacher / Admin — `POST /api/parent/children` returned `400` instead of `401`/`403` | **Fixed & Verified** | `288fafcd` |
| `DEF-AUTH-005` | Infrastructure (Supabase DEV Auth) | **Medium** | Preview branch real-email confirmation & password recovery redirects | **Open (Env Config — Owner Action)** | N/A (Supabase Dashboard) |
| `DEF-AUTH-006` | Application (UX / Consistency) | **Low** | Parent — Standalone `/auth/forgot` lacks client-side email validation & 30s resend cooldown present in `/sign-in?mode=forgot`; duplicate `/auth/session-expired` vs `/session-expired` | **Documented (Non-blocking)** | Deferred |

---

## Detailed Defect Records

### `DEF-AUTH-004` — Supabase Auth Session Cookie Missing `Secure` Attribute on HTTPS
- **Severity:** High (Session Security / Transport Protection)
- **Category:** Application Defect
- **Affected Role / Feature:** All signed-in roles (Student, Parent, Teacher, Admin) on HTTPS deployments.
- **Reproduction Steps:**
  1. Sign in as a parent on HTTPS DEV Preview (`https://mindmosaic-exam-engine-git-integra-6b98ba-vishwas2018s-projects.vercel.app`).
  2. Inspect browser cookies via `context.cookies()` for `sb-mfglzabnayacssgertat-auth-token`.
- **Expected Result:** `secure: true`, `sameSite: "Lax"`.
- **Actual Result (Pre-fix, run `rmwsv4lml`):** `secure: false`, `httpOnly: false`, `sameSite: "Lax"`. Because `@supabase/ssr` requires `httpOnly: false` for the browser client, omitting `Secure` exposed the full access/refresh token cookie to transmission over any plain-HTTP request on the domain.
- **Root Cause Analysis:** `src/lib/supabase/client.ts` called `createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)` without `cookieOptions.secure`, and `src/lib/supabase/server.ts` / `src/lib/supabase/middleware.ts` forwarded `@supabase/ssr` cookie options without enforcing `secure: true` on HTTPS / Vercel deployments.
- **Fix Commit:** `288fafcd` (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`).
- **Automated Test Evidence:** `SEC-01` in `e2e/hosted/auth-audit/03-rbac-isolation-security.spec.ts` (runs `rmwsvvayc` & `rmwswgel9`).
- **Retest Result:** **PASS** — `sb-mfglzabnayacssgertat-auth-token` now carries `secure: true, sameSite: "Lax", path: "/"` on HTTPS Preview, while local HTTP CI (`e2e-auth`) remains 100% green.

---

### `DEF-AUTH-001` — Missing `student` Role Gate on `/api/student/onboarding/preferences` and `/api/student/onboarding/questions`
- **Severity:** Medium (Broken Access Control / Role Boundary Violation)
- **Category:** Application Defect
- **Affected Role / Feature:** Parent, Teacher, Admin calling Student onboarding APIs.
- **Reproduction Steps:**
  1. Authenticate as a `parent` on DEV Preview.
  2. Call `POST /api/student/onboarding/preferences` with `{ "yearLevel": 5 }` and same-origin `Origin` header.
  3. Call `GET /api/student/onboarding/questions?year=5`.
- **Expected Result:** HTTP `403 { "error": "students_only" }` (consistent with `/api/student/onboarding/complete`).
- **Actual Result (Pre-fix, run `rmwsudgko`):** Both endpoints returned HTTP `200`, and `POST /api/student/onboarding/preferences` updated `year_level`, `interests`, and `weekly_goal_minutes` on the parent's own `profiles` row.
- **Root Cause Analysis:** Unlike `/api/student/onboarding/complete/route.ts`, neither `preferences/route.ts` nor `questions/route.ts` queried `profiles.role` after `supabase.auth.getUser()`.
- **Fix Commit:** `288fafcd` (`src/app/api/student/onboarding/preferences/route.ts`, `src/app/api/student/onboarding/questions/route.ts`).
- **Automated Test Evidence:** Unit regression `src/tests/unit/auth-audit-hardening.test.ts` (10 tests) + live hosted `RBAC-01` (`rmwsvvayc`: Parent, Teacher, Admin all receive `403`; Student receives `200`).
- **Retest Result:** **PASS**.

---

### `DEF-AUTH-002` — Missing CSRF `checkOrigin` Guard on Singapore Maths Sample State-Changing Routes
- **Severity:** Medium (CSRF Protection Gap — MM-SEC-03)
- **Category:** Application Defect
- **Affected Role / Feature:** Allowlisted preview users on `/api/practice/singapore-maths/sample/{submit,reveal,session}`.
- **Reproduction Steps:**
  1. Send a cross-origin `POST /api/practice/singapore-maths/sample/submit`, `POST .../reveal`, or `DELETE .../session` with `Origin: https://evil.example` or no `Origin` header.
- **Expected Result:** HTTP `403` (`origin_mismatch` / `origin_required`), matching all other state-changing Route Handlers (MM-SEC-03).
- **Actual Result (Pre-fix):** Requests bypassed same-origin verification and proceeded directly to auth/state mutation.
- **Root Cause Analysis:** The three Singapore Maths sample routes were implemented without importing and calling `checkOrigin(request)` from `@/features/auth/require-origin`.
- **Fix Commit:** `288fafcd` (routes + unit tests), `db65f78c` (`e2e/auth/singapore-maths-sample.spec.ts` updated to send same-origin `Origin` header on `DELETE`).
- **Automated Test Evidence:** `src/tests/unit/singapore-maths-sample-routes.test.ts` (19 tests including explicit cross-origin/missing-Origin 403 assertions) + CI `e2e-auth` (PASS, 7m12s).
- **Retest Result:** **PASS**.

---

### `DEF-AUTH-003` — `POST /api/parent/children` Returned HTTP `400` Instead of `401`/`403`/`503` for Auth/Config Denials
- **Severity:** Low (HTTP Authorisation Semantics)
- **Category:** Application Defect
- **Affected Role / Feature:** Anonymous, Guest, Student, Teacher, Admin calling `POST /api/parent/children`.
- **Reproduction Steps:**
  1. Send `POST /api/parent/children` with valid body `{ "displayName": "Test", "yearLevel": 5 }` as anonymous or student.
- **Expected Result:** `401` for anonymous/guest; `403` for non-parent authenticated roles.
- **Actual Result (Pre-fix, run `rmwsudgko`):** Returned `400` for all three (access was blocked, but status code misclassified auth denial as validation error).
- **Root Cause Analysis:** `src/app/api/parent/children/route.ts` mapped every non-duplicate `provisionChild` failure to HTTP `400`.
- **Fix Commit:** `288fafcd` (`src/features/auth/provision-child.ts` added `errorCode`; `src/app/api/parent/children/route.ts` maps `unauthenticated -> 401`, `forbidden -> 403`, `not_configured -> 503`).
- **Automated Test Evidence:** `src/tests/unit/auth-audit-hardening.test.ts` + live hosted `RBAC-01` (`rmwsvvayc`: Anon/Guest `401`, Student/Teacher/Admin `403`, Parent `200`).
- **Retest Result:** **PASS**.

---

### `DEF-AUTH-005` — DEV Supabase `uri_allow_list` Does Not Include Wildcard Preview Branch Aliases
- **Severity:** Medium (Infrastructure / DEV Preview Auth Redirects)
- **Category:** Infrastructure / Configuration Defect (Supabase DEV Auth Settings)
- **Affected Role / Feature:** Parent email confirmation (`REG-02`, `REG-04`) and password recovery (`REC-01`) on newly created Vercel Preview branches.
- **Reproduction Steps:**
  1. Register a new parent or request password reset on a new branch Preview alias (`https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app`).
  2. Inspect the `redirect_to` parameter in the emailed Supabase `/auth/v1/verify` link.
- **Expected Result:** `redirect_to=https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app/auth/confirm` (or `/auth/reset`).
- **Actual Result (Runs `rmwsvvayc`, `rmwswgel9`):** Supabase rejected the branch URL and fell back to `site_url` (`https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app`), which breaks same-origin PKCE verifier exchange on that preview branch. (Note: on `git-dev` and `git-integra-6b98ba`, which ARE in `uri_allow_list`, `REG-02` and `REC-01` passed cleanly.)
- **Root Cause Analysis:** DEV Supabase Auth `uri_allow_list` contains specific preview URLs rather than the wildcard `https://mindmosaic-exam-engine-*-vishwas2018s-projects.vercel.app/**`.
- **Owner Remediation Action:** In Supabase DEV (`mfglzabnayacssgertat`) -> Authentication -> URL Configuration -> Redirect URLs, add:
  `https://mindmosaic-exam-engine-*-vishwas2018s-projects.vercel.app/**`
- **Status:** Open (requires owner Supabase Dashboard access; Management API token in `.env.e2e.local` returned HTTP 401).

---

### `DEF-AUTH-006` — Minor UX Divergence Between `/auth/forgot` and `/sign-in?mode=forgot` & Duplicate `/auth/session-expired`
- **Severity:** Low (UX Consistency — No Security Impact)
- **Category:** Application Observation
- **Details:**
  - `/sign-in?mode=forgot` implements a 30s resend cooldown (`FORGOT_COOLDOWN_SECONDS`) and `#auth-error` focus panel, whereas standalone `/auth/forgot` has no resend cooldown and relies on native HTML5 email validation.
  - Both `/session-expired` (used by `requireRole` and `AuthProvider`, preserves `?next=`) and `/auth/session-expired` (does not read `?next=`) exist in the route tree.
- **Status:** Documented as non-blocking polish for post-UAT cleanup.
