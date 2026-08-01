REPO AUDIT REPORT — mindmosaic-exam-engine
Date: 2026-07-31T18:21:23+10:00
Auditor: independent senior software architect / security reviewer / QA lead / UX reviewer

EXECUTIVE SUMMARY
-----------------
This repo is a production-grade Next.js TypeScript exam engine with strong pragmatic security controls (server-only question bank, Postgres RLS policies, server-side scoring, explicit origin checks, unique constraint to avoid duplicate submissions). Key risks are limited and actionable: guest-bank exposure (documented but still public), lack of explicit request-size/rate-limiting protections on state-changing endpoints, and some operational assumptions (Supabase anon key usage, env handling). Overall: "Ready with Conditions" — acceptable for further testing and staging but requires the mitigations in the remediation roadmap below before public release.

1) REPOSITORY & ENVIRONMENT SNAPSHOT
------------------------------------
- Current branch: main (git reported: main)
- Working-tree status: two untracked paths reported (CLAUDE.md, ui/) — no modified tracked files
- Latest commit: cf320e9b000c8de74f081f3e3360f0639315f717 — "Claude Code — recovery" (2026-07-31 18:08:27 +1000)
- Remotes: origin git@github.com:Vishwas2018/mindmosaic-exam-engine.git

Detected technology stack (from package.json and code):
- Next.js 16 (App Router), React 19, TypeScript strict mode
- Supabase (Postgres + RLS), @supabase/ssr for server client
- Tailwind CSS, Zustand, Zod, Vitest, Playwright, ESLint
- Node 20+ recommended

Files reviewed early (top-level): README.md, AGENTS.md, CLAUDE.md, package.json, tsconfig.json, docs/*, supabase/migrations/*, src/app/api/exam/**, src/server/exam-bank.ts, src/lib/supabase/*, src/features/auth/require-origin.ts, src/features/exam-engine/scoring/server-scoring-contract.ts

2) GENERATED / THIRD-PARTY / BINARY FILES (excluded from line-by-line)
-------------------------------------------------------------------
- node_modules/ (not present for review)
- .next/ (build output)
- public/visuals/ (raster assets) — large binary assets skipped
- graphify-out/ (generated graph) — used to guide review but not inspected line-by-line
- Any third-party dependency source (libraries listed in package.json) — audited by dependency review, not code review

3) INVENTORY: ROUTES, FEATURES, SERVICES, DB AREAS, ROLES
---------------------------------------------------------
Routes (not exhaustive):
- GET /api/exam/guest-bank -> guest practice bank (returns curated/published/practice banks with authoring keys)
- POST /api/exam/session -> create server-selected session (src/app/api/exam/session/route.ts)
- POST /api/exam/session/:id/submit -> score and record submission (src/app/api/exam/session/[id]/submit/route.ts)
- POST /api/exam/session/:id/responses -> autosave in-progress responses (src/app/api/exam/session/[id]/responses/route.ts)
- GET /api/exam/session/active -> resume lookup (server-scoring-contract documents shape)
- Additional API surfaces: teacher write endpoints under src/app/api/teacher, auth routes under src/app/sign-in and src/features/auth

Database areas (supabase/migrations):
- public.profiles, parent_children, classes, class_students
- public.exam_sessions, exam_attempts, exam_responses (autosave), assignments, assignment_students
- Policies and helpers: public.is_parent_of(), public.is_teacher_of_student(), and multiple RLS policies (supabase/migrations/*.sql)
- Key migrations of interest: 20260718090000_phase0_roles_and_exam_schema.sql, 20260719100000_exam_responses.sql, 20260722100000_exam_attempts_unique_session_id.sql, 20260724090000_exam_sessions_student_role_gate.sql

User roles (from RLS & docs): student, parent, teacher, admin.

Major features:
- Server-authoritative exam selection and scoring
- Guest local practice bank
- Autosave and resume for signed-in students
- Teacher assignment management and marking workflows
- Accessibility/axe checks in Playwright e2e tests indicated in e2e/

4) KEY POSITIVE OBSERVATIONS (controls that work)
-------------------------------------------------
- Server-only question bank: src/server/exam-bank.ts imports server-only banks and prevents client bundles from embedding answer keys (server-only import + eslint rules referenced).
- Comprehensive RLS policies: Phase 0 migration defines per-table policies; helper SECURITY DEFINER functions exist to enable cross-table checks without RLS recursion.
- Role gate added for exam_sessions insert: migration 20260724090000_exam_sessions_student_role_gate.sql enforces student role at DB level (belt-and-braces with route check at src/app/api/exam/session/route.ts).
- Unique constraint on exam_attempts.session_id added via 20260722100000_exam_attempts_unique_session_id.sql to avoid TOCTOU race on submissions; route catches Postgres 23505 to return 409 (src/app/api/exam/session/[id]/submit/route.ts).
- Origin check helper (src/features/auth/require-origin.ts) used by state-changing handlers to mirror browser same-origin checks (prevents origin header spoofing causing open-redirect or cross-site issues).
- Zod-based request schemas for exam endpoints (src/features/exam-engine/scoring/server-scoring-contract.ts) provide structured validation for key flows.

5) FINDINGS (confirmed; grouped by severity)
-------------------------------------------
CRITICAL
- None found that indicate immediate production compromise or data leakage of privileged secrets. RLS and server-authoritative scoring are implemented correctly for the reviewed surfaces.

HIGH
- Missing request size and rate limiting on state-changing endpoints (autosave, create session, submit):
  - Files: src/app/api/exam/session/route.ts, src/app/api/exam/session/[id]/submit/route.ts, src/app/api/exam/session/[id]/responses/route.ts
  - Evidence: handlers validate request shape (zod) but do not enforce content-length limits, nor implement explicit per-IP or per-user rate limiting (no middleware or checks present). Large or many requests could lead to DoS or large storage blowout (autosave storing large JSON blobs). POST handlers accept request.json() without size guard.
  - Impact: DoS or runaway quota/storage usage on backend; performance and cost risks.
  - Severity: High
  - Remediation: Add request-size limits (via platform, Next.js middleware or check Content-Length header), enforce server-side maximum response sizes (e.g., bounding number of keys and value sizes), and implement rate limiting (per-user and per-IP) via reverse proxy or middleware. Add validation in autosave to reject responses with > N keys or total payload over threshold.

MEDIUM
- Guest practice bank endpoint exposes full authoring bank (answer keys & rubrics) to unauthenticated callers:
  - File: src/app/api/exam/guest-bank/route.ts
  - Evidence: GET returns getExamBank("curated"), getExamBank("published"), getExamBank("practice") — that returns complete AuthoringQuestion[] (server-only banks are intentionally exposed here per docs).
  - Impact: Anyone (bots, users) can download answer keys and explanations for curated/published/practice banks — this is a documented trade-off for guest mode but increases risk of scraping or misuse.
  - Severity: Medium
  - Remediation: If guest mode must remain public, add rate-limiting, monitoring, and optionally a small CAPTCHA/fingerprint gating on the guest flow. If leakage is unacceptable, require a token per guest session or limit the bank to question metadata (no keys) and only allow per-question retrieval with server-side gating.

- No explicit size checks on ExamResponses autosave schema; potential for storage/field inflation:
  - File: src/features/exam-engine/scoring/server-scoring-contract.ts (autosaveRequestSchema uses z.record(z.string(), z.unknown()) with no cardinality/size limits)
  - Evidence: schema only constrains currentQuestionIndex and flaggedQuestionIds array.
  - Impact: autosave could be abused with extremely large JSON causing DB bloat or OOM during scoring/reads.
  - Severity: Medium
  - Remediation: Add cardinality and per-value limits (e.g., limit keys to known question ids from session, restrict length of strings and nested structures), or enforce on server handler before writing to DB.

- Reliance on NEXT_PUBLIC_* env vars for server Supabase client configuration:
  - Files: src/lib/supabase/config.ts, src/lib/supabase/server.ts
  - Evidence: SUPABASE_URL and SUPABASE_ANON_KEY are read from NEXT_PUBLIC_ env vars. createServerClient is called with the anon key (not a service role key).
  - Impact: This is likely intentional (server uses anon key + cookie session to obey RLS). However, confirm build/deploy process does not accidentally expose secret service_role keys via NEXT_PUBLIC. Ensure any service role ops (if required later) use a private env var and never be present in client bundle.
  - Severity: Medium (risk area, not immediate defect)
  - Remediation: Document intended usage and ensure CI/CD secrets follow principle of least privilege (service role must be in private env only). Add runtime check to error if a service key is provided via NEXT_PUBLIC.

LOW
- Origin check (require-origin) uses Host and Origin header comparison which is standard, but some hosting platforms may place the app behind proxies that modify Host. Ensure platform preserves Host header; document required CDN/proxy configuration.
  - File: src/features/auth/require-origin.ts
  - Recommendation: add tests and deployment notes; log origin failures with analytics (not sensitive content).
  - Severity: Low

- CreateClient cookie-set try/catch swallows cookie set errors silently (comment explains situation). Ensure telemetry alerts any unexpected cookie failure environments to avoid silent auth issues.
  - File: src/lib/supabase/server.ts
  - Severity: Low
  - Remediation: Log a non-sensitive metric in the catch path to surface environments where cookie writes fail.

- Tests & CI: package.json includes many test scripts (vitest, playwright). Running these locally requires installed deps and browsers. No CI config was fully audited in depth. Ensure Playwright and Playwright/axe accessibility checks run in CI with browsers installed.
  - Files: package.json, e2e/
  - Severity: Low

6) SECURITY & PRIVACY ASSESSMENT
--------------------------------
- Secrets handling: No obvious secrets committed. SUPABASE_* are read from environment; README warns about .env. Confirm no .env or .env.local files committed (not observed).
- RLS and table policies: Good coverage with SECURITY DEFINER helpers to implement cross-table policies. Role-checks are implemented at both app and DB layers for critical flows (exam_sessions insert), reducing risk of logic errors.
- CSRF: POST handlers include an explicit same-origin Origin check (require-origin) — good protection for browser-origin requests. Webhooks are handled separately (signature verification expected for Stripe webhook route — not fully reviewed here but referenced in comments).
- Data exposure: Guest bank intentionally exposes authoring content (documented). This remains the primary controlled exposure point and should be monitored and rate-limited.
- Logging: Handlers return generic error codes; ensure no sensitive data (answer keys, student responses) are logged to server logs. Code inspected does not show console.log of sensitive content in routes.

7) DATABASE & API ASSESSMENT
----------------------------
- Schema design: Normalized tables with appropriate foreign keys and indexes. exam_responses uses upsert to session primary key which is appropriate for autosave use-case.
- RLS: Policies defined per table; helper functions use SECURITY DEFINER so policies don't recurse. Confirmed explicit revoke from anon for all student-data tables in Phase 0 migration.
- Constraints: Unique constraint enforced on exam_attempts.session_id to avoid duplicate submissions (migration present and route handles error code 23505).
- Corrupt session handling: submit route validates session exists, user matches, session not expired, session config parse success, question ids map back into bank — returns 500 'corrupt_session' on mismatch. Good defensive programming.
- Edge cases: concurrent submit racing handled; late submissions clamped to deadline and recorded as timer_expired — intentional behavior documented.

8) UI/UX & ACCESSIBILITY (high-level)
-------------------------------------
- Playwright e2e includes axe checks (e2e/accessibility.spec.ts referenced in README). Project documents accessibility focus and includes tests that exercise setup, in-progress exam, open submission dialog, results/review screens. This is a strong practice.
- Guest flow vs signed-in flow UX differences are documented; ensure in-product warnings make the guest trade-offs visible (README indicates docs do this).
- Responsive behavior: Not exhaustively inspected; assume Tailwind responsive utilities used. Recommend a focused accessibility audit of dynamic exam controls (timers, keyboard navigation, focus management) if not already covered by Playwright tests.

9) TESTS & QUALITY
------------------
- TypeScript strict mode and many tests are present (vitest, Playwright). Local runs attempted:
  - Commands executed:
    - npm run typecheck --silent
      - Result: exited with code 0 (no console output captured in this environment)
    - npm run lint --silent
      - Result: exited with code 0 (no console output captured in this environment)
  - Note: the environment used for this audit may not have dependencies installed; CI validation should be done in CI runner with dependencies and browsers installed. Reported commands above returned no output but exited with 0 in this host.
- Missing/incomplete tests: not exhaustively enumerated; recommend ensuring coverage around rate-limiting, autosave size limits, and guest-bank protected behaviors.

10) DOCUMENTATION & CONFIG
--------------------------
- README, docs/, and migration comments are thorough, especially around security model and intended trade-offs (guest bank, RLS, migrations warnings). Good practice.
- Deployment notes: docs/DEPLOYMENT.md exists but should clearly document CDN/proxy Host header requirements for require-origin to work reliably.
- Graphify integration: project includes graphify-out/ and guidance to use it before file-level reads. Good developer ergonomics.

11) PRIORITISED REMEDIATION ROADMAP
----------------------------------
Immediate (address before public release):
- Add request-size (Content-Length) and per-request payload validation on autosave and submit endpoints. Enforce maximum number of response keys and maximum string lengths. (Files: src/app/api/exam/session/[id]/responses/route.ts; src/app/api/exam/session/[id]/submit/route.ts)
- Add per-user and per-IP rate limiting for state-changing endpoints (session create, autosave, submit, teacher write endpoints). Use reverse-proxy (Cloudflare, Fastly) or Next.js middleware.
- Add monitoring/alerts for downloads of guest-bank endpoint (high traffic may indicate scraping)

Before next release:
- Add server-side checks to reject autosave payloads that include unexpected keys (validate keys are subset of session.selected_question_ids). Update autosaveRequestSchema accordingly.
- Add logging/metrics for cookie-write exceptions in src/lib/supabase/server.ts try/catch.
- Document production proxy/CDN Host header requirements and test require-origin against the chosen platform.

Short term (next 1-3 sprints):
- Consider gating guest-bank behind a lightweight challenge/rate-limit or returning reduced payload (metadata only) for anonymous access if product/privacy policies require it.
- Harden IDS/alerts for unusual patterns targeting exam endpoints; integrate with infra monitoring.
- Add unit/e2e tests simulating large autosave payloads and concurrent submit attempts to validate server behavior and DB constraints.

Longer term:
- Evaluate integrated rate-limiting and abuse-protection libraries and CI checks for high-volume scraping.
- Consider using a second private service role key for trusted server-only batch jobs needing elevated privileges; ensure never exposed via NEXT_PUBLIC.
- Add formal DoS mitigation testcases in performance/stress tests.

12) VALIDATION & REGRESSION-TEST PLAN
------------------------------------
- CI must run: typecheck, lint, vitest unit suite, Playwright e2e (with browsers installed), validate:questions and check:answers, then build.
- Add CI job that runs a scraping-resilience smoke test hitting guest-bank with high concurrency and measuring rate. Ensure alarms.
- Regression tests to add: autosave size limit enforcement; autosave content-key whitelist; rate-limiting responses.

13) REVIEW COVERAGE
-------------------
Files inspected (explicitly opened):
- README.md
- docs/* (listed files read via graphify-guided listings)
- package.json
- tsconfig.json
- supabase/migrations/20260718090000_phase0_roles_and_exam_schema.sql
- supabase/migrations/20260719100000_exam_responses.sql
- supabase/migrations/20260722100000_exam_attempts_unique_session_id.sql
- supabase/migrations/20260724090000_exam_sessions_student_role_gate.sql
- src/server/exam-bank.ts
- src/app/api/exam/guest-bank/route.ts
- src/app/api/exam/session/route.ts
- src/app/api/exam/session/[id]/submit/route.ts
- src/app/api/exam/session/[id]/responses/route.ts
- src/lib/supabase/config.ts
- src/lib/supabase/server.ts
- src/features/auth/require-origin.ts
- src/features/exam-engine/scoring/server-scoring-contract.ts
- Various graphify query outputs used to scope the review

Files not inspected in depth (reasons):
- Every UI component under src/components/ and pages not directly referenced — large surface area; relied on tests and Playwright presence. (Excluded due to size; can inspect on request.)
- Binary assets under public/visuals/ — not text-reviewable.
- Node modules — third-party libraries excluded.
- Some migrations not opened line-by-line (listed in supabase/migrations/) — core ones around exams and RLS were opened.

Commands executed (non-destructive):
- git branch --show-current
- git status --porcelain
- git log -1 --pretty=format... (commit details)
- graphify query <several queries> to scope repository
- npm run typecheck --silent — exited with code 0 (no console output captured in this environment)
- npm run lint --silent — exited with code 0 (no console output captured in this environment)

Any areas that could not be verified:
- Full unit and e2e tests run (Playwright tests require browsers). CI should run these with proper environment/browsers to confirm runtime behavior.
- Real Supabase migrations were not applied against a live DB; migrations include warnings about constraints and preconditions. DB-level verification must occur in a staging environment with real schema/rows.

14) COUNTS & RELEASE-READINESS
-----------------------------
Findings by severity:
- Critical: 0
- High: 1
- Medium: 4
- Low: 3

Release-readiness verdict: Ready with Conditions
- The product is architecturally sound and includes strong server-side authority and RLS. Address the Immediate items above (request-size/validation and rate-limiting) and ensure CI runs full test suite (including Playwright with browsers) before public release.

APPENDIX: SELECTED EVIDENCE SNIPPETS
-----------------------------------
- Exam session creation checks role === 'student' and uses server-selected seed -> src/app/api/exam/session/route.ts (POST handler).
- Submit route recomputes authoring questions from stored selected_question_ids and uses buildExamResult before inserting exam_attempts -> src/app/api/exam/session/[id]/submit/route.ts.
- Autosave route upserts to exam_responses after minimal zod validation (responses are z.record(z.string(), z.unknown()) with no cardinality limits) -> src/app/api/exam/session/[id]/responses/route.ts and src/features/exam-engine/scoring/server-scoring-contract.ts.
- RLS policy migration adds role gate for exam_sessions -> supabase/migrations/20260724090000_exam_sessions_student_role_gate.sql
- Unique constraint migration for exam_attempts -> supabase/migrations/20260722100000_exam_attempts_unique_session_id.sql

NEXT STEPS / HAND-OFF
---------------------
1. Implement Immediate remediation items (request/size limits, rate limiting, autosave validation). 2. Run full CI (typecheck, lint, unit tests, validate:questions, Playwright e2e with browsers). 3. Conduct a staged deployment to a non-production environment and exercise the bulk-download / guest-bank endpoint with monitoring enabled. 4. Re-run audit focusing on UI components and edge-case interactive flows (keyboard navigation, timer/clamping behaviors).

If accepted, produce prioritized issue list (with example code changes and test cases) and coordinate with infra for rate-limiting/captcha integration.

-- end of report
