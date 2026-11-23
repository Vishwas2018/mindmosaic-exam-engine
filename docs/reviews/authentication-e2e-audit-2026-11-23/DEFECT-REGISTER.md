# MindMosaic Authentication Defect Register (2026-11-23 — Updated Follow-Up)

All defects below were discovered via static security review and live hosted DEV Preview E2E testing against `mfglzabnayacssgertat`.

---

## Summary Table

| Defect ID | Category | Severity | Affected Role / Feature | Status | Fix Commit |
|---|---|---|---|---|---|
| `DEF-AUTH-004` | Application (Security) | **High** | All authenticated roles — Session cookie (`sb-*-auth-token`) missing `Secure` flag on HTTPS | **Fixed & Verified** | `288fafcd` |
| `DEF-AUTH-001` | Application (AuthZ) | **Medium** | Parent / Teacher / Admin — Missing `student` role gate on `/api/student/onboarding/preferences` & `/questions` | **Fixed & Verified** | `288fafcd` |
| `DEF-AUTH-002` | Application (CSRF) | **Medium** | Allowlisted preview users — Missing `checkOrigin` CSRF guard on Singapore Maths sample state-changing routes | **Fixed & Verified** | `288fafcd` |
| `DEF-AUTH-003` | Application (API Auth) | **Low** | Anonymous / Guest / Student / Teacher / Admin — `POST /api/parent/children` returned `400` instead of `401`/`403` | **Fixed & Verified** | `288fafcd` |
| `DEF-AUTH-005` | Infrastructure (Supabase DEV Auth) | **Medium** | Preview branch real-email confirmation & password recovery redirects | **Still Open (Re-verified 18:19 AEDT on `rmwsxnemo`/`rmwsxqd66` — Owner Dashboard Action Required)** | N/A (Supabase Dashboard) |
| `DEF-AUTH-006` | Application (UX / Consistency) | **Low** | Parent — Standalone `/auth/forgot` lacks client email validation & 30s resend cooldown present in `/sign-in?mode=forgot`; duplicate `/auth/session-expired` vs `/session-expired` | **Assessed (Fix `/auth/forgot` before family beta; defer `/auth/session-expired`)** | Deferred |

---

## Detailed Defect Records

### `DEF-AUTH-004` — Supabase Auth Session Cookie Missing `Secure` Attribute on HTTPS
- **Severity:** High (Session Security / Transport Protection)
- **Category:** Application Defect
- **Affected Role / Feature:** All signed-in roles (Student, Parent, Teacher, Admin) on HTTPS deployments.
- **Reproduction Steps:**
  1. Sign in as a parent on HTTPS DEV Preview.
  2. Inspect browser cookies via `context.cookies()` for `sb-mfglzabnayacssgertat-auth-token`.
- **Expected Result:** `secure: true`, `sameSite: "Lax"`.
- **Actual Result (Pre-fix, run `rmwsv4lml`):** `secure: false`, `httpOnly: false`, `sameSite: "Lax"`.
- **Root Cause Analysis:** `src/lib/supabase/client.ts` called `createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)` without `cookieOptions.secure`, and `src/lib/supabase/server.ts` / `src/lib/supabase/middleware.ts` forwarded `@supabase/ssr` cookie options without enforcing `secure: true` on HTTPS / Vercel deployments.
- **Fix Commit:** `288fafcd` (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`).
- **Independent Review Verification:** Confirmed in `node_modules/@supabase/ssr/dist/main/cookies.js` (lines 197–206, 250–254, 403–412) that `cookieOptions` (`secure`, `sameSite`) are applied uniformly to both cookie writes (`setItem`) and sign-out deletions (`removeItem`, `maxAge: 0`), preventing stale-cookie resurrection. Minor non-Vercel observation (`SEC-REV-01`): `server.ts` keys off `process.env.VERCEL === "1"`; safe on all Vercel Preview/Prod deploys, recommend adding `x-forwarded-proto === "https"` fallback if ever hosted off Vercel.
- **Retest Result:** **PASS** (`rmwsvvayc`, `rmwswgel9`, `rmwsx4d6n` — `secure: true, sameSite: "Lax", path: "/"`).

---

### `DEF-AUTH-001` — Missing `student` Role Gate on `/api/student/onboarding/preferences` and `/api/student/onboarding/questions`
- **Severity:** Medium (Broken Access Control / Role Boundary Violation)
- **Category:** Application Defect
- **Fix Commit:** `288fafcd` (`src/app/api/student/onboarding/preferences/route.ts`, `src/app/api/student/onboarding/questions/route.ts`).
- **Automated Test Evidence:** Unit regression `src/tests/unit/auth-audit-hardening.test.ts` (10 tests) + live hosted `RBAC-01` (`rmwsvvayc`, `rmwswsc1h`, `rmwsx4d6n`: Parent, Teacher, Admin all receive `403 students_only`; Student receives `200`).
- **Retest Result:** **PASS**.

---

### `DEF-AUTH-002` — Missing CSRF `checkOrigin` Guard on Singapore Maths Sample State-Changing Routes
- **Severity:** Medium (CSRF Protection Gap — MM-SEC-03)
- **Category:** Application Defect
- **Fix Commit:** `288fafcd` (routes + unit tests), `db65f78c` (`e2e/auth/singapore-maths-sample.spec.ts` updated to send same-origin `Origin` header on `DELETE`).
- **Independent Review Verification:** Static scan of all 33 API Route Handlers under `src/app/api/**` confirmed 100% of browser-called mutating routes (`POST`/`PUT`/`PATCH`/`DELETE`) now enforce `checkOrigin`, with only `POST /api/stripe/webhook` intentionally excluded (Stripe HMAC signature verified).
- **Retest Result:** **PASS** (`singapore-maths-sample-routes.test.ts` 19/19 + CI `e2e-auth` PASS).

---

### `DEF-AUTH-003` — `POST /api/parent/children` Returned HTTP `400` Instead of `401`/`403`/`503` for Auth/Config Denials
- **Severity:** Low (HTTP Authorisation Semantics)
- **Category:** Application Defect
- **Fix Commit:** `288fafcd` (`src/features/auth/provision-child.ts`, `src/app/api/parent/children/route.ts`).
- **PR #159 Compatibility Check:** Verified clean 3-way merge (`git merge-tree`, 0 conflicts) with PR #159's plan-cap logic in `provision-child.ts`.
- **Retest Result:** **PASS** (`rmwsvvayc`, `rmwswsc1h`, `rmwsx4d6n`: Anon/Guest `401`, Student/Teacher/Admin `403`, Parent `200`).

---

### `DEF-AUTH-005` — DEV Supabase `uri_allow_list` Does Not Include Wildcard Preview Branch Aliases
- **Severity:** Medium (Infrastructure / DEV Preview Auth Redirects)
- **Category:** Infrastructure / Configuration Defect (Supabase DEV Auth Settings)
- **Follow-Up Live Re-Check (2026-11-23 18:16–18:19 AEDT, runs `rmwsxnemo` & `rmwsxqd66` on PR #160 Preview `f835691f`):**
  - **Result:** **STILL OPEN — NOT YET CONFIGURED IN DEV SUPABASE.**
  - `REG-02`, `REG-04`, and `REC-01` all delivered real emails on the first attempt (`<15s`), confirming Gmail SMTP is healthy.
  - However, Supabase GoTrue still rewrote `redirect_to` from `https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app/auth/confirm` (and `/auth/reset`) to `https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app`.
  - In `REG-04`, following the emailed link landed on `https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app/?code=...` (dropping `/auth/confirm`, switching hosts, losing the PKCE verifier, and hitting the Vercel SSO wall for `git-dev`).
- **Owner Remediation Action:** In Supabase DEV (`mfglzabnayacssgertat`) -> **Authentication -> URL Configuration -> Redirect URLs**, add:
  `https://mindmosaic-exam-engine-*-vishwas2018s-projects.vercel.app/**`
  Then re-run `01-registration-and-verification.spec.ts` and `02-login-logout-recovery.spec.ts -g REC-01` against PR #160's Preview URL.

---

### `DEF-AUTH-006` — UX Divergence Between `/auth/forgot` and `/sign-in?mode=forgot` & Duplicate `/auth/session-expired`
- **Severity:** Low (UX Consistency — No Security Impact)
- **Category:** Application Observation
- **Follow-Up Code Trace & Recommendation:**
  1. **`/auth/forgot` (`src/app/auth/forgot/page.tsx`):** Actively linked from `src/app/auth/reset/page.tsx:267` whenever a reset link is expired, used, opened on another device, or opened cold. Unlike `/sign-in?mode=forgot`, `/auth/forgot` lacks client-side email format validation, `#auth-error` focus/shake polish, and a 30s resend cooldown with an in-place resend button.
     - **Recommendation:** **Fix before public family beta** (low risk, ~30 min: redirect `/auth/forgot` to `/sign-in?mode=forgot` or reuse the shared forgot-password card), **not a blocker for DEV manual UAT** since `/auth/forgot` functions reliably end-to-end (verified in `REC-01` on `rmwsuwdnl`).
  2. **`/auth/session-expired` (`src/app/auth/session-expired/page.tsx`):** `git grep` confirmed **zero** production links or redirects point here (all live redirects in `AuthProvider.tsx:244` and `require-role.ts:71` go to `/session-expired?next=...`); only legacy `e2e/auth/auth-journey.spec.ts` visits it.
     - **Recommendation:** **Defer post-beta** (no user impact; retire alongside test cleanup in a follow-up PR).
