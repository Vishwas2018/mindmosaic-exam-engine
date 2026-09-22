# Playwright test framework

Two independent suites, two configs, two purposes. Neither reuses the
other's server, environment, or Supabase project.

## Guest suite (`e2e/`, `playwright.config.ts`)

Runs against an **unconfigured Supabase** (`isSupabaseConfigured === false`)
— every guest-facing surface the product has: landing, catalogue, exam
flows, renderer showcase, accessibility scans across marketing/exam/results,
billing, legal pages, 404s. ~20 spec files, the deepest and longest-standing
coverage in the repo.

```sh
npm run test:e2e
```

**CI:** the `e2e` job in `.github/workflows/ci.yml`, `ubuntu-latest`, no
Docker.

## Authenticated suite (`e2e/auth/`, `playwright.auth.config.ts`)

Runs against a **real local Supabase instance** (`supabase start`) with real
GoTrue sessions, real RLS-scoped queries, and 11 deterministic seeded
identities (`e2e/fixtures/identities.ts`) — parent/student/teacher/admin ×
no-data/some-data/multi-child/expired-subscription states. Auth is via
`storageState` cookies built directly from GoTrue's password grant
(`e2e/fixtures/session-cookie.ts`), not a rendered sign-in form, so a single
spec can hold many identities at once without paying for a UI login each
time (`contextAs("...")` in `e2e/fixtures/auth.fixture.ts`).

Full setup, environment variables, troubleshooting, and the "why a second
config/env file" rationale: **`docs/testing/playwright-auth-test-data-guide.md`**.

```sh
supabase start        # local stack — see supabase/config.toml
npm run e2e:seed       # idempotent; also runs automatically via globalSetup
npm run test:e2e:auth
supabase stop          # when done
```

**CI:** the `e2e-auth` job in `.github/workflows/ci.yml`, `ubuntu-latest`,
Docker + `supabase/setup-cli`. Added 2026-09 — before that, this suite only
ever ran locally, by hand, which is exactly how the student-portal rewrite's
regressions this repair fixed (stale a11y assertions, real touch-target/
contrast/focus bugs) sat undetected for as long as they did. See
`docs/testing/e2e-auth-baseline-2026-09.md` for that repair's before/after.

### Coverage

| Area | Spec |
|---|---|
| Role access, cross-tenant isolation, environment guard | `role-access.smoke.spec.ts` |
| Parent dashboard a11y (empty/single/multi-child) | `a11y-parent-dashboard.spec.ts` |
| Parent add-child flow | `parent-add-child.spec.ts` |
| Student dashboard-family a11y (Dashboard, Learning Hub, Assignments, My Progress, Exam Centre, Practice Studio) | `a11y-student-dashboard.spec.ts` |
| Student portal content/data-integrity (real attempt data consistent across screens, coming-soon controls genuinely inert, drill-module links resolve to real filtered destinations) | `student-portal-content.spec.ts` |
| Full student exam session (code+PIN sign-in → timed exam → autosave → resume) | `student-exam-session.spec.ts` |
| New question-type capability journey (hot_text, matrix_choice, structured_response) | `assessment-capability-auth.spec.ts` |

### Known gaps (out of scope for the 2026-09 repair, per its own brief)

- Billing-enforcement-on behavior (`BILLING_ENFORCEMENT_ENABLED=true`) — no
  test exercises the flag flipped on.
- Teacher assignment-creation, essay marking, admin analytics/intelligence
  dashboards' actual content — reachable, not asserted on beyond page load.
- `signInWithOAuth` fixtures — no local OAuth provider configured.
- Two pre-existing, unrelated failures, confirmed via direct diagnosis
  (not assumed) to predate and be untouched by the 2026-09 student-portal
  work: a color-contrast violation on `/results`
  (`text-teal-accent` on `bg-teal-light/60`), and a heading-text mismatch on
  `/student-sign-in` (`assessment-capability-auth.spec.ts`,
  `student-exam-session.spec.ts`). Both worth their own fix; deliberately
  left alone here rather than expanding this repair's scope.
- A local-only, Windows-host-specific flake in full-suite runs (never in
  isolation) — see `e2e-auth-baseline-2026-09.md`'s "Final state" section.
  Watch the first few real CI runs of the `e2e-auth` job to confirm it
  doesn't reproduce on `ubuntu-latest`.

## Guardrails (both suites)

- Anchor assertions to semantic roles, accessible names, and real copy —
  not CSS classes or structural position.
- Prefer the most specific correct locator over a bare `getByText` once a
  page has more than one plausible match; `strict mode violation` errors
  are Playwright telling you the selector, not the app, is ambiguous.
- A component a11y regression (touch target, contrast, missing accessible
  name/role, focus indicator) gets fixed in the component. A test
  assertion that encodes old copy/structure gets fixed in the test. Never
  the reverse — don't loosen an assertion to make a real regression pass.
- No visual screenshot-baseline suite; responsive/layout assertions use
  viewport + overflow + touch-target checks instead
  (`e2e/helpers/screen-helpers.ts`).
