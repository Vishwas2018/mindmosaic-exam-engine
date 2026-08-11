# Test Quality, CI and Release-Gates Audit

## Coverage and method

The repository contains 243 Vitest files (168 unit, 68 component, 7 page), 31 Playwright/E2E specs and a separate RLS configuration. CI has core, RLS and E2E jobs.

| Gate | Audit outcome |
| --- | --- |
| TypeScript | Pass |
| ESLint | Pass |
| Production build | Pass; middleware deprecation warning |
| Question structure | Pass; 965 questions |
| Default correctness | **Fail**; four false-positive findings, 877 editorial warnings |
| Extended published correctness | **Fail**; same four failures, 1,084 editorial warnings |
| Focused critical Vitest | Pass; 21 files / 1,205 tests |
| Full Vitest | Blocked; did not complete within 244 s; isolated retry also remained silent >4 min |
| Bundle gate | **Fail**; `/results` +38 KB, `/showcase` +9 KB over budget |
| Guest Playwright | Blocked; runner did not complete within >5 min |
| Targeted Playwright | Blocked; no output within >2 min against healthy local server |
| RLS suite | Not run; local Supabase/Docker fixture not established |
| Dependency audit | **Fail**; three high-severity groups |
| Formatting | Not applicable; no repository formatting-check script |

## Verified strengths

- Critical pure scoring, all renderers, registries, origin checks, session paths, Stripe webhook/checkout/portal, teacher write routes and child provisioning have focused tests.
- Factory tests include crash/replay safety, fail-closed semantic classifications, hash/provenance and diversity behaviour.
- E2E specifications are unusually broad on keyboard focus, viewport overflow, axe, session flows, legal pages and role dashboards.
- CI separates infrastructure-heavy RLS/E2E jobs from the deterministic core and applies all migrations to a fresh local stack.

## Findings

### P1-linked gate failures

- `MM-AUD-CONT-001`: most bank answers are not independently computable by the gate; warnings do not block publication.
- `MM-AUD-CONT-002`: the checker fails four correct questions and therefore fails the current core CI job.
- `MM-AUD-SEC-001` / `002`: RLS tests cover cross-tenant reads and a prior session-role issue but not trusted-field forgery, fake-class privilege manufacture or arbitrary assignment/mark fields.
- `MM-AUD-FUNC-001` / `TIME-001`: no test covers response loss after successful commit or proves create/resume/submit share the exact governed pattern deadline.

### P2 Medium

- `MM-AUD-CI-001`: the required core job runs both the failing correctness command and the non-completing full suite. The bundle budget is absent from CI despite being repository-defined. RLS/E2E are described as non-required; actual branch protection is unverified externally.
- `MM-AUD-CI-002`: actions use `@v4`/`@v1` movable tags and workflows omit explicit `permissions`. GitHub documents a full commit SHA as the immutable pinning option.
- `MM-AUD-PERF-002`: a real budget exists, disproving the earlier “absent budget” concern, but it currently fails and is not a core gate.

## Risk-based missing-test matrix

| Priority | Missing test | Defect it should detect |
| --- | --- | --- |
| P0/P1 | Browser Supabase client attempts arbitrary `exam_attempts.result` and session fields | Trusted-write bypass |
| P0/P1 | Parent/student creates class, enrols another student UUID, reads victim rows | Manufactured teacher/IDOR path |
| P1 | Sign in with `next=javascript:...` and protocol-relative/external variants | Redirect/XSS |
| P1 | Create and submit every governed pattern at boundary-1/boundary/boundary+grace | Deadline divergence |
| P1 | Drop first successful submit response, retry, recover identical result | Idempotency |
| P1 | Assignment create → student start → autosave → submit → teacher view | Missing lifecycle |
| P1 | Essay submit → mark → student/parent result/aggregate | Stale pending state |
| P1 | Independent semantic gold set for every correctness heuristic | False pass/fail |
| P2 | Two open sessions where newest is submitted | Resume selection |
| P2 | Failure injection after auth-user and assignment-parent writes | Orphan/rollback |
| P2 | 320 px and 400% reflow with every custom interaction | Accessibility gaps |
| P2 | Guest-bank compressed transfer and parse/memory budget | Payload regression |

## Test-quality cautions

Seed determinism tests prove reproducibility, not semantic correctness. Tests that derive expected answers from the same authored key cannot independently validate content. The current checker is independent in intent but heuristic coverage is narrow and demonstrably mis-models four prompts. Test count should not be used as a release-readiness proxy.

## Gaps and blocked verification

No full-suite coverage percentage, clean CI run, authenticated Playwright result or local RLS result was available. GitHub branch protection, required-check selection and Dependabot settings are external and remain unverified rather than reported missing.

## Priorities

Fix the checker before trusting core CI, isolate the full-suite liveness cause, add security/deadline/idempotency lifecycle tests, require bundle/RLS/E2E checks according to release risk, and pin/minimise CI permissions.
