# MindMosaic Authentication Security Assessment (2026-11-23 — Independent Review Update)

- **Scope:** Hosted DEV Preview (`https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app`, code SHA `db65f78c` / docs SHA `f835691f`) and DEV Supabase (`mfglzabnayacssgertat`).
- **Safety Boundary:** All security tests were bounded, non-disruptive, synthetic-data-only checks against DEV. Production (`uermhsptduikehuyceiz`) was never touched.

---

## 1. Control-by-Control Security Verification

| Control Area | Test Case(s) | Status | Verified Evidence |
|---|---|---|---|
| **Session Cookie Attributes** | `SEC-01`, `@supabase/ssr` source inspection | **PASS (Post-fix `DEF-AUTH-004`)** | `sb-mfglzabnayacssgertat-auth-token` carries `secure: true`, `sameSite: "Lax"`, `path: "/"` on HTTPS Preview (`rmwsvvayc`, `rmwswgel9`, `rmwsx4d6n`). Confirmed in `@supabase/ssr` `cookies.js` that `cookieOptions` apply equally to `setItem` and `removeItem` (`maxAge: 0`), preventing stale-cookie resurrection on sign-out. |
| **Content Security Policy (CSP)** | `SEC-01`, `src/proxy.ts` | **PASS (Observed)** | Nonce-based CSP headers are emitted on `/sign-in`, `/auth/confirm`, `/auth/forgot`, `/auth/reset`. Enforced (`Content-Security-Policy`) when `MM_DEV_AUTH_CSP_ENFORCE=1`; `Content-Security-Policy-Report-Only` when unset. |
| **CSRF / Same-Origin Enforcement** | `SEC-01`, 33-route static audit, `singapore-maths-sample-routes.test.ts` | **PASS (Post-fix `DEF-AUTH-002`)** | All 24 browser-called state-changing routes across `src/app/api/**` enforce `checkOrigin(request)` (host-matched `Origin` vs `Host`). Sole intentional exception: `POST /api/stripe/webhook` (Stripe HMAC signature verified). Live `SEC-01` confirmed `403` for both evil `Origin` and missing `Origin`. |
| **Open Redirect Prevention** | `SEC-01`, `auth-safe-next.test.ts` | **PASS** | `https://evil.example`, `//evil.example`, `/\evil.example`, and `javascript:alert(1)` passed via `/sign-in?next=` were all rejected by `safeNextPath()` and landed on `/parent` on the same origin. |
| **JWT Integrity & Tampering** | `SEC-01` | **PASS** | Mutating the signature segment of a valid session JWT produced HTTP `401` on DEV PostgREST (`/rest/v1/profiles`). |
| **Privilege Escalation (DB & Signup)** | `SEC-01`, `tests/rls/privilege-hardening.test.ts` | **PASS** | 1) Direct PostgREST `PATCH /rest/v1/profiles?id=eq.<self>` with `{ "role": "admin" }` returned HTTP `403` and left `role = "parent"`. 2) Direct `POST /auth/v1/signup` with `data: { role: "admin" }` was clamped by `on_auth_user_created` to `student`. |
| **Role-Based Access Control (UI & API)** | `RBAC-01`, `auth-audit-hardening.test.ts` | **PASS (Post-fix `DEF-AUTH-001`, `003`)** | 114/114 UI route cells and 60/60 API authorisation cells passed across all 6 roles (Anonymous, Guest, Student, Parent, Teacher, Admin). |
| **Cross-Family Data Isolation (RLS + API)** | `RBAC-01`, `d-security-isolation.spec.ts`, CI `rls` | **PASS** | Parent B and Student B cannot read, rename, archive, or submit valid synthetic Family A child/session/attempt records via UI, Next.js API routes, or direct PostgREST queries. CI `rls` passed. |
| **Account Enumeration Prevention** | `AUTH-01`, `REG-02`, `N9`, `N10` | **PASS** | Sign-in returns identical generic copy for unknown emails vs wrong passwords. Sign-up returns "Check your email" (or generic rate-limit) for duplicate accounts. Student sign-in returns identical generic copy for unknown codes, wrong PINs, and paused/archived children. |
| **Brute-Force & Lockout Controls** | `AUTH-01` | **PASS** | 5 consecutive failed sign-in attempts trigger a 30s client lockout (`Try again in Xs`) backed by Supabase GoTrue server-side rate limiting. |
| **Session Invalidation on Password Reset** | `REC-01` | **PASS** | Changing password via `/auth/reset` calls `signOut({ scope: "others" })`; verified live (`rmwsuwdnl`) that a second active browser session was immediately redirected to `/session-expired?next=%2Fparent`. |
| **Archived / Revoked Account Enforcement** | `AUTH-02`, `supabase-archived-session.test.ts` | **PASS** | Archiving a child immediately invalidates their existing session via `denyArchivedSessions()` (`app_metadata.archived === true`). Setting `profiles.access_revoked_at` blocks access at `requireRole()` and signs out the session. |
| **Sensitive Data & Key Leakage** | `SEC-01`, `REG-01` | **PASS** | Zero password persistence in `sessionStorage` draft (`mm-signup-draft`) or `localStorage`; zero `SUPABASE_SERVICE_ROLE_KEY` exposure in rendered HTML or client bundles. |

---

## 2. Independent Code Review of PR #160 Security Fixes (`288fafcd` / `db65f78c`)

| Area | Files Reviewed | Review Finding | Risk Rating |
|---|---|---|---|
| **Cookie Handling (`DEF-AUTH-004`)** | `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `@supabase/ssr/dist/main/cookies.js` | Browser client uses `window.location.protocol === "https:"`; middleware checks `nextUrl.protocol`, `x-forwarded-proto`, and `VERCEL === "1"`; `server.ts` checks `VERCEL === "1"` (`SEC-REV-01`: safe on all Vercel Preview/Prod deployments; add `x-forwarded-proto` fallback only if ever hosted off Vercel). Local HTTP CI (`127.0.0.1:3101`) unaffected. | **Sound (Low portability note)** |
| **CSRF Protection (`DEF-AUTH-002`)** | All 33 `src/app/api/**/route.ts` + `src/features/auth/require-origin.ts` | Every browser-called mutating route now enforces `checkOrigin(request)` before touching storage or user state. Combined with `Secure` cookies (`DEF-AUTH-004`), cross-scheme HTTP->HTTPS CSRF cannot carry auth cookies (`SEC-REV-02`). On `/api/stripe/checkout`, `isStripeConfigured` returns fail-closed `503` before `checkOrigin` when Stripe is off; once PR #159 enables Stripe, `checkOrigin` executes before auth/Stripe calls. | **Sound** |
| **Role Enforcement (`DEF-AUTH-001`, `003`)** | `src/app/api/student/onboarding/{preferences,questions}/route.ts`, `src/features/auth/provision-child.ts`, `src/app/api/parent/children/route.ts` | Student onboarding routes now uniformly enforce `profiles.role === "student"` -> `403 students_only`. `POST /api/parent/children` cleanly maps `errorCode` (`unauthenticated -> 401`, `forbidden -> 403`, `not_configured -> 503`, `duplicate -> 409`). Exam session read/autosave/submit routes remain strictly ownership-scoped (`student_id === user.id` + RLS/SECURITY DEFINER) returning `404` to non-owners. | **Sound** |

---

## 3. Residual Risks & Architectural Notes

1. **DEV Supabase Redirect Allow-List (`DEF-AUTH-005` — Open Infra Config):** Until `https://mindmosaic-exam-engine-*-vishwas2018s-projects.vercel.app/**` is added to DEV Supabase Auth Redirect URLs, email links triggered from new feature-branch Preview URLs fall back to `site_url` (`git-dev`), breaking PKCE same-origin verification on those branches.
2. **`httpOnly: false` on `sb-*-auth-token` (Known `@supabase/ssr` Constraint):** Required for browser client hydration; mitigated by `Secure`, `SameSite=Lax`, and nonce-based CSP. Recommendation: enable `MM_DEV_AUTH_CSP_ENFORCE=1` on all Preview and Production environments.
3. **Access-Token Remaining Lifetime on `access_revoked_at` (Documented in ADR-012 §5):** `requireRole()` checks `profiles.access_revoked_at` on every `/{role}` page render, while erasure bans the GoTrue user and deletes `auth.sessions`. Individual API routes rely on `auth.getUser()` + `denyArchivedSessions()` and do not separately re-query `access_revoked_at`.
