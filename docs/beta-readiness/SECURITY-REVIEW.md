# Security review: DEV family beta

Last updated 2026-11-14. Scope: hosted DEV (`mfglzabnayacssgertat`) and the Preview of PR #124. Production
(`uermhsptduikehuyceiz`) was not accessed. **[V]** = verified on the hosted Preview or DEV; **[R]** = read in code.

## Exam integrity

| Control | Evidence |
|---------|----------|
| Legacy `record_exam_attempt` / `create_exam_session` not executable by a signed-in user | **[V]** Scenario D calls both through PostgREST with their real signatures as a student: `403 42501 permission denied`; no forged attempt stored. Migration `20261031090100` applied 2026-11-14 (DATABASE-READINESS.md) |
| Session create and submit go through the dedicated `mindmosaic_exam_writer` | **[V]** Scenario C: browser create, autosave, resume, submit on the Preview; one attempt row per sitting, owned by the child |
| Score computed server-side; client cannot set it | **[V]** 66/66 API acceptance on `100287e7` (forged client score ignored, independent oracle). **[V]** Scenario C: marks on screen equal the stored attempt |
| No answer keys before submission | **[V]** 66/66 run (`no answer-key leakage during creation`); **[R]** `server-only` exam-bank gateway |
| Duplicate submit / post-submit autosave refused | **[V]** 66/66 run (409); Scenario C: a submitted paper cannot be reopened from `/exam` |

## Family isolation (Scenario D, two synthetic families)

| Check | Result |
|-------|--------|
| Parent B's pages and API for A's child (`/parent/children/<A>` + progress, learning, preview, writing, curriculum; PATCH) | **[V]** 404 everywhere; A's name never rendered (curriculum page fixed in this PR, D-029) |
| Parent B's JWT on `exam_attempts`, `exam_sessions`, `profiles` for A's child | **[V]** 0 rows (RLS) |
| Student B read / autosave / submit A's session (well-formed bodies) | **[V]** 404 / 404 / 404; A's stored attempt unchanged |
| Student B reads A's attempt via PostgREST | **[V]** 0 rows |
| `/admin` as parent or student; `/parent` as student | **[V]** redirected away |
| Anonymous: `/student`, `/parent`, `/admin` | **[V]** redirected to sign-in; exam session create 401; PostgREST `exam_attempts` 401 |
| Student cannot start a payment | **[V]** checkout 503 (`not_configured`, no Stripe keys on DEV); route also enforces `parents_only` **[R]**; `/billing` shows a child no plan (D-024) |

## Authentication

- **[V]** Wrong PIN and unknown login code produce the same message (no account enumeration).
- **[V]** Sign-in before email confirmation is refused; confirmation link signs the parent in (A1–A2).
- **[R]** Sign-up never reveals that an address already has an account.
- **Open (D-025):** DEV Auth refuses the second confirmation email within about an hour, so parallel family
  sign-ups fail. Needs custom SMTP. Not a security hole; an availability blocker.

## Platform

- **[V]** Preview binds to DEV only: accounts created through the Preview UI are found on DEV by the service role;
  Vercel env lists `NEXT_PUBLIC_SUPABASE_URL` for preview and production separately; `EXAM_WRITE_DB_URL` exists
  for preview (and a stale development copy, owner to delete).
- **[R]** Headers: HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. CSP is
  **report-only** (D-001: enforcing it stopped prerendered pages hydrating). Making it enforcing needs nonce or
  hash support for static routes; P2, not a beta blocker.
- **[V]** `npm audit --omit=dev`: 0 vulnerabilities. Dev-only tooling: 4 high, 9 moderate (brace-expansion,
  browserslist, js-yaml, vite/launch-editor). These do not ship to users; left for a planned tooling bump.
- **[V]** Hosted test harness: the Vercel bypass secret is read into memory, sent only to the Preview host, never
  written; Playwright traces are off because they record headers.

## Not covered

- Rate limiting of the student PIN form beyond Supabase Auth's own limits (no app-level lockout observed or tested).
- Error monitoring: no Sentry or equivalent is configured on Vercel; failures surface only in Vercel runtime logs.
